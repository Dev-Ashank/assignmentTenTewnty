import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// Mock the UsersService — we don't want to hit the real database in unit tests
const mockUsersService = {
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear all mocks between tests to avoid cross-contamination
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return a JWT token', async () => {
      // Simulate: no existing user with this username or email
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: 'user-123',
        username: 'john_doe',
        email: 'john@example.com',
        role: 'user',
      });

      const result = await service.register({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'SecureP@ss123',
      });

      // Should return a token and user info
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.username).toBe('john_doe');
      expect(result.message).toContain('Registration successful');

      // Make sure we hashed the password before saving
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'john_doe',
          passwordHash: expect.any(String),
        }),
      );
    });

    it('should throw ConflictException if username is already taken', async () => {
      mockUsersService.findByUsername.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'SecureP@ss123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email is already registered', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          username: 'new_user',
          email: 'already@used.com',
          password: 'SecureP@ss123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create a real bcrypt hash so the comparison works
      const hashedPassword = await bcrypt.hash('SecureP@ss123', 10);

      mockUsersService.findByUsername.mockResolvedValue({
        id: 'user-123',
        username: 'john_doe',
        email: 'john@example.com',
        passwordHash: hashedPassword,
        role: 'user',
      });

      const result = await service.login({
        username: 'john_doe',
        password: 'SecureP@ss123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.message).toContain('Login successful');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);

      mockUsersService.findByUsername.mockResolvedValue({
        id: 'user-123',
        username: 'john_doe',
        passwordHash: hashedPassword,
        role: 'user',
      });

      await expect(
        service.login({
          username: 'john_doe',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.login({
          username: 'ghost_user',
          password: 'any-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
