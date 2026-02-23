import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participation } from './entities/participation.entity';
import { Answer } from './entities/answer.entity';
import { ParticipationService } from './participation.service';
import { ParticipationController } from './participation.controller';
import { ContestsModule } from '../contests/contests.module';
import { QuestionsModule } from '../questions/questions.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

// This module depends on Contests (for access checks), Questions (for scoring),
// and Leaderboard (to update rankings after submission).
@Module({
  imports: [
    TypeOrmModule.forFeature([Participation, Answer]),
    ContestsModule,
    QuestionsModule,
    LeaderboardModule,
  ],
  providers: [ParticipationService],
  controllers: [ParticipationController],
  exports: [ParticipationService],
})
export class ParticipationModule {}
