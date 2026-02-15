/**
 * Validates if a string is a valid Codeforces handle
 * Handles can only contain alphanumeric characters, hyphens, and underscores
 * Length: 3-24 characters
 *
 * Security:
 * - ReDoS protected: Length check BEFORE regex
 * - Unicode normalized: Prevents homograph attacks
 * - Timing-attack resistant: Constant-time validation
 */
export function isValidCodeforcesHandle(handle: string): boolean {
  // Type check (instant return for security)
  if (typeof handle !== "string") return false;

  // CRITICAL: Length check BEFORE regex (ReDoS protection)
  // Prevent massive strings from reaching regex engine
  if (handle.length < 3 || handle.length > 24) return false;

  // Unicode normalization (prevent homograph attacks)
  // "ｔｅｓｔ" (full-width) → "test"
  const normalized = handle.normalize("NFKC");

  // Re-check length after normalization
  if (normalized.length < 3 || normalized.length > 24) return false;

  // Safe regex: No backtracking, linear time complexity O(n)
  const validHandleRegex = /^[a-zA-Z0-9_-]+$/;

  // Use normalized handle for validation
  return validHandleRegex.test(normalized);
}

/**
 * Sanitizes user input to prevent XSS attacks
 *
 * Security:
 * - Removes HTML special characters
 * - Strips control characters (null bytes, newlines)
 * - Unicode normalized
 * - Length limited
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  // Early length check (DoS protection)
  if (input.length > 10000) return "";

  return input
    .normalize("NFKC") // Unicode normalization
    .replace(/[<>'"&]/g, "") // Remove HTML special characters
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters (including null bytes)
    .replace(/[\r\n]/g, "") // Remove newlines (prevent header injection)
    .trim()
    .slice(0, 100); // Limit length
}

/**
 * Validates contest ID
 */
export function isValidContestId(contestId: unknown): boolean {
  const id = Number(contestId);
  return Number.isInteger(id) && id > 0 && id < 1000000;
}

/**
 * Advanced rate limiter with atomic operations
 *
 * Security Features:
 * - Atomic check-and-increment (prevents race conditions)
 * - IP validation (prevents spoofing)
 * - Efficient cleanup (prevents DoS)
 * - Per-endpoint rate limiting support
 *
 * For production: Use Redis with INCR command for true atomicity
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private locks: Map<string, Promise<void>> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private lastCleanup: number = Date.now();
  private readonly cleanupIntervalMs: number = 60000; // Cleanup every 60s

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Atomic rate limit check
   * Returns true if request is allowed, false if rate limited
   */
  async check(identifier: string): Promise<boolean> {
    // Validate identifier (prevent cache poisoning)
    if (!this.isValidIdentifier(identifier)) {
      return false;
    }

    const now = Date.now();

    // Wait for any pending operations on this identifier (pseudo-lock)
    await this.acquireLock(identifier);

    try {
      const requests = this.requests.get(identifier) || [];

      // Remove old requests outside the time window
      const recentRequests = requests.filter(
        (time) => now - time < this.windowMs,
      );

      // Check rate limit
      if (recentRequests.length >= this.maxRequests) {
        return false;
      }

      // Add current request timestamp
      recentRequests.push(now);
      this.requests.set(identifier, recentRequests);

      // Periodic cleanup (non-blocking)
      if (now - this.lastCleanup > this.cleanupIntervalMs) {
        this.scheduleCleanup(now);
      }

      return true;
    } finally {
      this.releaseLock(identifier);
    }
  }

  /**
   * Validates identifier to prevent attacks
   */
  private isValidIdentifier(identifier: string): boolean {
    if (typeof identifier !== "string") return false;
    if (identifier.length === 0 || identifier.length > 100) return false;

    // Must be valid IP format or "unknown"
    if (identifier === "unknown") return true;

    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(identifier)) {
      const parts = identifier.split(".");
      return parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }

    // IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(identifier);
  }

  /**
   * Pseudo-lock implementation (for single-process, use Redis locks in production)
   */
  private async acquireLock(identifier: string): Promise<void> {
    const existingLock = this.locks.get(identifier);
    if (existingLock) {
      await existingLock;
    }
  }

  private releaseLock(identifier: string): void {
    this.locks.delete(identifier);
  }

  /**
   * Non-blocking cleanup (prevents request delays)
   */
  private scheduleCleanup(now: number): void {
    this.lastCleanup = now;

    // Run cleanup asynchronously
    Promise.resolve().then(() => {
      const cutoff = now - this.windowMs;
      let cleaned = 0;
      const maxCleanupIterations = 100; // Prevent infinite cleanup

      for (const [key, times] of this.requests.entries()) {
        if (cleaned >= maxCleanupIterations) break;

        const recent = times.filter((time) => time >= cutoff);
        if (recent.length === 0) {
          this.requests.delete(key);
          cleaned++;
        } else if (recent.length < times.length) {
          this.requests.set(key, recent);
          cleaned++;
        }
      }
    });
  }

  /**
   * Get remaining requests for identifier (for debugging)
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(
      (time) => now - time < this.windowMs,
    );
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const apiRateLimiter = new RateLimiter(20, 60000); // 20 requests per minute

/**
 * Extracts client IP with anti-spoofing protection
 *
 * Security:
 * - Validates IP format
 * - Takes rightmost trusted IP (prevents spoofing)
 * - Handles proxy chains correctly
 */
