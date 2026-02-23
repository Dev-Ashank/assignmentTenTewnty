import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuestionType } from '../../common/enums';
import { Contest } from '../../contests/entities/contest.entity';

// A single question within a contest.
// Options are stored as JSON arrays, which keeps things flexible.
// We don't need a separate Options table — JSONB in Postgres handles this well.
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contestId: string;

  @Column({ type: 'text' })
  questionText: string;

  // The question type drives how we validate answers.
  // TRUE_FALSE questions should have exactly two options: ["True", "False"]
  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  // Array of option strings, e.g. ["Paris", "London", "Berlin", "Madrid"]
  @Column({ type: 'jsonb' })
  options: string[];

  // Array of correct answer strings — for SINGLE_SELECT this has one item.
  // For MULTI_SELECT it can have multiple. For TRUE_FALSE it's ["True"] or ["False"].
  @Column({ type: 'jsonb' })
  correctAnswers: string[];

  // How many points this question is worth if answered correctly
  @Column({ default: 1 })
  points: number;

  // Controls the display order within a contest
  @Column({ default: 0 })
  orderIndex: number;

  // --- Relations ---

  @ManyToOne(() => Contest, (c) => c.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contestId' })
  contest: Contest;
}
