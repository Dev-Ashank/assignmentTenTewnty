import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Contest } from '../../contests/entities/contest.entity';

// Prizes are awarded to contest winners (usually the top scorer).
// An admin triggers the prize award after the contest ends.
// We keep a record here so users can see their prize history.
@Entity('prizes')
export class Prize {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contestId: string;

  @Column()
  userId: string;

  // e.g. "First Place - $500 Gift Card"
  @Column()
  prizeName: string;

  @CreateDateColumn()
  awardedAt: Date;

  // --- Relations ---

  @ManyToOne(() => Contest, (c) => c.prizes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contestId' })
  contest: Contest;

  @ManyToOne(() => User, (u) => u.prizes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
