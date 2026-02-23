import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participation } from './entities/participation.entity';
import { Answer } from './entities/answer.entity';
import { ContestsService } from '../contests/contests.service';
import { QuestionsService } from '../questions/questions.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { ContestAccess, ParticipationStatus, UserRole } from '../common/enums';
import { SubmitAnswerDto } from './dto/participation.dto';

// This is the heart of the contest system — handles joining, answering, and scoring.
// The flow is: join → answer questions → submit → get scored → leaderboard updated
@Injectable()
export class ParticipationService {
  constructor(
    @InjectRepository(Participation)
    private participationRepo: Repository<Participation>,
    @InjectRepository(Answer)
    private answerRepo: Repository<Answer>,
    private contestsService: ContestsService,
    private questionsService: QuestionsService,
    private leaderboardService: LeaderboardService,
  ) {}

  // Join a contest. This creates a participation record with IN_PROGRESS status.
  // We check a bunch of things before allowing it: access level, timing, duplicates, etc.
  async joinContest(userId: string, userRole: UserRole, contestId: string) {
    const contest = await this.contestsService.findById(contestId);

    // Check #1: Is the contest still active?
    if (!contest.isActive) {
      throw new BadRequestException('This contest is no longer active.');
    }

    // Check #2: Can this user access this contest based on their role?
    if (
      contest.accessLevel === ContestAccess.VIP &&
      userRole !== UserRole.VIP &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'This is a VIP-only contest. Upgrade your account to participate.',
      );
    }

    // Check #3: Is the contest currently running? (between start and end time)
    const now = new Date();
    if (now < new Date(contest.startTime)) {
      throw new BadRequestException(
        `This contest hasn't started yet. It begins at ${contest.startTime}.`,
      );
    }
    if (now > new Date(contest.endTime)) {
      throw new BadRequestException('This contest has already ended. Better luck next time!');
    }

    // Check #4: Has this user already joined this contest?
    const existing = await this.participationRepo.findOne({
      where: { userId, contestId },
    });
    if (existing) {
      throw new ConflictException(
        'You\'ve already joined this contest. Check your in-progress contests.',
      );
    }

    // All checks passed — let them in!
    const participation = this.participationRepo.create({
      userId,
      contestId,
      status: ParticipationStatus.IN_PROGRESS,
    });

    return this.participationRepo.save(participation);
  }

  // Submit an answer to a question. The answer is saved but NOT scored yet.
  // Scoring happens when the user submits the entire contest.
  async submitAnswer(userId: string, contestId: string, dto: SubmitAnswerDto) {
    // First, make sure the user has actually joined this contest
    const participation = await this.getActiveParticipation(userId, contestId);

    // Make sure the question belongs to this contest
    const question = await this.questionsService.findById(dto.questionId);
    if (question.contestId !== contestId) {
      throw new BadRequestException(
        'This question doesn\'t belong to the contest you\'re participating in.',
      );
    }

    // Check if they've already answered this question (no take-backs!)
    const existingAnswer = await this.answerRepo.findOne({
      where: {
        participationId: participation.id,
        questionId: dto.questionId,
      },
    });
    if (existingAnswer) {
      throw new ConflictException(
        'You\'ve already answered this question. Answers cannot be changed.',
      );
    }

    // Save the answer — we'll score it later during submission
    const answer = this.answerRepo.create({
      participationId: participation.id,
      questionId: dto.questionId,
      selectedAnswers: dto.selectedAnswers,
    });

    return this.answerRepo.save(answer);
  }

  // Finish the contest — this triggers scoring and leaderboard update.
  // Once submitted, the user can't change their answers.
  async submitContest(userId: string, contestId: string) {
    const participation = await this.getActiveParticipation(userId, contestId);

    // Load all the user's answers along with the questions (for correct answers)
    const answers = await this.answerRepo.find({
      where: { participationId: participation.id },
      relations: ['question'],
    });

    // Score each answer by comparing with the correct answers
    let totalScore = 0;
    for (const answer of answers) {
      const question = answer.question;
      const isCorrect = this.checkAnswer(
        answer.selectedAnswers,
        question.correctAnswers,
      );

      // Award points if correct, 0 if wrong (no negative scoring)
      answer.isCorrect = isCorrect;
      answer.pointsAwarded = isCorrect ? question.points : 0;
      totalScore += answer.pointsAwarded;

      await this.answerRepo.save(answer);
    }

    // Mark the participation as SUBMITTED and record the final score
    participation.status = ParticipationStatus.SUBMITTED;
    participation.score = totalScore;
    participation.submittedAt = new Date();
    await this.participationRepo.save(participation);

    // Update the leaderboard with this user's score
    await this.leaderboardService.updateEntry(contestId, userId, totalScore);

    return {
      message: 'Contest submitted! Here are your results.',
      score: totalScore,
      totalQuestions: (await this.questionsService.findByContest(contestId)).length,
      answeredQuestions: answers.length,
      correctAnswers: answers.filter((a) => a.isCorrect).length,
      submittedAt: participation.submittedAt,
    };
  }

  // Get the user's active (IN_PROGRESS) participation for a contest
  private async getActiveParticipation(
    userId: string,
    contestId: string,
  ): Promise<Participation> {
    const participation = await this.participationRepo.findOne({
      where: { userId, contestId },
    });

    if (!participation) {
      throw new NotFoundException(
        'You haven\'t joined this contest yet. Join first using the participate endpoint.',
      );
    }

    if (participation.status === ParticipationStatus.SUBMITTED) {
      throw new BadRequestException(
        'You\'ve already submitted this contest. Results are final.',
      );
    }

    return participation;
  }

  // Compare the user's answers with the correct answers.
  // For MULTI_SELECT, order doesn't matter — we sort both arrays and compare.
  private checkAnswer(selected: string[], correct: string[]): boolean {
    if (selected.length !== correct.length) return false;
    const sortedSelected = [...selected].sort();
    const sortedCorrect = [...correct].sort();
    return sortedSelected.every((val, idx) => val === sortedCorrect[idx]);
  }
}
