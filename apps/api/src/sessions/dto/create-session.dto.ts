import { IsEnum, IsOptional, IsString } from "class-validator";
import { SessionMode, Lang, Difficulty } from "@prisma/client";

export class CreateSessionDto {
  @IsEnum(SessionMode)
  mode: SessionMode;

  @IsEnum(Lang)
  lang: Lang;

  @IsOptional()
  @IsString({ each: true })
  topics?: string[];

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;
}
