"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;

export default function ReportBug() {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [charCount, setCharCount] = useState(0);

  const MAX_LENGTH = 2000;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isReportOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isReportOpen]);

  const showToast = useCallback((type: ToastType, msg: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message: msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClose = () => {
    if (!loading) {
      setIsReportOpen(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_LENGTH) {
      setMessage(val);
      setCharCount(val.length);
    }
  };

  const sendReport = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      showToast("error", "Please describe the issue before sending.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        showToast("success", "Bug report sent successfully. Thank you!");
        setMessage("");
        setCharCount(0);
        setIsReportOpen(false);
      } else if (res.status === 429) {
        showToast(
          "error",
          data.error || "Too many reports. Please wait a few minutes.",
        );
      } else {
        showToast("error", data.error || "Failed to send report. Try again.");
      }
    } catch {
      showToast("error", "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!isReportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReportOpen, loading]);

  const modalContent = isReportOpen ? (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 space-y-4 animate-fade-in-up relative"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all disabled:opacity-50"
          title="Close"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--danger-bg)] flex items-center justify-center">
            <i className="fa-solid fa-bug text-[var(--danger)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Report a Bug
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Help us improve Solrise
            </p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={message}
            onChange={handleMessageChange}
            placeholder="Describe the issue in detail..."
            rows={4}
            disabled={loading}
            className="w-full p-3 text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] resize-none transition-all disabled:opacity-60"
          />
          <span
            className={`absolute bottom-3 right-3 text-[10px] font-medium ${
              charCount > MAX_LENGTH * 0.9
                ? "text-[var(--danger)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {charCount}/{MAX_LENGTH}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={handleClose}
            disabled={loading}
            className="btn-ghost text-sm"
          >
            Cancel
          </button>
          <button
            onClick={sendReport}
            disabled={loading || message.trim().length === 0}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-xs" /> Sending…
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane text-xs" /> Send Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const toastContainer =
    toasts.length > 0 ? (
      <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-fade-in-up ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            <i
              className={`fa-solid ${
                toast.type === "success" ? "fa-circle-check" : "fa-circle-xmark"
              } text-base`}
            />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <i className="fa-solid fa-xmark text-[10px]" />
            </button>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <>
      <button
        onClick={() => setIsReportOpen(true)}
        className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--danger-bg)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-all duration-200"
        title="Report a bug"
      >
        <i className="fa-solid fa-bug text-sm" />
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
      {mounted && toastContainer && createPortal(toastContainer, document.body)}
    </>
  );
}
