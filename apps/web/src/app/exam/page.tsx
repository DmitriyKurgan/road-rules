"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
    <div className="mx-auto mt-20 max-w-lg text-center">
      <h1 className="mb-2 text-3xl font-bold dark:text-white">{t("exam")}</h1>
      <p className="mb-8 text-gray-500 dark:text-gray-400">
        {lang === "ru"
          ? "20 вопросов за 20 минут. Допускается не более 2 ошибок."
          : "20 питань за 20 хвилин. Допускається не більше 2 помилок."}
      </p>
      <div className="mb-6 flex justify-center gap-4">
        <button
          onClick={() => setLang("ru")}
          className={`rounded px-4 py-2 ${lang === "ru" ? "bg-blue-600 text-white" : "border dark:border-gray-600 dark:text-gray-300"}`}
        >
          Русский
        </button>
        <button
          onClick={() => setLang("uk")}
          className={`rounded px-4 py-2 ${lang === "uk" ? "bg-blue-600 text-white" : "border dark:border-gray-600 dark:text-gray-300"}`}
        >
          Українська
        </button>
      </div>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <button
        onClick={handleStart}
        disabled={isLoading}
        className="rounded bg-red-600 px-8 py-3 text-lg text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isLoading ? t("loading") : t("start")}
      </button>
    </div>
  );
}
