import { IsArray, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO for submitting an answer to a question during a contest
export class SubmitAnswerDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the question being answered',
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({
    example: ['Paris'],
    description: 'Array of selected answer(s). Use one item for single-select/true-false.',
  })
  @IsArray()
  @IsString({ each: true })
  selectedAnswers: string[];
}
