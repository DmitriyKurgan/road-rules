"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useQuizStore } from "@/store/quiz";

export default function ExamPage() {
  const t = useTranslations("common");
  const router = useRouter();
  const { startSession, isLoading } = useQuizStore();
  const [lang, setLang] = useState<"ru" | "uk">("ru");
  const [error, setError] = useState("");

  const handleStart = async () => {
    setError("");
    try {
      await startSession("EXAM", lang);
      router.push("/quiz");
    } catch {
      setError("Failed to start session");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-md p-8 text-center"
      >
        <div className="mb-2 text-4xl">🎓</div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">{t("exam")}</h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          {lang === "ru"
            ? "20 вопросов · 20 минут · не более 2 ошибок"
            : "20 питань · 20 хвилин · не більше 2 помилок"}
        </p>

        <div className="mb-8 flex justify-center gap-3">
          {(["ru", "uk"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`spring-transition rounded-xl px-5 py-2.5 text-sm font-medium ${
                lang === l
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "glass-card text-[var(--text-secondary)]"
              }`}
            >
              {l === "ru" ? "Русский" : "Українська"}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleStart}
          disabled={isLoading}
          className="spring-transition w-full rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 py-3.5 text-lg font-semibold text-white hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
        >
          {isLoading ? t("loading") : t("start")}
        </button>
      </motion.div>
    </div>
  );
}
