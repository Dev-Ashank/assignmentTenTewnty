import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Participation } from './participation.entity';
import { Question } from '../../questions/entities/question.entity';

// Stores a user's answer to a specific question within their participation.
// We evaluate correctness at submission time and record it here for auditing.
@Entity('answers')
@Unique(['participationId', 'questionId']) // can't answer the same question twice
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  participationId: string;

  @Column()
  questionId: string;

  // The option(s) the user picked, stored as a JSON array
  // e.g. ["Paris"] for single-select, ["Red", "Blue"] for multi-select
  @Column({ type: 'jsonb' })
  selectedAnswers: string[];

  // Did they get it right? Null until scoring happens.
  @Column({ nullable: true })
  isCorrect: boolean;

  // Points earned — 0 if wrong, question.points if correct
  @Column({ default: 0 })
  pointsAwarded: number;

  // --- Relations ---

  @ManyToOne(() => Participation, (p) => p.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participationId' })
  participation: Participation;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;
}
