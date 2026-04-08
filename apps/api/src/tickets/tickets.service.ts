import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Difficulty, Prisma, TicketStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { TicketFilterDto } from "./dto/ticket-filter.dto";
import { ImportTicketDto } from "./dto/import-ticket.dto";

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findByScenarioHash(scenarioHash: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { scenarioHash },
      include: {
        options: { orderBy: { order: "asc" } },
        images: { include: { image: true } },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async findById(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        options: { orderBy: { order: "asc" } },
        images: { include: { image: true } },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async findMany(filters: TicketFilterDto) {
    const { page = 1, pageSize = 20, difficulty, status, search, tags } = filters;

    const where: Prisma.TicketWhereInput = {};

    if (difficulty) where.difficulty = difficulty;
    if (status) where.status = status;
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    if (search) {
      where.OR = [
        { questionRu: { contains: search, mode: "insensitive" } },
        { questionUk: { contains: search, mode: "insensitive" } },
        { pddRef: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          options: { orderBy: { order: "asc" } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async importBulk(tickets: ImportTicketDto[]) {
    const errors: { index: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];

      // Validate exactly 1 correct option
      const correctCount = t.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        errors.push({ index: i, message: `Expected exactly 1 correct option, got ${correctCount}` });
        continue;
      }

      // Check unique scenarioHash
      const existing = await this.prisma.ticket.findUnique({
        where: { scenarioHash: t.scenarioHash },
      });
      if (existing) {
        errors.push({ index: i, message: `Duplicate scenarioHash: ${t.scenarioHash}` });
        continue;
      }

      try {
        await this.prisma.ticket.create({
          data: {
            questionRu: t.questionRu,
            questionUk: t.questionUk,
            explanationRu: t.explanationRu,
            explanationUk: t.explanationUk,
            pddRef: t.pddRef,
            difficulty: t.difficulty,
            tags: t.tags,
            scenarioHash: t.scenarioHash,
            imageBrief: t.imageBrief,
            imageSearchQ: t.imageSearchQueries || [],
            status: TicketStatus.DRAFT,
            options: {
              create: t.options.map((o) => ({
                textRu: o.textRu,
                textUk: o.textUk,
                isCorrect: o.isCorrect,
                order: o.order,
              })),
            },
          },
        });
        created++;
      } catch (e: any) {
        errors.push({ index: i, message: e.message || "Unknown error" });
      }
    }

    return { total: tickets.length, created, errors };
  }

  async publish(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (ticket.status !== TicketStatus.DRAFT) {
      throw new BadRequestException(`Cannot publish ticket with status ${ticket.status}`);
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.PUBLISHED },
      include: { options: { orderBy: { order: "asc" } } },
    });
  }

  async selectForSession(params: {
    count: number;
    excludeTicketIds?: string[];
    topics?: string[];
    difficulty?: Difficulty;
  }) {
    const { count, excludeTicketIds = [], topics, difficulty } = params;

    const where: Prisma.TicketWhereInput = {
      status: TicketStatus.PUBLISHED,
    };

    if (excludeTicketIds.length > 0) {
      where.id = { notIn: excludeTicketIds };
    }
    if (topics && topics.length > 0) {
      where.tags = { hasSome: topics };
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Get total count of available tickets
    const available = await this.prisma.ticket.count({ where });
    const take = Math.min(count, available);

    if (take === 0) {
      throw new BadRequestException("No tickets available matching the criteria");
    }

    // Use random ordering for selection
    const tickets = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM tickets
      WHERE status = 'PUBLISHED'
      ${excludeTicketIds.length > 0 ? Prisma.sql`AND id NOT IN (${Prisma.join(excludeTicketIds)})` : Prisma.empty}
      ${topics && topics.length > 0 ? Prisma.sql`AND tags && ${topics}::text[]` : Prisma.empty}
      ${difficulty ? Prisma.sql`AND difficulty = ${difficulty}::"Difficulty"` : Prisma.empty}
      ORDER BY RANDOM()
      LIMIT ${take}
    `;

    return tickets.map((t) => t.id);
  }
}
