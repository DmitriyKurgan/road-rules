import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private ticketsService: TicketsService,
  ) {}

  async create(dto: CreateSessionDto, userId?: string) {
    const ticketIds = await this.ticketsService.selectForSession({
      count: 20,
      topics: dto.topics,
      difficulty: dto.difficulty,
    });

    const session = await this.prisma.session.create({
      data: {
        mode: dto.mode,
        lang: dto.lang,
        userId: userId || null,
        tickets: {
          create: ticketIds.map((ticketId, index) => ({
            ticketId,
            order: index + 1,
          })),
        },
      },
      include: {
        tickets: {
          orderBy: { order: 'asc' },
          select: { id: true, ticketId: true, order: true },
        },
      },
    });

    return {
      id: session.id,
      mode: session.mode,
      lang: session.lang,
      startedAt: session.startedAt,
      ticketCount: session.tickets.length,
      tickets: session.tickets,
    };
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tickets: {
          orderBy: { order: 'asc' },
          include: {
            ticket: {
              include: {
                options: { orderBy: { order: 'asc' } },
                images: { include: { image: true } },
              },
            },
            answer: {
              select: {
                id: true,
                selectedOptionId: true,
                isCorrect: true,
                timeMs: true,
                answeredAt: true,
              },
            },
          },
        },
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    const totalAnswered = session.tickets.filter(
      (t) => t.answer !== null,
    ).length;
    const totalCorrect = session.tickets.filter(
      (t) => t.answer?.isCorrect,
    ).length;
    const currentTicketOrder =
      totalAnswered < session.tickets.length ? totalAnswered + 1 : null;

    return {
      id: session.id,
      mode: session.mode,
      lang: session.lang,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      score: session.score,
      totalAnswered,
      totalCorrect,
      currentTicketOrder,
      tickets: session.tickets.map((st) => {
        const correctOption = st.ticket.options.find((o) => o.isCorrect);
        return {
          sessionTicketId: st.id,
          order: st.order,
          ticketId: st.ticketId,
          question: {
            ru: st.ticket.questionRu,
            uk: st.ticket.questionUk,
          },
          pddRef: st.ticket.pddRef,
          difficulty: st.ticket.difficulty,
          options: st.ticket.options.map((o) => ({
            id: o.id,
            order: o.order,
            textRu: o.textRu,
            textUk: o.textUk,
            isCorrect: o.isCorrect,
          })),
          correctOptionId: correctOption?.id || null,
          explanation: {
            ru: st.ticket.explanationRu,
            uk: st.ticket.explanationUk,
          },
          images: st.ticket.images.map((ti: any) => ({
            url: ti.image.externalUrl || `/uploads/images/${ti.image.storedKey}`,
            title: ti.image.title,
            attributionHtml: ti.image.attributionHtml,
          })),
          answer: st.answer,
        };
      }),
    };
  }

  async submitAnswer(sessionId: string, dto: SubmitAnswerDto) {
    // Find the session ticket
    const sessionTicket = await this.prisma.sessionTicket.findFirst({
      where: {
        sessionId,
        ticketId: dto.ticketId,
      },
      include: {
        session: true,
        answer: true,
        ticket: {
          include: {
            options: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!sessionTicket) {
      throw new NotFoundException('Ticket not found in this session');
    }

    if (sessionTicket.session.endedAt) {
      throw new BadRequestException('Session already finished');
    }

    if (sessionTicket.answer) {
      throw new BadRequestException('This ticket was already answered');
    }

    // Verify option belongs to this ticket
    const selectedOption = sessionTicket.ticket.options.find(
      (o) => o.id === dto.selectedOptionId,
    );
    if (!selectedOption) {
      throw new BadRequestException(
        'Selected option does not belong to this ticket',
      );
    }

    // Find correct option
    const correctOption = sessionTicket.ticket.options.find((o) => o.isCorrect);

    const isCorrect = selectedOption.isCorrect;

    // Create the answer
    await this.prisma.sessionAnswer.create({
      data: {
        sessionTicketId: sessionTicket.id,
        selectedOptionId: dto.selectedOptionId,
        isCorrect,
        timeMs: dto.timeMs,
      },
    });

    // Find next unanswered ticket
    const nextTicket = await this.prisma.sessionTicket.findFirst({
      where: {
        sessionId,
        answer: null,
        order: { gt: sessionTicket.order },
      },
      orderBy: { order: 'asc' },
      select: { ticketId: true, order: true },
    });

    return {
      isCorrect,
      correctOptionId: correctOption?.id,
      explanation: {
        ru: sessionTicket.ticket.explanationRu,
        uk: sessionTicket.ticket.explanationUk,
      },
      pddRef: sessionTicket.ticket.pddRef,
      nextTicketId: nextTicket?.ticketId || null,
      nextOrder: nextTicket?.order || null,
    };
  }

  async finish(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tickets: {
          include: {
            answer: true,
            ticket: { select: { tags: true, pddRef: true } },
          },
        },
      },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.endedAt)
      throw new BadRequestException('Session already finished');

    const totalQuestions = session.tickets.length;
    const answers = session.tickets.filter((t) => t.answer !== null);
    const totalCorrect = answers.filter((t) => t.answer!.isCorrect).length;
    const totalTime = answers.reduce(
      (sum, t) => sum + (t.answer!.timeMs || 0),
      0,
    );
    const score = Math.round((totalCorrect / totalQuestions) * 100);
    // Exam mode: pass with ≤2 errors (for 20 questions)
    const passed =
      session.mode === 'EXAM'
        ? totalQuestions - totalCorrect <= 2
        : totalCorrect === totalQuestions;

    // Calculate errors by topic
    const errors = session.tickets
      .filter((t) => t.answer && !t.answer.isCorrect)
      .map((t) => ({
        ticketId: t.ticketId,
        pddRef: t.ticket.pddRef,
        tags: t.ticket.tags,
        selectedOptionId: t.answer!.selectedOptionId,
      }));

    // Update session
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        score,
      },
    });

    return {
      sessionId,
      score,
      totalCorrect,
      totalQuestions,
      totalAnswered: answers.length,
      totalTime,
      passed,
      errors,
    };
  }
}
