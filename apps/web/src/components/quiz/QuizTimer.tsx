"use client";

import { useState, useEffect, useCallback } from "react";

const EXAM_DURATION = 20 * 60; // 20 minutes in seconds

export function QuizTimer({ onTimeout }: { onTimeout: () => void }) {
  const [remaining, setRemaining] = useState(EXAM_DURATION);

  const handleTimeout = useCallback(onTimeout, [onTimeout]);

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
    <span
      className={`font-mono text-lg font-bold ${isUrgent ? "text-red-600" : "text-gray-700"}`}
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}
