import { IsString, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class SubmitAnswerDto {
  @IsString()
  ticketId: string;

  @IsString()
  selectedOptionId: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  timeMs: number;
}
