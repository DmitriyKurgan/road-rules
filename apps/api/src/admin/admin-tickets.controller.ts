import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service';
import { TicketFilterDto } from '../tickets/dto/ticket-filter.dto';
import { ImportTicketsDto } from '../tickets/dto/import-ticket.dto';
import { ImagesService } from '../images/images.service';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('admin/tickets')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminTicketsController {
  constructor(
    private ticketsService: TicketsService,
    private imagesService: ImagesService,
  ) {}

  @Get()
  findMany(@Query() filters: TicketFilterDto) {
    return this.ticketsService.findMany(filters);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Post('import')
  async importBulk(@Body() dto: ImportTicketsDto) {
    const result = await this.ticketsService.importBulk(dto.tickets);

    // Auto-attach images in background for successfully created tickets
    if (result.created > 0) {
      this.autoAttachImages(dto.tickets).catch(() => {});
    }

    return result;
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.ticketsService.publish(id);
  }

  private async autoAttachImages(tickets: any[]) {
    for (const ticket of tickets) {
      const queries: string[] = ticket.imageSearchQueries || [];
      if (queries.length === 0) {
        // Fallback: search by pddRef
        queries.push(`UA road sign ${ticket.pddRef} svg`);
      }

      // Find the ticket in DB by scenarioHash
      const dbTicket = await this.ticketsService
        .findByScenarioHash(ticket.scenarioHash)
        .catch(() => null);
      if (!dbTicket) continue;

      // Check if already has image
      if (dbTicket.images && dbTicket.images.length > 0) continue;

      for (const query of queries.slice(0, 2)) {
        try {
          const candidates = await this.imagesService.searchWikimedia(query);
          if (candidates.length > 0) {
            const best =
              candidates.find((c) =>
                c.title.toLowerCase().includes(ticket.pddRef),
              ) || candidates[0];

            await this.imagesService.attachImage(dbTicket.id, {
              sourceUrl: best.fileUrl,
              license: best.license,
              author: best.author,
              title: best.title,
              attributionHtml: best.attributionHtml,
            });
            break;
          }
        } catch {
          /* image attach is best-effort */
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }
}
