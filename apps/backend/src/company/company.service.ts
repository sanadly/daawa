import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, Event, Guest } from '../database/entities';
import { RegisterDto } from '../auth/dtos/register.dto';
import { AuthService } from '../auth/services/auth.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    private readonly authService: AuthService,
  ) {}

  async registerStaff(
    createStaffDto: Omit<RegisterDto, 'account_type' | 'role'>,
    companyOrganizer: User,
  ): Promise<Omit<User, 'password_hash'>> {
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

    // Fetch the user object without password_hash
    const newUser = await this.userRepository.findOne({
      where: { id: authResponse.user.id },
      select: [
        'id', 'email', 'name', 'role', 'account_type', 'company_name', 
        'company_registration_number', 'company_website', 'company_address', 
        'job_title', 'company_location', 'company_description', 
        'company_events_per_month', 'company_staff_needed', 'managing_organization_id',
        'preferred_language', 'phone', 'avatar_url', 'email_verified', 
        'is_active', 'last_login_at', 'created_at', 'updated_at'
      ]
    });
    
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

  async getCompanyStats(companyOrganizer: User) {
    if (companyOrganizer.role !== UserRole.COMPANY_ORGANIZER) {
      throw new ForbiddenException('Only company organizers can view company statistics.');
    }

    // Return a simple test response first
    return {
      company: {
        name: companyOrganizer.company_name,
        organizer: {
          id: companyOrganizer.id,
          name: companyOrganizer.name,
          email: companyOrganizer.email,
        },
      },
      stats: {
        totalEvents: 0,
        totalGuests: 0,
        managedUsers: 0,
        eventsByStatus: {},
        guestsByRsvpStatus: {},
      },
      recentEvents: [],
      lastUpdated: new Date().toISOString(),
    };
  }
} 