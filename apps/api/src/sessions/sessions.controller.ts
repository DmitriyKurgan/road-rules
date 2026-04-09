import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateSessionDto, @CurrentUser('id') userId?: string) {
    return this.sessionsService.create(dto, userId);
  }

  @Public()
  @Get(':id')
  getSession(@Param('id') id: string) {
    return this.sessionsService.getSession(id);
  }

  @Public()
  @Post(':id/answer')
  @HttpCode(HttpStatus.OK)
  submitAnswer(@Param('id') sessionId: string, @Body() dto: SubmitAnswerDto) {
    return this.sessionsService.submitAnswer(sessionId, dto);
  }

  @Public()
  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  finish(@Param('id') sessionId: string) {
    return this.sessionsService.finish(sessionId);
  }
}
