import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../common/guards';

@ApiTags('Leaderboard')
@Controller('contests/:contestId/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  // Get the leaderboard for a contest — shows all participants ranked by score
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the leaderboard for a contest' })
  @ApiResponse({ status: 200, description: 'Leaderboard data' })
  async getLeaderboard(@Param('contestId', ParseUUIDPipe) contestId: string) {
    const entries = await this.leaderboardService.getLeaderboard(contestId);

    // Format the response nicely — don't expose internal IDs or password hashes
    const leaderboard = entries.map((entry) => ({
      rank: entry.rank,
      score: entry.score,
      user: {
        id: entry.user.id,
        username: entry.user.username,
      },
    }));

    return {
      message: 'Leaderboard for this contest.',
      contestId,
      totalParticipants: leaderboard.length,
      leaderboard,
    };
  }
}
