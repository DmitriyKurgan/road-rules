import { Module } from "@nestjs/common";
import { AdminTicketsController } from "./admin-tickets.controller";
import { TicketsModule } from "../tickets/tickets.module";
import { ImagesModule } from "../images/images.module";

@Module({
  imports: [TicketsModule, ImagesModule],
  controllers: [AdminTicketsController],
})
export class AdminModule {}
