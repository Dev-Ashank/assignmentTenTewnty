import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { QuestionType } from '../common/enums';

// Service for managing questions within a contest.
// Includes validation to make sure questions make sense (e.g., correct answers exist in options).
@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepo: Repository<Question>,
  ) {}

  // Add a question to a contest, with some sanity checks
  async create(contestId: string, dto: CreateQuestionDto): Promise<Question> {
    // Make sure every correct answer is actually one of the options
    this.validateAnswersMatchOptions(dto.options, dto.correctAnswers, dto.type);

    const question = this.questionsRepo.create({
      ...dto,
      contestId,
    });
    return this.questionsRepo.save(question);
  }

  // Get all questions for a contest, ordered by their index
  async findByContest(contestId: string): Promise<Question[]> {
    return this.questionsRepo.find({
      where: { contestId },
      order: { orderIndex: 'ASC' },
    });
  }

  // Get a single question by ID
  async findById(id: string): Promise<Question> {
    const question = await this.questionsRepo.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException(`Question with ID "${id}" not found.`);
    }
    return question;
  }

  // Update a question
  async update(id: string, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findById(id);

    // If they're changing options or answers, re-validate
    const options = dto.options || question.options;
    const correctAnswers = dto.correctAnswers || question.correctAnswers;
    const type = dto.type || question.type;
    this.validateAnswersMatchOptions(options, correctAnswers, type);

    Object.assign(question, dto);
    return this.questionsRepo.save(question);
  }

  // Delete a question
  async remove(id: string): Promise<void> {
    const question = await this.findById(id);
    await this.questionsRepo.remove(question);
  }

  // Helper: make sure the question configuration is valid.
  // For example, a TRUE_FALSE question should have exactly 2 options.
  private validateAnswersMatchOptions(
    options: string[],
    correctAnswers: string[],
    type: QuestionType,
  ): void {
    // Every correct answer must be one of the available options
    for (const answer of correctAnswers) {
      if (!options.includes(answer)) {
        throw new BadRequestException(
          `Correct answer "${answer}" is not in the options list. Options: [${options.join(', ')}]`,
        );
      }
    }

    // TRUE_FALSE questions should have exactly 2 options and 1 correct answer
    if (type === QuestionType.TRUE_FALSE) {
      if (options.length !== 2) {
        throw new BadRequestException(
          'True/False questions must have exactly 2 options.',
        );
      }
      if (correctAnswers.length !== 1) {
        throw new BadRequestException(
          'True/False questions must have exactly 1 correct answer.',
        );
      }
    }

    // SINGLE_SELECT should have exactly 1 correct answer
    if (type === QuestionType.SINGLE_SELECT && correctAnswers.length !== 1) {
      throw new BadRequestException(
        'Single-select questions must have exactly 1 correct answer.',
      );
    }
  }
}
