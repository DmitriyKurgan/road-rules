import { IsString, IsEnum, IsOptional } from "class-validator";
import { TicketImageRole } from "@prisma/client";

export class AttachImageDto {
  @IsString()
  ticketId: string;

  @IsString()
  sourceUrl: string;

  @IsString()
  license: string;

  @IsString()
  author: string;

  @IsString()
  title: string;

  @IsString()
  attributionHtml: string;

  @IsOptional()
  @IsEnum(TicketImageRole)
  role?: TicketImageRole;
}
