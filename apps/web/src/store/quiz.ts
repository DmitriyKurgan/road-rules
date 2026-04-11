import { create } from "zustand";
import api from "@/lib/api";

interface QuizOption {
  id: string;
  order: number;
  textRu: string;
  textUk: string;
  isCorrect?: boolean;
}

interface QuizTicket {
  sessionTicketId: string;
  ticketId: string;
  order: number;
  question: { ru: string; uk: string };
  pddRef: string;
  difficulty: string;
  options: QuizOption[];
  correctOptionId: string | null;
  explanation: { ru: string; uk: string };
  images?: Array<{
    url: string;
    title: string;
    attributionHtml: string;
  }>;
  answer: {
    selectedOptionId: string;
    isCorrect: boolean;
  } | null;
}

interface AnswerResult {
  isCorrect: boolean;
  correctOptionId: string;
  explanation: { ru: string; uk: string };
  pddRef: string;
  nextTicketId: string | null;
}

interface FinishResult {
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  passed: boolean;
  totalTime: number;
  errors: Array<{
    ticketId: string;
    pddRef: string;
    tags: string[];
    selectedOptionId: string;
  }>;
}

interface QuizState {
  sessionId: string | null;
  mode: "EXAM" | "PRACTICE" | null;
  lang: "ru" | "uk";
  tickets: QuizTicket[];
  currentIndex: number;
  lastAnswer: AnswerResult | null;
  finishResult: FinishResult | null;
  isFinished: boolean;
  isLoading: boolean;
  startTime: number | null;

  startSession: (
    mode: "EXAM" | "PRACTICE",
    lang: "ru" | "uk",
  ) => Promise<void>;
  submitAnswer: (
    ticketId: string,
    optionId: string,
    timeMs: number,
  ) => AnswerResult;
  nextTicket: () => void;
  finishSession: () => Promise<FinishResult>;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  sessionId: null,
  mode: null,
  lang: "ru",
  tickets: [],
  currentIndex: 0,
  lastAnswer: null,
  finishResult: null,
  isFinished: false,
  isLoading: false,
  startTime: null,

  startSession: async (mode, lang) => {
    set({ isLoading: true });
    // Create session
    const createRes = await api.post("/sessions", { mode, lang });
    const sessionId = createRes.data.id;
    // Fetch full session data with questions
    const sessionRes = await api.get(`/sessions/${sessionId}`);
    set({
      sessionId,
      mode,
      lang,
      tickets: sessionRes.data.tickets,
      currentIndex: 0,
      lastAnswer: null,
      finishResult: null,
      isFinished: false,
      isLoading: false,
      startTime: Date.now(),
    });
  },

  submitAnswer: (ticketId, optionId, timeMs) => {
    const { sessionId, tickets } = get();
    const ticket = tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const correctOptionId = ticket.correctOptionId || "";
    const isCorrect = optionId === correctOptionId;

    const result: AnswerResult = {
      isCorrect,
      correctOptionId,
      explanation: ticket.explanation,
      pddRef: ticket.pddRef,
      nextTicketId: null,
    };

    // Immediately update local state — zero latency UI
    set({ lastAnswer: result });

    // Record answer on backend in background (fire-and-forget)
    api
      .post(`/sessions/${sessionId}/answer`, {
        ticketId,
        selectedOptionId: optionId,
        timeMs,
      })
      .catch(() => {
        // Silently ignore; finish will still work even if some answers didn't record
      });

    return result;
  },

  nextTicket: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      lastAnswer: null,
    })),

  finishSession: async () => {
    const { sessionId } = get();
    const res = await api.post(`/sessions/${sessionId}/finish`);
    const result: FinishResult = res.data;
    set({ finishResult: result, isFinished: true });
    return result;
  },

  reset: () =>
    set({
      sessionId: null,
      mode: null,
      tickets: [],
      currentIndex: 0,
      lastAnswer: null,
      finishResult: null,
      isFinished: false,
      isLoading: false,
      startTime: null,
    }),
}));
