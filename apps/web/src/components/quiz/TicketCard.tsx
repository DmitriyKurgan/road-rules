"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isLocked, setIsLocked] = useState(false);
  const ticketStartTime = useRef(0);

  useEffect(() => {
    ticketStartTime.current = performance.now();
  }, [ticket.ticketId]);

  const answered = lastAnswer !== null;

  const handleSelect = async (optionId: string) => {
    if (answered || isSubmitting || isLocked) return;
    setIsLocked(true);
    setSelectedId(optionId);
    setIsSubmitting(true);
    // eslint-disable-next-line react-hooks/purity
    const timeMs = Math.round(performance.now() - ticketStartTime.current);
    try {
      await submitAnswer(ticket.ticketId, optionId, timeMs);
    } catch {
      setSelectedId(null);
      setIsLocked(false);
    }
    setIsSubmitting(false);
  };

  const handleNext = () => {
    setSelectedId(null);
    setIsLocked(false);
    nextTicket();
  };

  const handleFinish = async () => {
    await finishSession();
    router.push("/results");
  };

  const getOptionStyle = (optionId: string) => {
    if (!answered) {
      if (optionId === selectedId && isSubmitting)
        return "border-teal-400 bg-[var(--glow-blue)] scale-[0.98]";
      return "border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--glow-blue)] hover:scale-[1.01] cursor-pointer";
    }
    if (optionId === lastAnswer.correctOptionId)
      return "border-green-500/50 bg-[var(--glow-green)]";
    if (optionId === selectedId && !lastAnswer.isCorrect)
      return "border-red-500/50 bg-[var(--glow-red)]";
    return "border-[var(--border-subtle)] opacity-40";
  };

  const questionText = lang === "uk" ? ticket.question.uk : ticket.question.ru;
  const letters = ["A", "B", "C", "D"];
  const hasImage = ticket.images && ticket.images.length > 0;

  return (
    <motion.div
      key={ticket.ticketId}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-4 sm:p-5"
    >
      {/* Header: ref + question */}
      <div className="mb-1">
        <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-600 dark:text-teal-400">
          {ticket.pddRef}
        </span>
      </div>
      <h2 className="mb-3 text-[15px] font-semibold leading-snug text-[var(--text-primary)] sm:text-base">
        {questionText}
      </h2>

      {/* Image — compact */}
      {hasImage && (
        <div className="mb-3 flex justify-center">
          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001"}${ticket.images![0].url}`}
              alt={ticket.images![0].title}
              className="mx-auto max-h-24 object-contain sm:max-h-28"
            />
          </div>
        </div>
      )}

      {/* Options — compact */}
      <div className="mb-3 space-y-2">
        {ticket.options.map((option, idx) => {
          const text = lang === "uk" ? option.textUk : option.textRu;
          const isCorrect = answered && option.id === lastAnswer.correctOptionId;
          const isWrong = answered && option.id === selectedId && !lastAnswer.isCorrect;

          return (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={answered || isSubmitting}
              animate={isWrong ? { x: [0, -5, 5, -3, 3, 0] } : {}}
              transition={isWrong ? { duration: 0.35 } : {}}
              className={`spring-transition flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm ${getOptionStyle(option.id)}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold spring-transition ${
                  isCorrect
                    ? "bg-green-500 text-white"
                    : isWrong
                      ? "bg-red-500 text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
              >
                {isCorrect ? "✓" : isWrong ? "✕" : letters[idx]}
              </span>
              <span className="text-[var(--text-primary)] leading-snug">{text}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Answer feedback — inline compact */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className={`mb-3 rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${
                lastAnswer.isCorrect
                  ? "bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400"
              }`}
            >
              <span className="font-semibold">
                {lastAnswer.isCorrect ? "✓ " : ""}
                {lastAnswer.isCorrect ? t("correctAnswer") : t("explanation")}:
              </span>{" "}
              <span className="text-[var(--text-secondary)]">
                {lang === "uk" ? lastAnswer.explanation.uk : lastAnswer.explanation.ru}
              </span>
            </div>

            {/* Action button */}
            <div className="flex justify-end">
              {isLast ? (
                <button
                  onClick={handleFinish}
                  className="spring-transition rounded-xl bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  {tc("finish")}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="spring-transition rounded-xl bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  {tc("next")} →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
