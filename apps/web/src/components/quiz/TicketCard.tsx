"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuizStore } from "@/store/quiz";

interface TicketCardProps {
  ticket: {
    ticketId: string;
    question: { ru: string; uk: string };
    pddRef: string;
    options: Array<{
      id: string;
      order: number;
      textRu: string;
      textUk: string;
    }>;
    images?: Array<{
      url: string;
      title: string;
      attributionHtml: string;
    }>;
  };
  isLast: boolean;
}

export function TicketCard({ ticket, isLast }: TicketCardProps) {
  const t = useTranslations("quiz");
  const tc = useTranslations("common");
  const router = useRouter();
  const { lang, submitAnswer, nextTicket, finishSession, lastAnswer } =
    useQuizStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ticketStartTime = useRef(Date.now());

  const answered = lastAnswer !== null;

  const handleSelect = async (optionId: string) => {
    if (answered || isSubmitting) return;
    setSelectedId(optionId);
    setIsSubmitting(true);

    const timeMs = Date.now() - ticketStartTime.current;
    try {
      await submitAnswer(ticket.ticketId, optionId, timeMs);
    } catch {
      // allow retry on error
      setSelectedId(null);
    }
    setIsSubmitting(false);
  };

  const handleNext = () => {
    setSelectedId(null);
    ticketStartTime.current = Date.now();
    nextTicket();
  };

  const handleFinish = async () => {
    await finishSession();
    router.push("/results");
  };

  const getOptionStyle = (optionId: string) => {
    if (!answered) {
      return "border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer";
    }
    if (optionId === lastAnswer.correctOptionId) {
      return "border-green-500 bg-green-50";
    }
    if (optionId === selectedId && !lastAnswer.isCorrect) {
      return "border-red-500 bg-red-50";
    }
    return "border-gray-200 opacity-60";
  };

  const questionText = lang === "uk" ? ticket.question.uk : ticket.question.ru;

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      {/* Question */}
      <div className="mb-6">
        <p className="mb-1 text-xs text-gray-400">
          {t("pddReference")}: {ticket.pddRef}
        </p>
        <h2 className="text-lg font-semibold text-gray-900">{questionText}</h2>
      </div>

      {/* Image */}
      {ticket.images && ticket.images.length > 0 && (
        <div className="mb-6 flex justify-center">
          <div className="text-center">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001"}${ticket.images[0].url}`}
              alt={ticket.images[0].title}
              className="mx-auto max-h-48 rounded-lg object-contain"
            />
            <p className="mt-1 text-xs text-gray-400">
              {ticket.images[0].title}
            </p>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="mb-6 space-y-3">
        {ticket.options.map((option) => {
          const text = lang === "uk" ? option.textUk : option.textRu;
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={answered || isSubmitting}
              className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors ${getOptionStyle(option.id)}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 text-sm font-bold text-gray-500">
                {String.fromCharCode(64 + option.order)}
              </span>
              <span className="text-gray-800">{text}</span>
              {answered && option.id === lastAnswer.correctOptionId && (
                <span className="ml-auto text-green-600">&#10003;</span>
              )}
              {answered &&
                option.id === selectedId &&
                !lastAnswer.isCorrect && (
                  <span className="ml-auto text-red-600">&#10007;</span>
                )}
            </button>
          );
        })}
      </div>

      {/* Answer feedback */}
      {answered && (
        <div
          className={`mb-6 rounded-lg p-4 ${lastAnswer.isCorrect ? "bg-green-50" : "bg-amber-50"}`}
        >
          <p
            className={`mb-1 font-semibold ${lastAnswer.isCorrect ? "text-green-700" : "text-amber-700"}`}
          >
            {lastAnswer.isCorrect ? t("correctAnswer") : t("explanation")}
          </p>
          <p className="text-sm text-gray-700">
            {lang === "uk"
              ? lastAnswer.explanation.uk
              : lastAnswer.explanation.ru}
          </p>
        </div>
      )}

      {/* Navigation */}
      {answered && (
        <div className="flex justify-end">
          {isLast ? (
            <button
              onClick={handleFinish}
              className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              {tc("finish")}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              {tc("next")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
