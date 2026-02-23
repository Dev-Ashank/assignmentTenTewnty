import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { Question } from './entities/question.entity';
import { QuestionType } from '../common/enums';

// We mock the TypeORM repository so tests don't need a real database
const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

describe('QuestionsService', () => {
  let service: QuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: getRepositoryToken(Question), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    jest.clearAllMocks();
  });

  describe('create - question validation', () => {
    it('should create a valid single-select question', async () => {
      const dto = {
        questionText: 'What is 2+2?',
        type: QuestionType.SINGLE_SELECT,
        options: ['3', '4', '5', '6'],
        correctAnswers: ['4'],
        points: 10,
      };

      mockRepo.create.mockReturnValue({ ...dto, contestId: 'c1' });
      mockRepo.save.mockResolvedValue({ id: 'q1', ...dto, contestId: 'c1' });

      const result = await service.create('c1', dto);
      expect(result.id).toBe('q1');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should reject single-select with multiple correct answers', async () => {
      const dto = {
        questionText: 'Pick one',
        type: QuestionType.SINGLE_SELECT,
        options: ['A', 'B', 'C'],
        correctAnswers: ['A', 'B'], // this shouldn't be allowed for single-select
      };

      await expect(service.create('c1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if correct answer is not in the options list', async () => {
      const dto = {
        questionText: 'Capital of France?',
        type: QuestionType.SINGLE_SELECT,
        options: ['London', 'Berlin', 'Madrid'],
        correctAnswers: ['Paris'], // not in the options!
      };

      await expect(service.create('c1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject true/false question with more than 2 options', async () => {
      const dto = {
        questionText: 'Is water wet?',
        type: QuestionType.TRUE_FALSE,
        options: ['True', 'False', 'Maybe'], // should only have 2
        correctAnswers: ['True'],
      };

      await expect(service.create('c1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should create a valid multi-select question', async () => {
      const dto = {
        questionText: 'Select all prime numbers:',
        type: QuestionType.MULTI_SELECT,
        options: ['2', '4', '5', '9'],
        correctAnswers: ['2', '5'],
        points: 15,
      };

      mockRepo.create.mockReturnValue({ ...dto, contestId: 'c1' });
      mockRepo.save.mockResolvedValue({ id: 'q2', ...dto, contestId: 'c1' });

      const result = await service.create('c1', dto);
      expect(result.id).toBe('q2');
    });

    it('should create a valid true/false question', async () => {
      const dto = {
        questionText: 'The sky is blue.',
        type: QuestionType.TRUE_FALSE,
        options: ['True', 'False'],
        correctAnswers: ['True'],
        points: 5,
      };

      mockRepo.create.mockReturnValue({ ...dto, contestId: 'c1' });
      mockRepo.save.mockResolvedValue({ id: 'q3', ...dto, contestId: 'c1' });

      const result = await service.create('c1', dto);
      expect(result.id).toBe('q3');
    });
  });

  describe('findById', () => {
    it('should return a question when found', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'q1', questionText: 'Test?' });

      const result = await service.findById('q1');
      expect(result.questionText).toBe('Test?');
    });

    it('should throw NotFoundException when question does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
