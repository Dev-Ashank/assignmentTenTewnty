import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prize } from './entities/prize.entity';
import { PrizesService } from './prizes.service';
import { PrizesController } from './prizes.controller';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { ContestsModule } from '../contests/contests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prize]),
    LeaderboardModule,
    ContestsModule,
  ],
  providers: [PrizesService],
  controllers: [PrizesController],
  exports: [PrizesService],
})
export class PrizesModule {}
