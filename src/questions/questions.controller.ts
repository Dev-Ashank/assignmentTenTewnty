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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { UserRole } from '../common/enums';

@ApiTags('Questions')
@Controller('contests/:contestId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // Add a question to a contest — admin only
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a question to a contest (Admin only)' })
  @ApiResponse({ status: 201, description: 'Question added' })
  async create(
    @Param('contestId', ParseUUIDPipe) contestId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    const question = await this.questionsService.create(contestId, dto);
    return {
      message: 'Question added to the contest.',
      question,
    };
  }

  // List all questions for a contest (correct answers are stripped for non-admins)
  @Get()
  @ApiOperation({ summary: 'Get all questions for a contest' })
  @ApiResponse({ status: 200, description: 'List of questions (answers hidden)' })
  async findAll(@Param('contestId', ParseUUIDPipe) contestId: string) {
    const questions = await this.questionsService.findByContest(contestId);

    // Don't reveal the correct answers — that would make the contest pointless
    const sanitized = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      type: q.type,
      options: q.options,
      points: q.points,
      orderIndex: q.orderIndex,
    }));

    return {
      message: 'Questions loaded for this contest.',
      count: sanitized.length,
      questions: sanitized,
    };
  }

  // Update a question
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question (Admin only)' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    const question = await this.questionsService.update(id, dto);
    return {
      message: 'Question updated.',
      question,
    };
  }

  // Delete a question
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a question (Admin only)' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.questionsService.remove(id);
    return { message: 'Question deleted.' };
  }
}
