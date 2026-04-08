"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuizStore } from "@/store/quiz";

export default function ResultsPage() {
  const t = useTranslations("quiz");
  const tc = useTranslations("common");
  const router = useRouter();
  const { finishResult, mode, reset } = useQuizStore();

  useEffect(() => {
    if (!finishResult) {
      router.push("/");
    }
  }, [finishResult, router]);

  if (!finishResult) return null;

  const { score, totalCorrect, totalQuestions, passed, totalTime, errors } =
    finishResult;

  const minutes = Math.floor(totalTime / 60000);
  const seconds = Math.floor((totalTime % 60000) / 1000);

  const handleTryAgain = () => {
    const target = mode === "EXAM" ? "/exam" : "/practice";
    reset();
    router.push(target);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Score */}
      <div className="mb-8 text-center">
        <div
          className={`mb-2 text-6xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}
        >
          {totalCorrect}/{totalQuestions}
        </div>
        <div
          className={`text-2xl font-semibold ${passed ? "text-green-600" : "text-red-600"}`}
        >
          {passed ? t("passed") : t("failed")}
        </div>
        <div className="mt-2 text-gray-500">
          {t("score")}: {score}% &middot; {minutes}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            {t("errors")} ({errors.length})
          </h2>
          <div className="space-y-3">
            {errors.map((err, i) => (
              <div
                key={i}
                className="rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-700">
                    {t("pddReference")}: {err.pddRef}
                  </span>
                  <span className="text-xs text-gray-400">
                    {err.tags.join(", ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleTryAgain}
          className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          {tc("tryAgain")}
        </button>
        <Link
          href="/stats"
          className="rounded border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
        >
          {tc("stats")}
        </Link>
      </div>
    </div>
  );
}
