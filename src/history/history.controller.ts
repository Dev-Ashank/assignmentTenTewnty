import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@ApiTags('User History')
@Controller('users/me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // Get all contests the user has participated in (both finished and in-progress)
  @Get('history')
  @ApiOperation({ summary: 'Get your contest participation history' })
  @ApiResponse({ status: 200, description: 'List of past participations' })
  async getHistory(@CurrentUser() user: any) {
    const history = await this.historyService.getUserHistory(user.id);
    return {
      message: 'Your contest history.',
      count: history.length,
      history,
    };
  }

  // Get only the contests that are still in-progress (not submitted yet)
  @Get('history/in-progress')
  @ApiOperation({ summary: 'Get your in-progress contests' })
  @ApiResponse({ status: 200, description: 'List of in-progress participations' })
  async getInProgress(@CurrentUser() user: any) {
    const inProgress = await this.historyService.getInProgressContests(user.id);
    return {
      message: 'Your in-progress contests. Don\'t forget to submit them!',
      count: inProgress.length,
      inProgress,
    };
  }

  // Get all prizes the user has won
  @Get('prizes')
  @ApiOperation({ summary: 'Get all prizes you\'ve won' })
  @ApiResponse({ status: 200, description: 'List of prizes' })
  async getPrizes(@CurrentUser() user: any) {
    const prizes = await this.historyService.getUserPrizes(user.id);
    return {
      message: prizes.length > 0
        ? 'Here are your prizes! 🏆'
        : 'No prizes yet. Keep participating!',
      count: prizes.length,
      prizes,
    };
  }
}
