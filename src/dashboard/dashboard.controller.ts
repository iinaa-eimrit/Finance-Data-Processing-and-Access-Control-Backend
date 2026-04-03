import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActiveUserGuard } from '../common/guards/active-user.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { TrendsQueryDto } from './dto/trends-query.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('category-breakdown')
  getCategoryBreakdown() {
    return this.dashboardService.getCategoryBreakdown();
  }

  @Get('trends')
  getTrends(@Query() query: TrendsQueryDto) {
    return this.dashboardService.getTrends(query.months ?? 6);
  }

  @Get('recent-activity')
  getRecentActivity(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }
}
