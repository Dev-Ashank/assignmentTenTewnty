import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ContestsService } from './contests.service';
import { CreateContestDto, UpdateContestDto } from './dto/contest.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';

@ApiTags('Contests')
@Controller('contests')
export class ContestsController {
  constructor(private readonly contestsService: ContestsService) {}

  // Create a new contest — only admins can do this
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new contest (Admin only)' })
  @ApiResponse({ status: 201, description: 'Contest created' })
  async create(@Body() dto: CreateContestDto) {
    const contest = await this.contestsService.create(dto);
    return {
      message: 'Contest created successfully!',
      contest,
    };
  }

  // List all contests — results are filtered based on the user's role.
  // Unauthenticated users (guests) can still browse, they just can't participate.
  @Get()
  @ApiOperation({ summary: 'List all contests (filtered by access level)' })
  @ApiResponse({ status: 200, description: 'List of contests' })
  async findAll(@Req() req: any) {
    // Try to extract user role if they're authenticated, otherwise treat as guest
    const userRole = req.user?.role || UserRole.GUEST;
    const contests = await this.contestsService.findAll(userRole);
    return {
      message: 'Here are the available contests.',
      count: contests.length,
      contests,
    };
  }

  // Get details of a specific contest, including its questions
  @Get(':id')
  @ApiOperation({ summary: 'Get contest details with questions' })
  @ApiResponse({ status: 200, description: 'Contest details' })
  @ApiResponse({ status: 404, description: 'Contest not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const contest = await this.contestsService.findById(id);

    // Strip correct answers from questions — don't want to give away the answers!
    const sanitizedQuestions = contest.questions?.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      type: q.type,
      options: q.options,
      points: q.points,
      orderIndex: q.orderIndex,
      // Note: correctAnswers intentionally omitted
    }));

    return {
      message: 'Contest details loaded.',
      contest: {
        ...contest,
        questions: sanitizedQuestions,
      },
    };
  }

  // Update a contest
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a contest (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contest updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContestDto,
  ) {
    const contest = await this.contestsService.update(id, dto);
    return {
      message: 'Contest updated successfully.',
      contest,
    };
  }

  // Delete a contest and all associated data
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a contest (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contest deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.contestsService.remove(id);
    return { message: 'Contest deleted. All associated data has been removed.' };
  }
}
