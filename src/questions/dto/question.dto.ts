import {
  IsString,
  IsEnum,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '../../common/enums';

// DTO for adding a question to a contest
export class CreateQuestionDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  questionText: string;

  @ApiProperty({ enum: QuestionType, example: 'single_select' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({
    example: ['Paris', 'London', 'Berlin', 'Madrid'],
    description: 'Array of answer options',
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'A question must have at least 2 options' })
  options: string[];

  @ApiProperty({
    example: ['Paris'],
    description: 'Array of correct answer(s) — must be a subset of options',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'There must be at least 1 correct answer' })
  correctAnswers: string[];

  @ApiPropertyOptional({ example: 10, description: 'Points awarded for a correct answer' })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({ example: 1, description: 'Display order in the contest' })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

// DTO for updating a question — all fields optional
export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  correctAnswers?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
