"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useQuizStore } from "@/store/quiz";

export function QuizProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const t = useTranslations("quiz");
  const tickets = useQuizStore((s) => s.tickets);
  const errorCount = tickets
    .slice(0, current)
    .filter((t) => t.answer && !t.answer.isCorrect).length;

  const percent = (current / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums sm:text-sm">
        {current}<span className="text-[var(--text-muted)]">/{total}</span>
      </span>

      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-secondary)] sm:h-2 sm:w-44">
        <motion.div
          className="progress-gradient absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="progress-glow absolute inset-0" />
        </motion.div>
      </div>

      {errorCount > 0 && (
        <span className="rounded-lg bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
          {t("errors")}: {errorCount}
        </span>
      )}
    </div>
  );
}
