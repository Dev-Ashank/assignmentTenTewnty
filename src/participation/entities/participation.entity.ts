import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { ParticipationStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Contest } from '../../contests/entities/contest.entity';
import { Answer } from './answer.entity';

// Represents a user's attempt at a contest.
// Each user can only participate once per contest (enforced by the unique constraint).
// The status goes from IN_PROGRESS → SUBMITTED when they finish.
@Entity('participations')
@Unique(['userId', 'contestId']) // one attempt per user per contest
export class Participation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  contestId: string;

  @Column({
    type: 'enum',
    enum: ParticipationStatus,
    default: ParticipationStatus.IN_PROGRESS,
  })
  status: ParticipationStatus;

  // Final score — only meaningful after status is SUBMITTED
  @Column({ default: 0 })
  score: number;

  @CreateDateColumn()
  startedAt: Date;

  // Null until they submit
  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  // --- Relations ---

  @ManyToOne(() => User, (u) => u.participations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Contest, (c) => c.participations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contestId' })
  contest: Contest;

  @OneToMany(() => Answer, (a) => a.participation, { cascade: true })
  answers: Answer[];
}
