import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { PrismaService } from "../prisma/prisma.service";

describe("TicketsService", () => {
  let service: TicketsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      ticket: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  describe("findById", () => {
    it("should return ticket with options", async () => {
      const mockTicket = {
        id: "t1",
        questionRu: "Test?",
        options: [{ id: "o1", order: 1 }],
        images: [],
      };
      prisma.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.findById("t1");
      expect(result).toEqual(mockTicket);
    });

    it("should throw NotFoundException if not found", async () => {
      prisma.ticket.findUnique.mockResolvedValue(null);

      await expect(service.findById("missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findMany", () => {
    it("should return paginated results with filters", async () => {
      prisma.ticket.findMany.mockResolvedValue([{ id: "t1" }]);
      prisma.ticket.count.mockResolvedValue(1);

      const result = await service.findMany({
        page: 1,
        pageSize: 20,
        difficulty: "EASY" as any,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it("should apply search filter", async () => {
      prisma.ticket.findMany.mockResolvedValue([]);
      prisma.ticket.count.mockResolvedValue(0);

      await service.findMany({ search: "скорость" });

      const where = prisma.ticket.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
      expect(where.OR).toHaveLength(3);
    });
  });

  describe("importBulk", () => {
    const validTicket = {
      questionRu: "Q?",
      questionUk: "Q?",
      explanationRu: "E",
      explanationUk: "E",
      pddRef: "1.1",
      difficulty: "EASY" as any,
      tags: ["signs"],
      scenarioHash: "hash-001",
      options: [
        { textRu: "A", textUk: "A", isCorrect: true, order: 1 },
        { textRu: "B", textUk: "B", isCorrect: false, order: 2 },
        { textRu: "C", textUk: "C", isCorrect: false, order: 3 },
        { textRu: "D", textUk: "D", isCorrect: false, order: 4 },
      ],
    };

    it("should import valid ticket", async () => {
      prisma.ticket.findUnique.mockResolvedValue(null);
      prisma.ticket.create.mockResolvedValue({ id: "new" });

      const result = await service.importBulk([validTicket]);

      expect(result.total).toBe(1);
      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject ticket with wrong correct count", async () => {
      const badTicket = {
        ...validTicket,
        scenarioHash: "hash-bad",
        options: validTicket.options.map((o) => ({
          ...o,
          isCorrect: false,
        })),
      };

      const result = await service.importBulk([badTicket]);

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("correct option");
    });

    it("should reject duplicate scenarioHash", async () => {
      prisma.ticket.findUnique.mockResolvedValue({ id: "existing" });

      const result = await service.importBulk([validTicket]);

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Duplicate");
    });
  });

  describe("publish", () => {
    it("should publish a draft ticket", async () => {
      prisma.ticket.findUnique.mockResolvedValue({
        id: "t1",
        status: "DRAFT",
      });
      prisma.ticket.update.mockResolvedValue({
        id: "t1",
        status: "PUBLISHED",
      });

      const result = await service.publish("t1");
      expect(result.status).toBe("PUBLISHED");
    });

    it("should reject publishing non-draft", async () => {
      prisma.ticket.findUnique.mockResolvedValue({
        id: "t1",
        status: "PUBLISHED",
      });

      await expect(service.publish("t1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw if ticket not found", async () => {
      prisma.ticket.findUnique.mockResolvedValue(null);

      await expect(service.publish("missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("selectForSession", () => {
    it("should return ticket IDs", async () => {
      prisma.ticket.count.mockResolvedValue(10);
      prisma.$queryRaw.mockResolvedValue([
        { id: "t1" },
        { id: "t2" },
        { id: "t3" },
      ]);

      const result = await service.selectForSession({ count: 3 });

      expect(result).toEqual(["t1", "t2", "t3"]);
    });

    it("should throw if no tickets available", async () => {
      prisma.ticket.count.mockResolvedValue(0);

      await expect(
        service.selectForSession({ count: 20 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
