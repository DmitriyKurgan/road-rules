"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useQuizStore } from "@/store/quiz";
import { TicketCard } from "@/components/quiz/TicketCard";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizTimer } from "@/components/quiz/QuizTimer";

export default function QuizPage() {
  const router = useRouter();
  const { sessionId, tickets, currentIndex, mode, isFinished, finishSession } =
    useQuizStore();

  useEffect(() => {
    if (!sessionId) router.push("/");
  }, [sessionId, router]);

  useEffect(() => {
    if (isFinished) router.push("/results");
  }, [isFinished, router]);

  if (!sessionId || tickets.length === 0) return null;

  const currentTicket = tickets[currentIndex];
  const isLastTicket = currentIndex >= tickets.length - 1;

  const handleTimeout = async () => {
    await finishSession();
    router.push("/results");
  };

  if (!currentTicket) return null;

  return (
    <div className="mx-auto flex max-w-[680px] flex-col px-3 py-3 sm:px-4 sm:py-4">
      <div className="mb-3 flex items-center justify-between">
        <QuizProgress current={currentIndex + 1} total={tickets.length} />
        {mode === "EXAM" && <QuizTimer onTimeout={handleTimeout} />}
      </div>
      <AnimatePresence mode="wait">
        <TicketCard
          key={currentTicket.ticketId}
          ticket={currentTicket}
          isLast={isLastTicket}
        />
      </AnimatePresence>
    </div>
  );
}
