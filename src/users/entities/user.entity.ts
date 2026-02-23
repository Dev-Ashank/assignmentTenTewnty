import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../common/enums';
import { Participation } from '../../participation/entities/participation.entity';
import { LeaderboardEntry } from '../../leaderboard/entities/leaderboard.entity';
import { Prize } from '../../prizes/entities/prize.entity';

// The User entity is the backbone of our auth system.
// Every person who registers gets a row here. Role determines what they can access.
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Username must be unique — used for login
  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  // We never store plain-text passwords. This is a bcrypt hash.
  @Column()
  passwordHash: string;

  // Defaults to USER. Admin can upgrade users to VIP.
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // --- Relations ---

  @OneToMany(() => Participation, (p) => p.user)
  participations: Participation[];

  @OneToMany(() => LeaderboardEntry, (l) => l.user)
  leaderboardEntries: LeaderboardEntry[];

  @OneToMany(() => Prize, (p) => p.user)
  prizes: Prize[];
}
