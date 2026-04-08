import { Controller, Get, Query } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("stats")
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get("overview")
  getOverview(@CurrentUser("id") userId: string) {
    return this.statsService.getOverview(userId);
  }

  @Get("topics")
  getTopicStats(@CurrentUser("id") userId: string) {
    return this.statsService.getTopicStats(userId);
  }

  @Get("history")
  getSessionHistory(
    @CurrentUser("id") userId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.statsService.getSessionHistory(
      userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}
