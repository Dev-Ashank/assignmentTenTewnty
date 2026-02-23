import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardEntry } from './entities/leaderboard.entity';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeaderboardEntry])],
  providers: [LeaderboardService],
  controllers: [LeaderboardController],
  exports: [LeaderboardService], // needed by participation and prizes modules
})
export class LeaderboardModule {}
