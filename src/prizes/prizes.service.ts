import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prize } from './entities/prize.entity';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { ContestsService } from '../contests/contests.service';

// Handles prize awarding. An admin triggers this after a contest ends.
// The top scorer on the leaderboard automatically wins.
@Injectable()
export class PrizesService {
  constructor(
    @InjectRepository(Prize)
    private prizeRepo: Repository<Prize>,
    private leaderboardService: LeaderboardService,
    private contestsService: ContestsService,
  ) {}

  // Award the prize to the top scorer of a contest.
  // The contest must have ended and must have a prizeInfo defined.
  async awardPrize(contestId: string): Promise<Prize> {
    const contest = await this.contestsService.findById(contestId);

    // Can't award prizes for a contest that hasn't ended yet
    if (new Date() < new Date(contest.endTime)) {
      throw new BadRequestException(
        'Contest is still running. Wait until it ends to award prizes.',
      );
    }

    // Must have a prize to award
    if (!contest.prizeInfo) {
      throw new BadRequestException(
        'No prize info defined for this contest. Update the contest first.',
      );
    }

    // Check if a prize was already awarded for this contest
    const existingPrize = await this.prizeRepo.findOne({
      where: { contestId },
    });
    if (existingPrize) {
      throw new BadRequestException(
        'Prize has already been awarded for this contest.',
      );
    }

    // Find the top scorer
    const topScorer = await this.leaderboardService.getTopScorer(contestId);
    if (!topScorer) {
      throw new NotFoundException(
        'No participants found on the leaderboard. Nobody to award the prize to.',
      );
    }

    // Create the prize record
    const prize = this.prizeRepo.create({
      contestId,
      userId: topScorer.userId,
      prizeName: contest.prizeInfo,
    });

    return this.prizeRepo.save(prize);
  }

  // Get all prizes for a user (their reward history)
  async getUserPrizes(userId: string): Promise<Prize[]> {
    return this.prizeRepo.find({
      where: { userId },
      relations: ['contest'],
      order: { awardedAt: 'DESC' },
    });
  }
}
