-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('EXAM', 'PRACTICE');

-- CreateEnum
CREATE TYPE "Lang" AS ENUM ('ru', 'uk');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "TicketImageRole" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "questionRu" TEXT NOT NULL,
    "questionUk" TEXT NOT NULL,
    "explanationRu" TEXT NOT NULL,
    "explanationUk" TEXT NOT NULL,
    "pddRef" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "tags" TEXT[],
    "status" "TicketStatus" NOT NULL DEFAULT 'DRAFT',
    "scenarioHash" TEXT NOT NULL,
    "imageBrief" TEXT,
    "imageSearchQ" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_options" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "textRu" TEXT NOT NULL,
    "textUk" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ticket_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_assets" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "storedKey" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "attributionHtml" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_images" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "role" "TicketImageRole" NOT NULL DEFAULT 'PRIMARY',

    CONSTRAINT "ticket_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "mode" "SessionMode" NOT NULL,
    "lang" "Lang" NOT NULL DEFAULT 'ru',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "score" INTEGER,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_tickets" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "session_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_answers" (
    "id" TEXT NOT NULL,
    "sessionTicketId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_scenarioHash_key" ON "tickets"("scenarioHash");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_difficulty_idx" ON "tickets"("difficulty");

-- CreateIndex
CREATE INDEX "tickets_tags_idx" ON "tickets" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_options_ticketId_order_key" ON "ticket_options"("ticketId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "image_assets_storedKey_key" ON "image_assets"("storedKey");

-- CreateIndex
CREATE UNIQUE INDEX "image_assets_sha256_key" ON "image_assets"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_images_ticketId_role_key" ON "ticket_images"("ticketId", "role");

-- CreateIndex
CREATE INDEX "sessions_userId_startedAt_idx" ON "sessions"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "session_tickets_sessionId_order_key" ON "session_tickets"("sessionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "session_tickets_sessionId_ticketId_key" ON "session_tickets"("sessionId", "ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "session_answers_sessionTicketId_key" ON "session_answers"("sessionTicketId");

-- AddForeignKey
ALTER TABLE "ticket_options" ADD CONSTRAINT "ticket_options_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_images" ADD CONSTRAINT "ticket_images_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_images" ADD CONSTRAINT "ticket_images_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "image_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_tickets" ADD CONSTRAINT "session_tickets_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_tickets" ADD CONSTRAINT "session_tickets_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_sessionTicketId_fkey" FOREIGN KEY ("sessionTicketId") REFERENCES "session_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "ticket_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
