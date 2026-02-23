import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ParticipationService } from './participation.service';
import { Participation } from './entities/participation.entity';
import { Answer } from './entities/answer.entity';
import { ContestsService } from '../contests/contests.service';
import { QuestionsService } from '../questions/questions.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { ContestAccess, ParticipationStatus, UserRole } from '../common/enums';

// Mock all dependencies — we're testing the participation logic in isolation
const mockParticipationRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

const mockAnswerRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockContestsService = {
  findById: jest.fn(),
};

const mockQuestionsService = {
  findById: jest.fn(),
  findByContest: jest.fn(),
};

const mockLeaderboardService = {
  updateEntry: jest.fn(),
};

describe('ParticipationService', () => {
  let service: ParticipationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipationService,
        { provide: getRepositoryToken(Participation), useValue: mockParticipationRepo },
        { provide: getRepositoryToken(Answer), useValue: mockAnswerRepo },
        { provide: ContestsService, useValue: mockContestsService },
        { provide: QuestionsService, useValue: mockQuestionsService },
        { provide: LeaderboardService, useValue: mockLeaderboardService },
      ],
    }).compile();

    service = module.get<ParticipationService>(ParticipationService);
    jest.clearAllMocks();
  });

  describe('joinContest', () => {
    const activeContest = {
      id: 'contest-1',
      isActive: true,
      accessLevel: ContestAccess.NORMAL,
      startTime: new Date(Date.now() - 60 * 60 * 1000), // started 1 hour ago
      endTime: new Date(Date.now() + 60 * 60 * 1000),   // ends in 1 hour
    };

    it('should let a normal user join a NORMAL contest', async () => {
      mockContestsService.findById.mockResolvedValue(activeContest);
      mockParticipationRepo.findOne.mockResolvedValue(null); // not already joined
      mockParticipationRepo.create.mockReturnValue({ userId: 'u1', contestId: 'contest-1' });
      mockParticipationRepo.save.mockResolvedValue({
        id: 'p1',
        userId: 'u1',
        contestId: 'contest-1',
        status: ParticipationStatus.IN_PROGRESS,
      });

      const result = await service.joinContest('u1', UserRole.USER, 'contest-1');
      expect(result.status).toBe(ParticipationStatus.IN_PROGRESS);
    });

    it('should block a normal user from joining a VIP contest', async () => {
      const vipContest = { ...activeContest, accessLevel: ContestAccess.VIP };
      mockContestsService.findById.mockResolvedValue(vipContest);

      await expect(
        service.joinContest('u1', UserRole.USER, 'contest-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should let a VIP user join a VIP contest', async () => {
      const vipContest = { ...activeContest, accessLevel: ContestAccess.VIP };
      mockContestsService.findById.mockResolvedValue(vipContest);
      mockParticipationRepo.findOne.mockResolvedValue(null);
      mockParticipationRepo.create.mockReturnValue({ userId: 'u1', contestId: 'contest-1' });
      mockParticipationRepo.save.mockResolvedValue({
        id: 'p1',
        status: ParticipationStatus.IN_PROGRESS,
      });

      const result = await service.joinContest('u1', UserRole.VIP, 'contest-1');
      expect(result.status).toBe(ParticipationStatus.IN_PROGRESS);
    });

    it('should prevent joining an inactive contest', async () => {
      mockContestsService.findById.mockResolvedValue({
        ...activeContest,
        isActive: false,
      });

      await expect(
        service.joinContest('u1', UserRole.USER, 'contest-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent joining a contest that has not started yet', async () => {
      mockContestsService.findById.mockResolvedValue({
        ...activeContest,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // starts tomorrow
      });

      await expect(
        service.joinContest('u1', UserRole.USER, 'contest-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent joining a contest that has already ended', async () => {
      mockContestsService.findById.mockResolvedValue({
        ...activeContest,
        endTime: new Date(Date.now() - 60 * 1000), // ended 1 minute ago
      });

      await expect(
        service.joinContest('u1', UserRole.USER, 'contest-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent joining the same contest twice', async () => {
      mockContestsService.findById.mockResolvedValue(activeContest);
      mockParticipationRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.joinContest('u1', UserRole.USER, 'contest-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('submitContest - scoring logic', () => {
    it('should correctly score answers and update leaderboard', async () => {
      // User has an active participation
      mockParticipationRepo.findOne.mockResolvedValue({
        id: 'p1',
        userId: 'u1',
        contestId: 'c1',
        status: ParticipationStatus.IN_PROGRESS,
        score: 0,
      });

      // Their answers with question data attached
      mockAnswerRepo.find.mockResolvedValue([
        {
          id: 'a1',
          selectedAnswers: ['Paris'],
          question: { correctAnswers: ['Paris'], points: 10 },
          isCorrect: null,
          pointsAwarded: 0,
        },
        {
          id: 'a2',
          selectedAnswers: ['London'],
          question: { correctAnswers: ['Berlin'], points: 10 },
          isCorrect: null,
          pointsAwarded: 0,
        },
        {
          id: 'a3',
          selectedAnswers: ['2', '5'],    // multi-select, order shouldn't matter
          question: { correctAnswers: ['5', '2'], points: 15 },
          isCorrect: null,
          pointsAwarded: 0,
        },
      ]);

      mockQuestionsService.findByContest.mockResolvedValue([{}, {}, {}]); // 3 total questions
      mockAnswerRepo.save.mockImplementation((a) => Promise.resolve(a));
      mockParticipationRepo.save.mockImplementation((p) => Promise.resolve(p));
      mockLeaderboardService.updateEntry.mockResolvedValue(undefined);

      const result = await service.submitContest('u1', 'c1');

      // First answer correct (10pts), second wrong (0pts), third correct (15pts)
      // Total should be 25
      expect(result.score).toBe(25);
      expect(result.correctAnswers).toBe(2);
      expect(result.answeredQuestions).toBe(3);
      expect(result.totalQuestions).toBe(3);

      // Leaderboard should have been updated with the score
      expect(mockLeaderboardService.updateEntry).toHaveBeenCalledWith('c1', 'u1', 25);
    });

    it('should not allow submitting an already submitted contest', async () => {
      mockParticipationRepo.findOne.mockResolvedValue({
        id: 'p1',
        status: ParticipationStatus.SUBMITTED, // already done
      });

      await expect(
        service.submitContest('u1', 'c1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if user has not joined the contest', async () => {
      mockParticipationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.submitContest('u1', 'c1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitAnswer', () => {
    it('should prevent answering a question that belongs to a different contest', async () => {
      mockParticipationRepo.findOne.mockResolvedValue({
        id: 'p1',
        status: ParticipationStatus.IN_PROGRESS,
      });

      // The question belongs to a different contest
      mockQuestionsService.findById.mockResolvedValue({
        id: 'q1',
        contestId: 'different-contest',
      });

      await expect(
        service.submitAnswer('u1', 'c1', { questionId: 'q1', selectedAnswers: ['A'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent answering the same question twice', async () => {
      mockParticipationRepo.findOne.mockResolvedValue({
        id: 'p1',
        status: ParticipationStatus.IN_PROGRESS,
      });

      mockQuestionsService.findById.mockResolvedValue({
        id: 'q1',
        contestId: 'c1',
      });

      // Already answered this question
      mockAnswerRepo.findOne.mockResolvedValue({ id: 'existing-answer' });

      await expect(
        service.submitAnswer('u1', 'c1', { questionId: 'q1', selectedAnswers: ['A'] }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
