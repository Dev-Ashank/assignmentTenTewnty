import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ContestAccess } from '../../common/enums';
import { Question } from '../../questions/entities/question.entity';
import { Participation } from '../../participation/entities/participation.entity';
import { LeaderboardEntry } from '../../leaderboard/entities/leaderboard.entity';
import { Prize } from '../../prizes/entities/prize.entity';

// Each contest is a timed event with questions, a prize, and access rules.
// Think of it like a quiz show — people join, answer questions, and the top scorer wins.
@Entity('contests')
export class Contest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Determines who can participate — either open to everyone or VIP-only
  @Column({ type: 'enum', enum: ContestAccess, default: ContestAccess.NORMAL })
  accessLevel: ContestAccess;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  // Human-readable prize description, e.g. "$500 Amazon Gift Card"
  @Column({ nullable: true })
  prizeInfo: string;

  // We can soft-disable a contest without deleting it
  @Column({ default: true })
  isActive: boolean;

  // Maximum number of questions a participant sees (null = all questions)
  @Column({ nullable: true })
  maxQuestions: number;

  @CreateDateColumn()
  createdAt: Date;

  // --- Relations ---

  @OneToMany(() => Question, (q) => q.contest, { cascade: true })
  questions: Question[];

  @OneToMany(() => Participation, (p) => p.contest)
  participations: Participation[];

  @OneToMany(() => LeaderboardEntry, (l) => l.contest)
  leaderboardEntries: LeaderboardEntry[];

  @OneToMany(() => Prize, (p) => p.contest)
  prizes: Prize[];
}
