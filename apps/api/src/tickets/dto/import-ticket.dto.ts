import {
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { Difficulty } from "@prisma/client";

export class ImportTicketOptionDto {
  @IsString()
  textRu: string;

  @IsString()
  textUk: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsInt()
  @Min(1)
  @Max(4)
  order: number;
}

export class ImportTicketDto {
  @IsString()
  questionRu: string;

  @IsString()
  questionUk: string;

  @IsString()
  explanationRu: string;

  @IsString()
  explanationUk: string;

  @IsString()
  pddRef: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  scenarioHash: string;

  @IsOptional()
  @IsString()
  imageBrief?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageSearchQueries?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @Type(() => ImportTicketOptionDto)
  options: ImportTicketOptionDto[];
}

export class ImportTicketsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ImportTicketDto)
  tickets: ImportTicketDto[];
}
