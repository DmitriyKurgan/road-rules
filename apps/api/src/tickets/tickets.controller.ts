import { Controller, Get, Param, Query } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { Public } from '../common/decorators/public.decorator';
import { TicketStatus } from '@prisma/client';

@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Public()
  @Get()
  findMany(@Query() filters: TicketFilterDto) {
    // Public endpoint only shows published tickets
    return this.ticketsService.findMany({
      ...filters,
      status: TicketStatus.PUBLISHED,
    });
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    const ticket = await this.ticketsService.findById(id);

    // Hide isCorrect for public access
    return {
      ...ticket,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      options: ticket.options.map(({ isCorrect, ...opt }) => opt),
    };
  }
}
