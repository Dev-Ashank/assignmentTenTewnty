import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participation } from '../participation/entities/participation.entity';
import { Prize } from '../prizes/entities/prize.entity';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

// History module is read-only — it queries data from Participation and Prize tables.
// We import the entities directly (via TypeOrmModule) rather than importing the other modules,
// because we only need read access, not the full service logic.
@Module({
  imports: [TypeOrmModule.forFeature([Participation, Prize])],
  providers: [HistoryService],
  controllers: [HistoryController],
})
export class HistoryModule {}
