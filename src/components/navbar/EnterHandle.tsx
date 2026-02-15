"use client";

import React, { useState, useEffect, useRef } from "react";
import { isValidCodeforcesHandle, sanitizeInput } from "@/utils/security";

interface EnterHandleProps {
  onSubmitHandle: (handle: string) => Promise<void>;
  onClear?: () => void;
  isLoading?: boolean;
}

const EnterHandle: React.FC<EnterHandleProps> = ({
  onSubmitHandle,
  onClear,
  isLoading = false,
}) => {
  const [handle, setHandle] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-clear error after 6 seconds
  useEffect(() => {
    if (error) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(null), 6000);
      return () => {
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      };
    }
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHandle(e.target.value);
    if (error) setError(null);
  };

  const submit = async () => {
    const trimmed = sanitizeInput(handle.trim());
    if (!trimmed) return;

    setError(null);

    if (!isValidCodeforcesHandle(trimmed)) {
      setError(
        "Invalid format. Use letters, numbers, hyphens, or underscores (3-24 chars).",
      );
      return;
    }

    setHandle("");
    try {
      setLocalLoading(true);
      await onSubmitHandle(trimmed);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  const busy = localLoading || isLoading;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <i className="fa-solid fa-at absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs" />
          <input
            type="text"
            value={handle}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="e.g. tourist"
            className={`pl-8 pr-3 py-2 w-[200px] rounded-lg border bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 transition-all ${
              error
                ? "border-[var(--danger)] focus:ring-[var(--danger)]/30 focus:border-[var(--danger)]"
                : "border-[var(--border-color)] focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
            }`}
            disabled={busy}
          />
        </div>
        <button
          onClick={submit}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-50"
          disabled={busy}
          title={busy ? "Loading user data\u2026" : "Submit handle"}
        >
          {busy ? (
            <>
              <i className="fa-solid fa-spinner fa-spin text-xs" />
              Loading
            </>
          ) : (
            <>Go</>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 mt-2 z-50 animate-fade-in-up">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger)]/20 shadow-lg max-w-[320px]">
            <i className="fa-solid fa-circle-exclamation text-[var(--danger)] text-xs shrink-0" />
            <span className="text-xs text-[var(--danger)] font-medium leading-tight">
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-[var(--danger)]/60 hover:text-[var(--danger)] transition-colors shrink-0"
              aria-label="Dismiss error"
            >
              <i className="fa-solid fa-xmark text-[10px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterHandle;
