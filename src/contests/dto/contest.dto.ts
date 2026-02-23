import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContestAccess } from '../../common/enums';

// DTO for creating a new contest. All the essential details.
export class CreateContestDto {
  @ApiProperty({ example: 'JavaScript Quiz Challenge' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Test your JS knowledge with 20 tricky questions!' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ContestAccess, example: 'normal' })
  @IsEnum(ContestAccess)
  accessLevel: ContestAccess;

  @ApiProperty({ example: '2025-03-01T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-03-01T12:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: '$500 Amazon Gift Card for the winner!' })
  @IsOptional()
  @IsString()
  prizeInfo?: string;

  @ApiPropertyOptional({ example: 20, description: 'Max questions in the contest' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuestions?: number;
}

// DTO for updating a contest — everything is optional
export class UpdateContestDto {
  @ApiPropertyOptional({ example: 'Updated Quiz Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ContestAccess })
  @IsOptional()
  @IsEnum(ContestAccess)
  accessLevel?: ContestAccess;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prizeInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuestions?: number;
}
