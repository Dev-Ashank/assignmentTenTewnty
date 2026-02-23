import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ParticipationService } from './participation.service';
import { SubmitAnswerDto } from './dto/participation.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';

@ApiTags('Participation')
@Controller('contests/:contestId')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ParticipationController {
  constructor(private readonly participationService: ParticipationService) {}

  // Join a contest — creates an in-progress participation
  @Post('participate')
  @Roles(UserRole.USER, UserRole.VIP)
  @ApiOperation({ summary: 'Join a contest (logged-in users only)' })
  @ApiResponse({ status: 201, description: 'Successfully joined the contest' })
  @ApiResponse({ status: 403, description: 'Not authorized or VIP-only contest' })
  @ApiResponse({ status: 409, description: 'Already joined this contest' })
  async participate(
    @Param('contestId', ParseUUIDPipe) contestId: string,
    @CurrentUser() user: any,
  ) {
    const participation = await this.participationService.joinContest(
      user.id,
      user.role,
      contestId,
    );
    return {
      message: 'You\'ve joined the contest! Start answering questions.',
      participation: {
        id: participation.id,
        contestId: participation.contestId,
        status: participation.status,
        startedAt: participation.startedAt,
      },
    };
  }

  // Submit an answer to a question within the contest
  @Post('answers')
  @Roles(UserRole.USER, UserRole.VIP)
  @ApiOperation({ summary: 'Submit an answer to a question' })
  @ApiResponse({ status: 201, description: 'Answer recorded' })
  @ApiResponse({ status: 409, description: 'Already answered this question' })
  async submitAnswer(
    @Param('contestId', ParseUUIDPipe) contestId: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitAnswerDto,
  ) {
    const answer = await this.participationService.submitAnswer(
      user.id,
      contestId,
      dto,
    );
    return {
      message: 'Answer recorded! Move on to the next question.',
      answer: {
        id: answer.id,
        questionId: answer.questionId,
        selectedAnswers: answer.selectedAnswers,
      },
    };
  }

  // Finish the contest — triggers scoring and leaderboard update
  @Post('submit')
  @Roles(UserRole.USER, UserRole.VIP)
  @ApiOperation({ summary: 'Submit the contest and get your score' })
  @ApiResponse({ status: 201, description: 'Contest submitted and scored' })
  async submitContest(
    @Param('contestId', ParseUUIDPipe) contestId: string,
    @CurrentUser() user: any,
  ) {
    return this.participationService.submitContest(user.id, contestId);
  }
}
