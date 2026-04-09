import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: any;
  let ticketsService: any;

  beforeEach(async () => {
    prisma = {
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      sessionTicket: {
        findFirst: jest.fn(),
      },
      sessionAnswer: {
        create: jest.fn(),
      },
    };
    ticketsService = {
      selectForSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TicketsService, useValue: ticketsService },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  describe('create', () => {
    it('should create session with tickets', async () => {
      ticketsService.selectForSession.mockResolvedValue(['t1', 't2', 't3']);
      prisma.session.create.mockResolvedValue({
        id: 's1',
        mode: 'PRACTICE',
        lang: 'ru',
        startedAt: new Date(),
        tickets: [
          { id: 'st1', ticketId: 't1', order: 1 },
          { id: 'st2', ticketId: 't2', order: 2 },
          { id: 'st3', ticketId: 't3', order: 3 },
        ],
      });

      const result = await service.create(
        { mode: 'PRACTICE' as any, lang: 'ru' as any },
        'user-1',
      );

      expect(result.id).toBe('s1');
      expect(result.ticketCount).toBe(3);
      expect(ticketsService.selectForSession).toHaveBeenCalledWith({
        count: 20,
        topics: undefined,
        difficulty: undefined,
      });
    });
  });

  describe('getSession', () => {
    it('should return session with progress', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 's1',
        mode: 'EXAM',
        lang: 'ru',
        startedAt: new Date(),
        endedAt: null,
        score: null,
        tickets: [
          {
            id: 'st1',
            order: 1,
            ticketId: 't1',
            ticket: {
              questionRu: 'Q1?',
              questionUk: 'Q1?',
              pddRef: '1.1',
              difficulty: 'EASY',
              explanationRu: 'E',
              explanationUk: 'E',
              options: [{ id: 'o1', order: 1, textRu: 'A', textUk: 'A' }],
            },
            answer: {
              selectedOptionId: 'o1',
              isCorrect: true,
              timeMs: 1000,
              answeredAt: new Date(),
              id: 'a1',
            },
          },
          {
            id: 'st2',
            order: 2,
            ticketId: 't2',
            ticket: {
              questionRu: 'Q2?',
              questionUk: 'Q2?',
              pddRef: '2.1',
              difficulty: 'MEDIUM',
              explanationRu: 'E',
              explanationUk: 'E',
              options: [{ id: 'o2', order: 1, textRu: 'B', textUk: 'B' }],
            },
            answer: null,
          },
        ],
      });

      const result = await service.getSession('s1');

      expect(result.totalAnswered).toBe(1);
      expect(result.totalCorrect).toBe(1);
      expect(result.currentTicketOrder).toBe(2);
      expect(result.tickets).toHaveLength(2);
    });

    it('should throw if not found', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.getSession('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitAnswer', () => {
    const mockSessionTicket = {
      id: 'st1',
      session: { endedAt: null },
      answer: null,
      ticket: {
        explanationRu: 'Explanation RU',
        explanationUk: 'Explanation UK',
        pddRef: '1.1',
        options: [
          { id: 'o1', order: 1, isCorrect: true },
          { id: 'o2', order: 2, isCorrect: false },
        ],
      },
      order: 1,
    };

    it('should create answer and return result', async () => {
      prisma.sessionTicket.findFirst
        .mockResolvedValueOnce(mockSessionTicket) // for answer
        .mockResolvedValueOnce({ ticketId: 't2', order: 2 }); // for next
      prisma.sessionAnswer.create.mockResolvedValue({});

      const result = await service.submitAnswer('s1', {
        ticketId: 't1',
        selectedOptionId: 'o1',
        timeMs: 3000,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.correctOptionId).toBe('o1');
      expect(result.explanation.ru).toBe('Explanation RU');
      expect(result.nextTicketId).toBe('t2');
    });

    it('should reject if already answered', async () => {
      prisma.sessionTicket.findFirst.mockResolvedValue({
        ...mockSessionTicket,
        answer: { id: 'existing' },
      });

      await expect(
        service.submitAnswer('s1', {
          ticketId: 't1',
          selectedOptionId: 'o1',
          timeMs: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if session finished', async () => {
      prisma.sessionTicket.findFirst.mockResolvedValue({
        ...mockSessionTicket,
        session: { endedAt: new Date() },
      });

      await expect(
        service.submitAnswer('s1', {
          ticketId: 't1',
          selectedOptionId: 'o1',
          timeMs: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid option', async () => {
      prisma.sessionTicket.findFirst.mockResolvedValue(mockSessionTicket);

      await expect(
        service.submitAnswer('s1', {
          ticketId: 't1',
          selectedOptionId: 'invalid-option',
          timeMs: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if ticket not in session', async () => {
      prisma.sessionTicket.findFirst.mockResolvedValue(null);

      await expect(
        service.submitAnswer('s1', {
          ticketId: 'wrong',
          selectedOptionId: 'o1',
          timeMs: 1000,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('finish', () => {
    it('should calculate score and return result', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 's1',
        mode: 'EXAM',
        endedAt: null,
        tickets: [
          {
            ticketId: 't1',
            answer: { isCorrect: true, timeMs: 2000, selectedOptionId: 'o1' },
            ticket: { tags: ['signs'], pddRef: '1.1' },
          },
          {
            ticketId: 't2',
            answer: { isCorrect: false, timeMs: 3000, selectedOptionId: 'o2' },
            ticket: { tags: ['speed'], pddRef: '12.4' },
          },
          {
            ticketId: 't3',
            answer: { isCorrect: true, timeMs: 1500, selectedOptionId: 'o3' },
            ticket: { tags: ['intersections'], pddRef: '16.4' },
          },
        ],
      });
      prisma.session.update.mockResolvedValue({});

      const result = await service.finish('s1');

      expect(result.totalCorrect).toBe(2);
      expect(result.totalQuestions).toBe(3);
      expect(result.score).toBe(67); // Math.round(2/3 * 100)
      expect(result.totalTime).toBe(6500);
      expect(result.passed).toBe(true); // EXAM: <=2 errors for 3 questions -> 1 error
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].pddRef).toBe('12.4');
    });

    it('should throw if already finished', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 's1',
        endedAt: new Date(),
        tickets: [],
      });

      await expect(service.finish('s1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if not found', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.finish('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
