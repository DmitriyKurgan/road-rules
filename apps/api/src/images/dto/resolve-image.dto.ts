import { IsString, IsOptional } from 'class-validator';

export class ResolveImageDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  ticketId?: string;
}
