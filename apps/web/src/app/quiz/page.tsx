"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quiz";
import { TicketCard } from "@/components/quiz/TicketCard";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizTimer } from "@/components/quiz/QuizTimer";

export default function QuizPage() {
  const router = useRouter();
  const { sessionId, tickets, currentIndex, mode, isFinished, finishSession } =
    useQuizStore();

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (isFinished) {
      router.push("/results");
    }
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <QuizProgress current={currentIndex + 1} total={tickets.length} />
        {mode === "EXAM" && <QuizTimer onTimeout={handleTimeout} />}
      </div>
      <TicketCard ticket={currentTicket} isLast={isLastTicket} />
    </div>
  );
}