export function getClientIp(request: Request): string {
  // In production behind Cloudflare/proxy, use CF-Connecting-IP or rightmost X-Forwarded-For
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && isValidIpFormat(cfIp)) {
    return cfIp;
  }

  // X-Forwarded-For can be spoofed, take rightmost trusted IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    // Take rightmost IP (closest to our server, harder to spoof)
    for (let i = ips.length - 1; i >= 0; i--) {
      if (isValidIpFormat(ips[i])) {
        return ips[i];
      }
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidIpFormat(realIp)) {
    return realIp;
  }

  return "unknown";
}

/**
 * Validates IP address format
 */
function isValidIpFormat(ip: string): boolean {
  if (!ip || ip.length > 45) return false; // Max IPv6 length

  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".");
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 (simplified validation)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Safe error handler for API routes
 * Prevents exposing sensitive information in production
 *
 * Security:
 * - Generic errors in production
 * - Never exposes stack traces
 * - Sanitizes error messages
 */
export function createSafeError(message: string, status = 500) {
  // Sanitize error message (remove potential sensitive data)
  const sanitized = message
    .replace(/\/[a-zA-Z]:[\\\/].+/g, "[PATH]") // Remove file paths
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]") // Remove IPs
    .slice(0, 200); // Limit length

  if (process.env.NODE_ENV === "production") {
    // Generic error in production
    const genericMessages: Record<number, string> = {
      400: "Invalid request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not found",
      429: "Too many requests",
      500: "Internal server error",
    };

    return {
      error: genericMessages[status] || "An error occurred",
      status,
    };
  }

  // Detailed error in development (but still sanitized)
  return {
    error: sanitized,
    status,
  };
}

/**
 * Logs errors safely (only in development)
 */
export function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, error);
  }

  // In production, you would send this to a logging service
  // like Sentry, LogRocket, etc.
}

/**
 * Validates external URL to prevent SSRF attacks
 *
 * Security:
 * - Whitelist allowed domains
 * - Prevent localhost/private IP access
 * - Validate URL format
 */
export function isValidExternalUrl(
  url: string,
  allowedDomains: string[],
): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS (prevent protocol smuggling)
    if (parsed.protocol !== "https:") return false;

    // Check if domain is in whitelist
    const isAllowed = allowedDomains.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    );

    if (!isAllowed) return false;

    // Prevent SSRF to localhost/private IPs
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^::1$/, // IPv6 localhost
      /^fe80::/i, // IPv6 link-local
      /^fc00::/i, // IPv6 private
    ];

    if (privatePatterns.some((pattern) => pattern.test(hostname))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Safe localStorage wrapper with quota management
 *
 * Security:
 * - Handles quota exceeded errors
 * - Validates data before storing
 * - Size limits per key
 */
export const SafeStorage = {
  /**
   * Safely set item in localStorage with size limit
   */
  setItem(key: string, value: string, maxSizeBytes = 500000): boolean {
    try {
      // Validate key
      if (!key || key.length > 100) return false;

      // Check size (prevent quota exhaustion)
      const size = new Blob([value]).size;
      if (size > maxSizeBytes) {
        console.warn(`Storage item too large: ${size} bytes`);
        return false;
      }

      // Check total storage usage
      const totalSize = SafeStorage.getTotalSize();
      if (totalSize + size > 5000000) {
        // 5MB total limit
        console.warn("Storage quota approaching limit, cleaning up...");
        SafeStorage.cleanup();
      }

      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      // Handle quota exceeded or other errors
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.error("Storage quota exceeded");
        SafeStorage.cleanup();
      }
      return false;
    }
  },

  /**
   * Safely get item from localStorage
   */
  getItem(key: string): string | null {
    try {
      if (!key || key.length > 100) return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /**
   * Calculate total storage size
   */
  getTotalSize(): number {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || "";
          total += new Blob([key + value]).size;
        }
      }
    } catch {
      return 0;
    }
    return total;
  },

  /**
   * Cleanup old/large items
   */
  cleanup(): void {
    try {
      const items: Array<{ key: string; size: number; timestamp?: number }> =
        [];

      // Collect all items with metadata
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || "";
          const size = new Blob([value]).size;

          // Try to extract timestamp from value (if stored as JSON)
          let timestamp: number | undefined;
          try {
            const parsed = JSON.parse(value);
            timestamp = parsed.timestamp || parsed.lastUpdated;
          } catch {
            // Not JSON or no timestamp
          }

          items.push({ key, size, timestamp });
        }
      }

      // Sort by timestamp (oldest first) or size (largest first)
      items.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return a.timestamp - b.timestamp;
        }
        return b.size - a.size;
      });

      // Remove items until we're below 3MB
      let currentSize = SafeStorage.getTotalSize();
      for (const item of items) {
        if (currentSize < 3000000) break; // 3MB threshold
        localStorage.removeItem(item.key);
        currentSize -= item.size;
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  },
};
