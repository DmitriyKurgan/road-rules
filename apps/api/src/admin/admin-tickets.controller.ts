import { Controller, Get, Post, Param, Query, Body, UseGuards } from "@nestjs/common";
import { TicketsService } from "../tickets/tickets.service";
import { TicketFilterDto } from "../tickets/dto/ticket-filter.dto";
import { ImportTicketsDto } from "../tickets/dto/import-ticket.dto";
import { RolesGuard, Roles } from "../common/guards/roles.guard";

@Controller("admin/tickets")
@UseGuards(RolesGuard)
@Roles("ADMIN")
export class AdminTicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  findMany(@Query() filters: TicketFilterDto) {
    return this.ticketsService.findMany(filters);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.ticketsService.findById(id);
  }

  @Post("import")
  importBulk(@Body() dto: ImportTicketsDto) {
    return this.ticketsService.importBulk(dto.tickets);
  }

  @Post(":id/publish")
  publish(@Param("id") id: string) {
    return this.ticketsService.publish(id);
  }
}
