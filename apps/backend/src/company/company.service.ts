import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities';
import { RegisterDto } from '../auth/dtos/register.dto';
import { AuthService } from '../auth/services/auth.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  async registerStaff(
    createStaffDto: Omit<RegisterDto, 'account_type' | 'role'>,
    companyOrganizer: User,
  ): Promise<User> {
    if (companyOrganizer.role !== UserRole.COMPANY_ORGANIZER) {
      throw new ForbiddenException('Only company organizers can register staff.');
    }

    const authResponse = await this.authService.register({
      ...createStaffDto,
      role: UserRole.STAFF,
      account_type: companyOrganizer.account_type,
      company_name: companyOrganizer.company_name,
      managing_organization_id: companyOrganizer.id,
    });

    if (!authResponse.user.id) {
      throw new NotFoundException('Failed to retrieve created user ID after registration.');
    }

    // Fetch the full user object to return
    const newUser = await this.userRepository.findOneBy({ id: authResponse.user.id });
    if (!newUser) {
      throw new NotFoundException('Could not find the newly created user.');
    }

    return newUser;
  }

  async getManagedUsers(companyOrganizer: User): Promise<User[]> {
    if (companyOrganizer.role !== UserRole.COMPANY_ORGANIZER) {
      throw new ForbiddenException('Only company organizers can view managed users.');
    }

    const users = await this.userRepository.find({
      where: { managing_organization_id: companyOrganizer.id },
      select: ['id', 'name', 'email', 'job_title', 'role', 'is_active'],
    });

    return users;
  }
} 