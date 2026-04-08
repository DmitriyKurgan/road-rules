import {
  TicketStatus,
  SessionMode,
  Lang,
  Difficulty,
  TicketImageRole,
} from "./enums";

export interface TicketOption {
  id: string;
  textRu: string;
  textUk: string;
  isCorrect: boolean;
  order: number;
}

export interface Ticket {
  id: string;
  questionRu: string;
  questionUk: string;
  explanationRu: string;
  explanationUk: string;
  pddRef: string;
  difficulty: Difficulty;
  tags: string[];
  status: TicketStatus;
  scenarioHash: string;
  options: TicketOption[];
}

export interface Session {
  id: string;
  userId: string | null;
  mode: SessionMode;
  lang: Lang;
  startedAt: string;
  endedAt: string | null;
  score: number | null;
}

export interface SessionResult {
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  errors: Array<{
    ticketId: string;
    selectedOptionId: string;
    correctOptionId: string;
  }>;
  timeTotal: number;
  passed: boolean;
}

export interface ImageAsset {
  id: string;
  sourceUrl: string;
  storedKey: string;
  license: string;
  author: string;
  title: string;
  attributionHtml: string;
  sha256: string;
}

export interface TicketImage {
  ticketId: string;
  imageId: string;
  role: TicketImageRole;
}

// DTOs
export interface CreateSessionDto {
  mode: SessionMode;
  lang: Lang;
  topics?: string[];
  difficulty?: Difficulty;
}

export interface SubmitAnswerDto {
  ticketId: string;
  selectedOptionId: string;
  timeMs: number;
}

export interface ImportTicketDto {
  questionRu: string;
  questionUk: string;
  explanationRu: string;
  explanationUk: string;
  pddRef: string;
  difficulty: Difficulty;
  tags: string[];
  scenarioHash: string;
  imageBrief?: string;
  imageSearchQueries?: string[];
  options: Array<{
    textRu: string;
    textUk: string;
    isCorrect: boolean;
    order: number;
  }>;
}
