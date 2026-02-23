import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participation } from '../participation/entities/participation.entity';
import { Prize } from '../prizes/entities/prize.entity';
import { ParticipationStatus } from '../common/enums';

// Service that aggregates a user's participation history and prize records.
// These are read-only queries — no mutations happen here.
@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(Participation)
    private participationRepo: Repository<Participation>,
    @InjectRepository(Prize)
    private prizeRepo: Repository<Prize>,
  ) {}

  // Get all participations for a user, with contest details
  async getUserHistory(userId: string) {
    const participations = await this.participationRepo.find({
      where: { userId },
      relations: ['contest'],
      order: { startedAt: 'DESC' },
    });

    // Format nicely — the user doesn't need internal IDs
    return participations.map((p) => ({
      participationId: p.id,
      contest: {
        id: p.contest.id,
        name: p.contest.name,
        description: p.contest.description,
        startTime: p.contest.startTime,
        endTime: p.contest.endTime,
      },
      status: p.status,
      score: p.score,
      startedAt: p.startedAt,
      submittedAt: p.submittedAt,
    }));
  }

  // Get only IN_PROGRESS participations — contests the user started but didn't finish
  async getInProgressContests(userId: string) {
    const participations = await this.participationRepo.find({
      where: { userId, status: ParticipationStatus.IN_PROGRESS },
      relations: ['contest'],
      order: { startedAt: 'DESC' },
    });

    return participations.map((p) => ({
      participationId: p.id,
      contest: {
        id: p.contest.id,
        name: p.contest.name,
        endTime: p.contest.endTime,
      },
      startedAt: p.startedAt,
    }));
  }

  // Get all prizes won by a user
  async getUserPrizes(userId: string) {
    const prizes = await this.prizeRepo.find({
      where: { userId },
      relations: ['contest'],
      order: { awardedAt: 'DESC' },
    });

    return prizes.map((p) => ({
      prizeId: p.id,
      prizeName: p.prizeName,
      contest: {
        id: p.contest.id,
        name: p.contest.name,
      },
      awardedAt: p.awardedAt,
    }));
  }
}
