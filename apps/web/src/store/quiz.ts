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
  ) => Promise<AnswerResult>;
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

  submitAnswer: async (ticketId, optionId, timeMs) => {
    const { sessionId } = get();
    const res = await api.post(`/sessions/${sessionId}/answer`, {
      ticketId,
      selectedOptionId: optionId,
      timeMs,
    });
    const result: AnswerResult = res.data;
    set({ lastAnswer: result });
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
