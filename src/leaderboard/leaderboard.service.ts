import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardEntry } from './entities/leaderboard.entity';

// Manages the leaderboard for each contest.
// Entries are created/updated when a user submits their contest.
// Ranks are recalculated each time so they stay accurate.
@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepo: Repository<LeaderboardEntry>,
  ) {}

  // Create or update a user's leaderboard entry for a contest.
  // Called after every submission so the rankings stay fresh.
  async updateEntry(
    contestId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    // Check if this user already has a leaderboard entry for this contest
    let entry = await this.leaderboardRepo.findOne({
      where: { contestId, userId },
    });

    if (entry) {
      // Update existing entry
      entry.score = score;
    } else {
      // Create new entry
      entry = this.leaderboardRepo.create({ contestId, userId, score });
    }

    await this.leaderboardRepo.save(entry);

    // Recalculate ranks for the entire contest
    // Everyone's rank might shift when a new score comes in
    await this.recalculateRanks(contestId);
  }

  // Get the leaderboard for a contest, sorted by rank (top scores first)
  async getLeaderboard(contestId: string): Promise<LeaderboardEntry[]> {
    return this.leaderboardRepo.find({
      where: { contestId },
      relations: ['user'],
      order: { rank: 'ASC' },
    });
  }

  // Get the top scorer for a contest (used when awarding prizes)
  async getTopScorer(contestId: string): Promise<LeaderboardEntry | null> {
    return this.leaderboardRepo.findOne({
      where: { contestId, rank: 1 },
      relations: ['user'],
    });
  }

  // Recalculate all ranks for a contest.
  // We fetch all entries sorted by score descending, then assign rank 1, 2, 3...
  // Users with the same score get the same rank (standard competition ranking).
  private async recalculateRanks(contestId: string): Promise<void> {
    const entries = await this.leaderboardRepo.find({
      where: { contestId },
      order: { score: 'DESC' },
    });

    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      // If this entry has the same score as the previous one, give it the same rank
      if (i > 0 && entries[i].score === entries[i - 1].score) {
        entries[i].rank = entries[i - 1].rank;
      } else {
        entries[i].rank = currentRank;
      }
      currentRank++;
    }

    // Save all updated ranks in one go
    await this.leaderboardRepo.save(entries);
  }
}
