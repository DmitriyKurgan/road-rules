"use client";

import { useState, useEffect, useCallback } from "react";

const EXAM_DURATION = 20 * 60;

export function QuizTimer({ onTimeout }: { onTimeout: () => void }) {
  const [remaining, setRemaining] = useState(EXAM_DURATION);
  const handleTimeout = useCallback(() => onTimeout(), [onTimeout]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [handleTimeout]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining < 120;

  return (
    <div
      className={`rounded-xl px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${
        isUrgent
          ? "bg-red-500/10 text-red-500 animate-pulse"
          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
      }`}
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
