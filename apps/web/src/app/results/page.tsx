"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useQuizStore } from "@/store/quiz";

export default function ResultsPage() {
  const t = useTranslations("quiz");
  const tc = useTranslations("common");
  const router = useRouter();
  const { finishResult, mode, reset } = useQuizStore();

  useEffect(() => {
    if (!finishResult) router.push("/");
  }, [finishResult, router]);

  if (!finishResult) return null;

  const { score, totalCorrect, totalQuestions, passed, totalTime, errors } = finishResult;
  const minutes = Math.floor(totalTime / 60000);
  const seconds = Math.floor((totalTime % 60000) / 1000);

  const handleTryAgain = () => {
    const target = mode === "EXAM" ? "/exam" : "/practice";
    reset();
    router.push(target);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-lg p-8"
      >
        {/* Score */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold ${
              passed
                ? "bg-green-500/10 text-green-500 ring-4 ring-green-500/20"
                : "bg-red-500/10 text-red-500 ring-4 ring-red-500/20"
            }`}
          >
            {totalCorrect}/{totalQuestions}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className={`text-2xl font-bold ${passed ? "text-green-500" : "text-red-500"}`}>
              {passed ? t("passed") : t("failed")}
            </div>
            <div className="mt-2 text-sm text-[var(--text-muted)]">
              {t("score")}: {score}% · {minutes}:{String(seconds).padStart(2, "0")}
            </div>
          </motion.div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
              {t("errors")} ({errors.length})
            </h2>
            <div className="space-y-2">
              {errors.map((err, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3"
                >
                  <span className="text-sm font-medium text-red-500 dark:text-red-400">
                    {t("pddReference")}: {err.pddRef}
                  </span>
                  <span className="ml-2 text-xs text-[var(--text-muted)]">
                    {err.tags.join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <button
            onClick={handleTryAgain}
            className="spring-transition flex-1 rounded-2xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
          >
            {tc("tryAgain")}
          </button>
          <Link
            href="/stats"
            className="spring-transition glass-card flex-1 py-3 text-center font-semibold text-[var(--text-primary)]"
          >
            {tc("stats")}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
