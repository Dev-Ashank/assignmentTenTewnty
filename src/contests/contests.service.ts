import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contest } from './entities/contest.entity';
import { CreateContestDto, UpdateContestDto } from './dto/contest.dto';
import { ContestAccess, UserRole } from '../common/enums';

// Service for managing contests — CRUD plus access-level filtering.
@Injectable()
export class ContestsService {
  constructor(
    @InjectRepository(Contest)
    private contestsRepo: Repository<Contest>,
  ) {}

  // Create a new contest (admin only, enforced at the controller level)
  async create(dto: CreateContestDto): Promise<Contest> {
    // Make sure the end time is after the start time (common mistake)
    if (new Date(dto.endTime) <= new Date(dto.startTime)) {
      throw new BadRequestException('End time must be after start time.');
    }

    const contest = this.contestsRepo.create(dto);
    return this.contestsRepo.save(contest);
  }

  // List all contests, filtered by the user's role.
  // Guests and regular users only see NORMAL contests.
  // VIP and admins see everything.
  async findAll(userRole?: UserRole): Promise<Contest[]> {
    const query = this.contestsRepo
      .createQueryBuilder('contest')
      .orderBy('contest.startTime', 'DESC');

    // Filter by access level based on who's asking
    if (!userRole || userRole === UserRole.USER || userRole === UserRole.GUEST) {
      query.where('contest.accessLevel = :access', {
        access: ContestAccess.NORMAL,
      });
    }
    // VIP and ADMIN see all contests (no filter needed)

    return query.getMany();
  }

  // Get a single contest with its questions loaded
  async findById(id: string): Promise<Contest> {
    const contest = await this.contestsRepo.findOne({
      where: { id },
      relations: ['questions'],
      order: { questions: { orderIndex: 'ASC' } },
    });

    if (!contest) {
      throw new NotFoundException(`Contest with ID "${id}" not found.`);
    }

    return contest;
  }

  // Update contest details (admin only)
  async update(id: string, dto: UpdateContestDto): Promise<Contest> {
    const contest = await this.findById(id);

    // If they're updating times, validate them
    const startTime = dto.startTime ? new Date(dto.startTime) : contest.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : contest.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time.');
    }

    Object.assign(contest, dto);
    return this.contestsRepo.save(contest);
  }

  // Delete a contest (admin only) — cascades to questions, participations, etc.
  async remove(id: string): Promise<void> {
    const contest = await this.findById(id);
    await this.contestsRepo.remove(contest);
  }
}
