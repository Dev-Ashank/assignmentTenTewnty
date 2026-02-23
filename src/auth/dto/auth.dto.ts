import { IsString, IsEmail, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';

// DTO for user registration — we validate everything before it hits the service layer
export class RegisterDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username for the account' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  // Optional: admin can create users with a specific role
  @ApiPropertyOptional({ enum: UserRole, description: 'User role (defaults to USER)' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

// DTO for login — just username and password
export class LoginDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  password: string;
}
