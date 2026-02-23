import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Contest } from '../../contests/entities/contest.entity';

// Leaderboard entries are (re)calculated when a user submits their contest.
// We store the rank so we don't have to recompute it on every read.
// The unique constraint ensures one entry per user per contest.
@Entity('leaderboard')
@Unique(['contestId', 'userId'])
export class LeaderboardEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contestId: string;

  @Column()
  userId: string;

  @Column({ default: 0 })
  score: number;

  // Rank within this specific contest (1 = first place)
  @Column({ default: 0 })
  rank: number;

  // --- Relations ---

  @ManyToOne(() => Contest, (c) => c.leaderboardEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contestId' })
  contest: Contest;

  @ManyToOne(() => User, (u) => u.leaderboardEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
