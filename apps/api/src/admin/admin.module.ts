import { Module } from "@nestjs/common";
import { AdminTicketsController } from "./admin-tickets.controller";
import { TicketsModule } from "../tickets/tickets.module";

@Module({
  imports: [TicketsModule],
  controllers: [AdminTicketsController],
})
export class AdminModule {}
