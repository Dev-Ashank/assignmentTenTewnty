import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

// Handles registration and login logic.
// Passwords are hashed with bcrypt before storage — never stored in plain text.
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Register a new user. We hash the password and check for duplicates.
  async register(dto: RegisterDto) {
    // Check if username or email already exists
    const existingUser = await this.usersService.findByUsername(dto.username);
    if (existingUser) {
      throw new ConflictException('Username is already taken. Try another one.');
    }

    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists.');
    }

    // Hash the password with a salt rounds of 10 (good balance of security vs speed)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: dto.role, // if not provided, the entity default (USER) kicks in
    });

    // Return a token right away so they don't have to login separately
    const token = this.generateToken(user);
    return {
      message: 'Registration successful! Welcome aboard.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken: token,
    };
  }

  // Login with username + password. Returns a JWT if credentials match.
  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      // Vague message on purpose — don't reveal whether the username exists
      throw new UnauthorizedException('Invalid username or password.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    const token = this.generateToken(user);
    return {
      message: 'Login successful!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken: token,
    };
  }

  // Build a JWT with the user's ID, username, and role in the payload.
  // The role is included so we can do quick role checks without hitting the DB.
  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
