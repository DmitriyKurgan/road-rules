import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string) {
    // All finished sessions for this user
    const sessions = await this.prisma.session.findMany({
      where: { userId, endedAt: { not: null } },
      select: { id: true, score: true, startedAt: true, mode: true },
      orderBy: { startedAt: 'desc' },
    });

    const totalSessions = sessions.length;
    const scores = sessions.map((s) => s.score ?? 0);
    const avgScore =
      totalSessions > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / totalSessions)
        : 0;
    const bestScore = totalSessions > 0 ? Math.max(...scores) : 0;

    // Current streak: consecutive sessions with score >= 90 (passed) from most recent
    let currentStreak = 0;
    for (const s of sessions) {
      if ((s.score ?? 0) >= 90) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Accuracy by difficulty
    const accuracyByDifficulty = await this.prisma.$queryRaw<
      { difficulty: string; total: bigint; correct: bigint }[]
    >`
      SELECT t.difficulty,
             COUNT(sa.id)::bigint as total,
             COUNT(sa.id) FILTER (WHERE sa."isCorrect" = true)::bigint as correct
      FROM session_answers sa
      JOIN session_tickets st ON st.id = sa."sessionTicketId"
      JOIN sessions s ON s.id = st."sessionId"
      JOIN tickets t ON t.id = st."ticketId"
      WHERE s."userId" = ${userId}
      GROUP BY t.difficulty
    `;

    // Sessions over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessionsOverTime = await this.prisma.$queryRaw<
      { date: string; count: bigint; avg_score: number }[]
    >`
      SELECT DATE("startedAt") as date,
             COUNT(*)::bigint as count,
             ROUND(AVG(score))::int as avg_score
      FROM sessions
      WHERE "userId" = ${userId}
        AND "endedAt" IS NOT NULL
        AND "startedAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("startedAt")
      ORDER BY date DESC
    `;

    return {
      totalSessions,
      avgScore,
      bestScore,
      currentStreak,
      accuracyByDifficulty: accuracyByDifficulty.map((r) => ({
        difficulty: r.difficulty,
        total: Number(r.total),
        correct: Number(r.correct),
        accuracy:
          Number(r.total) > 0
            ? Math.round((Number(r.correct) / Number(r.total)) * 100)
            : 0,
      })),
      sessionsOverTime: sessionsOverTime.map((r) => ({
        date: r.date,
        count: Number(r.count),
        avgScore: r.avg_score,
      })),
    };
  }

  async getTopicStats(userId: string) {
    // Get all answers for this user's sessions, with ticket tags
    const answers = await this.prisma.sessionAnswer.findMany({
      where: {
        sessionTicket: {
          session: { userId },
        },
      },
      select: {
        isCorrect: true,
        sessionTicket: {
          select: {
            ticket: {
              select: { tags: true },
            },
          },
        },
      },
    });

    // Aggregate by tag
    const tagStats = new Map<string, { total: number; correct: number }>();

    for (const answer of answers) {
      const tags = answer.sessionTicket.ticket.tags;
      for (const tag of tags) {
        const existing = tagStats.get(tag) || { total: 0, correct: 0 };
        existing.total++;
        if (answer.isCorrect) existing.correct++;
        tagStats.set(tag, existing);
      }
    }

    const topics = Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        totalAnswered: stats.total,
        correct: stats.correct,
        accuracy: Math.round((stats.correct / stats.total) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    // Weakest topics: lowest accuracy, at least 2 answers
    const weakest = topics
      .filter((t) => t.totalAnswered >= 2)
      .slice(0, 5)
      .map((t) => t.tag);

    return { topics, weakest };
  }

  async getSessionHistory(userId: string, page = 1, pageSize = 20) {
    const where = { userId, endedAt: { not: null } } as const;

    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        select: {
          id: true,
          mode: true,
          lang: true,
          score: true,
          startedAt: true,
          endedAt: true,
          tickets: {
            select: { id: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      data: data.map((s) => ({
        id: s.id,
        mode: s.mode,
        lang: s.lang,
        score: s.score,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        ticketCount: s.tickets.length,
      })),
      total,
      page,
      pageSize,
    };
  }
}
