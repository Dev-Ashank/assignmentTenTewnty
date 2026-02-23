import {
  Controller,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PrizesService } from './prizes.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { UserRole } from '../common/enums';

@ApiTags('Prizes')
@Controller('contests/:contestId/prizes')
export class PrizesController {
  constructor(private readonly prizesService: PrizesService) {}

  // Award the prize to the winning user — admin only
  @Post('award')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Award prize to the top scorer (Admin only)' })
  @ApiResponse({ status: 201, description: 'Prize awarded to the winner' })
  @ApiResponse({ status: 400, description: 'Contest still running or prize already awarded' })
  async awardPrize(@Param('contestId', ParseUUIDPipe) contestId: string) {
    const prize = await this.prizesService.awardPrize(contestId);
    return {
      message: 'Prize awarded to the winner! 🎉',
      prize: {
        id: prize.id,
        contestId: prize.contestId,
        userId: prize.userId,
        prizeName: prize.prizeName,
        awardedAt: prize.awardedAt,
      },
    };
  }
}
