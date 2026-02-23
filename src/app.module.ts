import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContestsModule } from './contests/contests.module';
import { QuestionsModule } from './questions/questions.module';
import { ParticipationModule } from './participation/participation.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PrizesModule } from './prizes/prizes.module';
import { HistoryModule } from './history/history.module';

// Global exception filter
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// The root module that ties everything together.
// Config, database, rate limiting, and all feature modules are imported here.
@Module({
  imports: [
    // Load .env variables globally — accessible everywhere via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // PostgreSQL connection via TypeORM
    // The `synchronize: true` auto-creates tables from entities (DON'T use in prod!)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'contest_db'),
        autoLoadEntities: true, // automatically picks up all @Entity() classes
        synchronize: true, // auto-sync schema — convenient for development
        logging: false,
      }),
      inject: [ConfigService],
    }),

    // Rate limiting to prevent API abuse
    // Default: 100 requests per minute per IP (customizable per endpoint)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL', 60000),
            limit: configService.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // All feature modules
    AuthModule,
    UsersModule,
    ContestsModule,
    QuestionsModule,
    ParticipationModule,
    LeaderboardModule,
    PrizesModule,
    HistoryModule,
  ],
  providers: [
    // Apply rate limiting globally — every endpoint is protected by default
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply our custom exception filter globally
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
