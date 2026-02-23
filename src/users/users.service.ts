import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

// Service for all user-related database operations.
// Keeps things simple — just CRUD, no business logic here.
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  // Create a new user record
  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  // Find a user by username — used during login
  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  // Find a user by email — used to check for duplicates during registration
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  // Find by ID — used by the JWT strategy to load the user on each request
  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  // Admin can update a user's role (e.g., promoting someone to VIP)
  async updateRole(id: string, role: string): Promise<User> {
    await this.usersRepo.update(id, { role: role as any });
    return this.findById(id);
  }
}
