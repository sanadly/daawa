import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between, In, Like } from 'typeorm';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { User, UserRole } from '../database/entities/user.entity';
import { Event, EventStatus, PlatformPaymentStatus } from '../database/entities/event.entity';
import { Guest } from '../database/entities/guest.entity';
import { UserActivity, ActivityType } from '../database/entities/user-activity.entity';
import { UpdateEventStatusDto } from './dtos/update-event-status.dto';
import { UpdateEventNotesDto } from './dtos/update-event-notes.dto';


@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  private async logActivity(
    userId: string,
    activityType: ActivityType,
    description: string,
    metadata?: any,
  ) {
    const activity = this.userActivityRepository.create({
      user_id: userId,
      activity_type: activityType,
      description,
      metadata,
    });
    await this.userActivityRepository.save(activity);
  }

  async getDashboardStats() {
    const today = new Date();
    const last7Days = subDays(today, 7);

    const [
      totalUsers,
      totalOrganizers,
      totalStaff,
      totalGuests,
      totalEvents,
      pendingApproval,
      activeEvents,
      recentActivity,
      eventsInLast7Days,
      usersInLast7Days,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: {
          role: In([UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER]),
        },
      }),
      this.userRepository.count({ where: { role: UserRole.STAFF } }),
      this.guestRepository.count(),
      this.eventRepository.count(),
      this.eventRepository.count({ where: { status: EventStatus.PUBLISHED } }),
      this.eventRepository.count({ where: { status: EventStatus.ACTIVE } }),
      this.userActivityRepository.find({
        take: 10,
        order: { created_at: 'DESC' },
        relations: ['user'],
      }),
      this.eventRepository.count({
        where: { created_at: MoreThan(last7Days) },
      }),
      this.userRepository.count({
        where: { created_at: MoreThan(last7Days) },
      }),
    ]);

    const eventsByDay = await this.eventRepository
      .createQueryBuilder('event')
      .select("DATE(event.created_at) as date, COUNT(event.id) as count")
      .where("event.created_at >= :startDate", { startDate: last7Days })
      .groupBy("DATE(event.created_at)")
      .orderBy("DATE(event.created_at)")
      .getRawMany();

    return {
      totalUsers,
      totalOrganizers,
      totalStaff,
      totalGuests,
      totalEvents,
      pendingApproval,
      activeEvents,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.activity_type,
        details: activity.description,
        timestamp: activity.created_at,
        user: activity.user?.email || 'System',
      })),
      charts: {
        eventsLast7Days: {
          total: eventsInLast7Days,
          byDay: eventsByDay,
        },
        usersLast7Days: {
          total: usersInLast7Days,
        },
      },
    };
  }

  async getEventsForApproval(page: number = 1, limit: number = 10, search?: string) {
    const query = this.eventRepository.createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .orderBy('event.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere(
        '(event.name ILIKE :search OR organizer.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [events, total] = await query.getManyAndCount();
    
    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEventDetailsForApproval(eventId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, status: EventStatus.PUBLISHED },
      relations: ['organizer', 'tiers'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found or not pending approval.`);
    }
    return event;
  }
  
  async approveEvent(eventId: string, adminUserId: string, notes?: string) {
    return this.updateEventStatus(
      eventId, 
      { status: EventStatus.ACTIVE, notes }, 
      adminUserId
    );
  }

  async rejectEvent(eventId: string, adminUserId: string, notes: string) {
    return this.updateEventStatus(
      eventId,
      { status: EventStatus.CANCELLED, notes },
      adminUserId
    );
  }

  async searchUsers(
    page: number = 1,
    limit: number = 10,
    role?: UserRole | 'ORGANIZER',
    search?: string,
  ) {
    let query = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.role',
        'user.created_at',
        'user.last_login_date',
        'user.account_type',
        'user.company_name',
      ]);
  
    if (role) {
      if (role === 'ORGANIZER') {
        query = query.where('user.role IN (:...roles)', {
          roles: [UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER],
        });
      } else {
        query = query.where('user.role = :role', { role });
      }
    }
  
    if (search) {
      query = query.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search OR user.company_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }
  
    const [users, total] = await query
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  
    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  
  async getUserDetails(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId }});
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [events, activities] = await Promise.all([
      this.eventRepository.find({ where: { organizer_id: userId } }),
      this.userActivityRepository.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: 20,
      }),
    ]);
    
    return { user, events, activities };
  }

  async updateUserRole(userId: string, newRole: UserRole, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId }});
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const oldRole = user.role;
    user.role = newRole;
    await this.userRepository.save(user);

    await this.logActivity(
      adminId,
      ActivityType.ROLE_ASSIGNMENT,
      `Admin changed role of ${user.email} from ${oldRole} to ${newRole}`,
    );
    
    return user;
  }
  
  async getSystemHealth() {
    // This is a placeholder. A real implementation would check database connections,
    // external service availability (e.g., email, S3), etc.
    return {
      status: 'OK',
      timestamp: new Date(),
      dependencies: {
        database: 'Connected',
        emailService: 'Connected',
      },
    };
  }
  
  async getAllUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  
  async searchAdminsAndOrganizers(search: string) {
    // Query for Admins
    const adminQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.ADMIN });
  
    if (search) {
      adminQuery.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }
  
    // New query for Organizers
    const organizerQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: [UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER],
      });
  
    if (search) {
      organizerQuery.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search OR user.company_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }
  
    const [admins, organizers] = await Promise.all([
      adminQuery.getMany(),
      organizerQuery.getMany(),
    ]);
  
    return [...admins, ...organizers];
  }

  async updateEventStatus(
    eventId: string,
    updateStatusDto: UpdateEventStatusDto,
    adminUserId: string,
  ) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found.`);
    }

    // Log the activity
    await this.logActivity(
      adminUserId,
      ActivityType.EVENT_UPDATED,
      `Event status updated from ${event.status} to ${updateStatusDto.status}`,
      {
        oldStatus: event.status,
        newStatus: updateStatusDto.status,
        notes: updateStatusDto.notes,
      },
    );

    // Update the event
    event.status = updateStatusDto.status;
    if (updateStatusDto.notes) {
      event.event_settings = {
        ...event.event_settings,
        adminNotes: updateStatusDto.notes,
      };
    }
    event.updated_at = new Date();

    const updatedEvent = await this.eventRepository.save(event);

    // If approved, event is now active (no additional activation needed)
    if (updateStatusDto.status === EventStatus.ACTIVE) {
      this.logger.log(`Event ${eventId} activated by admin ${adminUserId}`);
    }

    return updatedEvent;
  }

  async updateEventNotes(
    eventId: string,
    notes: string,
    adminUserId: string,
  ) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found.`);
    }

    // Log the activity
    await this.logActivity(
      adminUserId,
      ActivityType.EVENT_UPDATED,
      `Event notes updated`,
      {
        oldNotes: event.event_settings?.adminNotes,
        newNotes: notes,
      },
    );

    event.event_settings = {
      ...event.event_settings,
      adminNotes: notes,
    };
    event.updated_at = new Date();

    return this.eventRepository.save(event);
  }

  async updateEventPaymentStatus(
    eventId: string, 
    paymentStatus: PlatformPaymentStatus,
    paymentReference?: string,
  ): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer']
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Create activity log
    const activity = this.userActivityRepository.create({
      user_id: event.organizer_id,
      activity_type: ActivityType.EVENT_PAYMENT_STATUS_UPDATE,
      description: `Event payment status updated to ${paymentStatus}`,
      metadata: {
        eventId: event.id,
        eventName: event.name,
        oldStatus: event.platform_payment_status,
        newStatus: paymentStatus,
        paymentReference: paymentReference || null,
      },
    });

    await this.userActivityRepository.save(activity);

    // Update the event
    event.platform_payment_status = paymentStatus;
    if (paymentReference) {
      event.platform_payment_reference = paymentReference;
    }
    if (paymentStatus === PlatformPaymentStatus.PAID) {
      event.platform_payment_date = new Date();
    }

    return await this.eventRepository.save(event);
  }

  // Add missing methods that the controller expects
  async getDashboardMetrics() {
    return this.getDashboardStats();
  }

  async getEvents(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.getEventsForApproval(options.page, options.limit, options.search);
  }

  async getEventDetail(eventId: string) {
    return this.getEventDetailsForApproval(eventId);
  }

  async bulkUpdateEvents(eventIds: string[], action: string, adminUserId: string) {
    const results = [];
    
    for (const eventId of eventIds) {
      try {
        let result;
        switch (action) {
          case 'approve':
            result = await this.approveEvent(eventId, adminUserId);
            break;
          case 'reject':
            result = await this.rejectEvent(eventId, adminUserId, 'Bulk rejection');
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push({ eventId, success: true, result });
      } catch (error) {
        results.push({ 
          eventId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return { results };
  }

  async getOrganizers(options: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.searchUsers(options.page, options.limit, 'ORGANIZER', options.search);
  }

  async getAuditLog(options: {
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .orderBy('activity.created_at', 'DESC')
      .skip(((options.page || 1) - 1) * (options.limit || 10))
      .take(options.limit || 10);

    // Note: UserActivity entity doesn't have entity_type/entity_id fields
    // We'll filter by metadata if needed
    if (options.entityType || options.entityId) {
      query.andWhere('activity.metadata IS NOT NULL');
    }

    const [activities, total] = await query.getManyAndCount();

    return {
      data: activities.map(activity => ({
        id: activity.id,
        action: activity.activity_type,
        details: activity.description,
        timestamp: activity.created_at,
        user: activity.user?.email || 'System',
        metadata: activity.metadata,
      })),
      total,
      page: options.page || 1,
      limit: options.limit || 10,
      totalPages: Math.ceil(total / (options.limit || 10)),
    };
  }

  // Analytics Methods
  async getAnalyticsOverview(period?: string) {
    const days = period === 'month' ? 30 : period === 'week' ? 7 : 1;
    const startDate = subDays(new Date(), days);

    const [
      totalRevenue,
      revenueInPeriod,
      eventStats,
      userGrowth,
      topOrganizers,
    ] = await Promise.all([
      this.eventRepository
        .createQueryBuilder('event')
        .select('SUM(event.platform_fee)', 'total')
        .where('event.platform_payment_status = :status', { status: PlatformPaymentStatus.PAID })
        .getRawOne(),
      this.eventRepository
        .createQueryBuilder('event')
        .select('SUM(event.platform_fee)', 'total')
        .where('event.platform_payment_status = :status', { status: PlatformPaymentStatus.PAID })
        .andWhere('event.platform_payment_date >= :startDate', { startDate })
        .getRawOne(),
      this.eventRepository
        .createQueryBuilder('event')
        .select([
          'COUNT(*) as total_events',
          'COUNT(CASE WHEN status = :active THEN 1 END) as active_events',
          'COUNT(CASE WHEN status = :published THEN 1 END) as pending_events',
        ])
        .setParameters({ active: EventStatus.ACTIVE, published: EventStatus.PUBLISHED })
        .getRawOne(),
      this.userRepository
        .createQueryBuilder('user')
        .select('COUNT(*)', 'count')
        .where('user.created_at >= :startDate', { startDate })
        .getRawOne(),
      this.eventRepository
        .createQueryBuilder('event')
        .leftJoin('event.organizer', 'organizer')
        .select([
          'organizer.name as organizer_name',
          'organizer.email as organizer_email',
          'COUNT(event.id) as event_count',
          'SUM(event.platform_fee) as total_revenue',
        ])
        .where('event.platform_payment_status = :status', { status: PlatformPaymentStatus.PAID })
        .groupBy('organizer.id, organizer.name, organizer.email')
        .orderBy('total_revenue', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

    return {
      revenue: {
        total: parseFloat(totalRevenue?.total || '0'),
        period: parseFloat(revenueInPeriod?.total || '0'),
      },
      events: {
        total: parseInt(eventStats.total_events),
        active: parseInt(eventStats.active_events),
        pending: parseInt(eventStats.pending_events),
      },
      userGrowth: parseInt(userGrowth.count),
      topOrganizers,
    };
  }

  async getRevenueAnalytics(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate) : new Date();

    const revenueByDay = await this.eventRepository
      .createQueryBuilder('event')
      .select([
        'DATE(event.platform_payment_date) as date',
        'SUM(event.platform_fee) as revenue',
        'COUNT(event.id) as event_count',
      ])
      .where('event.platform_payment_status = :status', { status: PlatformPaymentStatus.PAID })
      .andWhere('event.platform_payment_date BETWEEN :start AND :end', { start, end })
      .groupBy('DATE(event.platform_payment_date)')
      .orderBy('DATE(event.platform_payment_date)')
      .getRawMany();

    const totalRevenue = revenueByDay.reduce((sum, day) => sum + parseFloat(day.revenue), 0);
    const totalEvents = revenueByDay.reduce((sum, day) => sum + parseInt(day.event_count), 0);

    return {
      totalRevenue,
      totalEvents,
      averagePerEvent: totalEvents > 0 ? totalRevenue / totalEvents : 0,
      dailyBreakdown: revenueByDay,
    };
  }

  async getEventFinancialSummary(eventId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['tiers', 'guests'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const guestCount = event.guests?.length || 0;
    const totalCapacity = event.tiers?.reduce((sum, tier) => sum + (tier.guest_limit || 0), 0) || 0;
    const totalRevenue = event.tiers?.reduce((sum, tier) => {
      const tierGuests = event.guests?.filter(guest => guest.tier_id === tier.id).length || 0;
      return sum + (tierGuests * (tier.price || 0));
    }, 0) || 0;

    return {
      eventId: event.id,
      eventName: event.name,
      platformFee: event.platform_fee || 0,
      platformPaymentStatus: event.platform_payment_status,
      platformPaymentDate: event.platform_payment_date,
      guestCount,
      totalCapacity,
      totalRevenue,
      occupancyRate: totalCapacity > 0 ? (guestCount / totalCapacity) * 100 : 0,
    };
  }

  // User Management Methods
  async getUsers(options: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const query = this.userRepository.createQueryBuilder('user');

    if (options.role && options.role !== 'all') {
      if (options.role === 'ORGANIZER') {
        query.where('user.role IN (:...roles)', {
          roles: [UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER],
        });
      } else {
        query.where('user.role = :role', { role: options.role });
      }
    }

    if (options.search) {
      query.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.company_name ILIKE :search)',
        { search: `%${options.search}%` }
      );
    }

    if (options.status) {
      const isActive = options.status === 'active';
      query.andWhere('user.is_active = :isActive', { isActive });
    }

    const [users, total] = await query
      .orderBy('user.created_at', 'DESC')
      .skip(((options.page || 1) - 1) * (options.limit || 10))
      .take(options.limit || 10)
      .getManyAndCount();

    return {
      data: users,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
      totalPages: Math.ceil(total / (options.limit || 10)),
    };
  }

  async updateUserStatus(userId: string, isActive: boolean, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldStatus = user.is_active;
    user.is_active = isActive;
    await this.userRepository.save(user);

    await this.logActivity(
      adminId,
      ActivityType.USER_STATUS_UPDATE,
      `User ${user.email} status changed from ${oldStatus ? 'active' : 'inactive'} to ${isActive ? 'active' : 'inactive'}`,
      { userId, oldStatus, newStatus: isActive }
    );

    return user;
  }

  async deleteUser(userId: string, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has events - prevent deletion if they do
    const eventCount = await this.eventRepository.count({ where: { organizer_id: userId } });
    if (eventCount > 0) {
      throw new BadRequestException('Cannot delete user with existing events');
    }

    await this.userRepository.remove(user);

    await this.logActivity(
      adminId,
      ActivityType.USER_DELETED,
      `User ${user.email} was deleted`,
      { deletedUserId: userId, deletedUserEmail: user.email }
    );

    return { success: true, message: 'User deleted successfully' };
  }

  // Payment Management Methods
  async getPayments(options: {
    status?: string;
    eventId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .select([
        'event.id',
        'event.name',
        'event.platform_fee',
        'event.platform_payment_status',
        'event.platform_payment_date',
        'event.platform_payment_reference',
        'organizer.name',
        'organizer.email',
      ]);

    if (options.status) {
      query.where('event.platform_payment_status = :status', { status: options.status });
    }

    if (options.eventId) {
      query.andWhere('event.id = :eventId', { eventId: options.eventId });
    }

    const [events, total] = await query
      .orderBy('event.created_at', 'DESC')
      .skip(((options.page || 1) - 1) * (options.limit || 10))
      .take(options.limit || 10)
      .getManyAndCount();

    return {
      data: events,
      total,
      page: options.page || 1,
      limit: options.limit || 10,
      totalPages: Math.ceil(total / (options.limit || 10)),
    };
  }

  async getPaymentsSummary() {
    const [
      totalPaid,
      totalPending,
      totalOverdue,
      recentPayments,
    ] = await Promise.all([
      this.eventRepository
        .createQueryBuilder('event')
        .select('SUM(event.platform_fee)', 'total')
        .where('event.platform_payment_status = :status', { status: PlatformPaymentStatus.PAID })
        .getRawOne(),
      this.eventRepository
        .createQueryBuilder('event')
        .select('SUM(event.platform_fee)', 'total')
        .where('event.platform_payment_status = :status', { status: PlatformPaymentStatus.PENDING })
        .getRawOne(),
      this.eventRepository
        .createQueryBuilder('event')
        .select('SUM(event.platform_fee)', 'total')
        .where('event.platform_payment_status = :status', { status: PlatformPaymentStatus.OVERDUE })
        .getRawOne(),
      this.eventRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.organizer', 'organizer')
        .where('event.platform_payment_status = :status', { status: PlatformPaymentStatus.PAID })
        .orderBy('event.platform_payment_date', 'DESC')
        .take(5)
        .getMany(),
    ]);

    return {
      summary: {
        totalPaid: parseFloat(totalPaid?.total || '0'),
        totalPending: parseFloat(totalPending?.total || '0'),
        totalOverdue: parseFloat(totalOverdue?.total || '0'),
      },
      recentPayments,
    };
  }

  async processPayment(eventId: string, paymentDto: { amount: number; reference?: string }, adminId: string) {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    event.platform_payment_status = PlatformPaymentStatus.PAID;
    event.platform_payment_date = new Date();
    event.platform_fee = paymentDto.amount;
    if (paymentDto.reference) {
      event.platform_payment_reference = paymentDto.reference;
    }

    await this.eventRepository.save(event);

    await this.logActivity(
      adminId,
      ActivityType.PAYMENT_PROCESSED,
      `Payment processed for event ${event.name}: $${paymentDto.amount}`,
      { eventId, amount: paymentDto.amount, reference: paymentDto.reference }
    );

    return event;
  }

  // System Monitoring Methods
  async getSystemStats() {
    const [
      dbStats,
      userStats,
      eventStats,
      recentActivity,
    ] = await Promise.all([
      this.getDatabaseStats(),
      this.getUserStats(),
      this.getEventStats(),
      this.userActivityRepository.find({
        take: 10,
        order: { created_at: 'DESC' },
        relations: ['user'],
      }),
    ]);

    return {
      database: dbStats,
      users: userStats,
      events: eventStats,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.activity_type,
        details: activity.description,
        timestamp: activity.created_at,
        user: activity.user?.email || 'System',
      })),
      systemHealth: await this.getSystemHealth(),
    };
  }

  private async getDatabaseStats() {
    const [userCount, eventCount, guestCount, activityCount] = await Promise.all([
      this.userRepository.count(),
      this.eventRepository.count(),
      this.guestRepository.count(),
      this.userActivityRepository.count(),
    ]);

    return {
      totalUsers: userCount,
      totalEvents: eventCount,
      totalGuests: guestCount,
      totalActivities: activityCount,
    };
  }

  private async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      adminCount,
      organizerCount,
      staffCount,
      newUsersToday,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { is_active: true } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
      this.userRepository.count({
        where: { role: In([UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER]) },
      }),
      this.userRepository.count({ where: { role: UserRole.STAFF } }),
      this.userRepository.count({
        where: { created_at: MoreThan(startOfDay(new Date())) },
      }),
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      admins: adminCount,
      organizers: organizerCount,
      staff: staffCount,
      newToday: newUsersToday,
    };
  }

  private async getEventStats() {
    const [
      totalEvents,
      activeEvents,
      publishedEvents,
      draftEvents,
      cancelledEvents,
      newEventsToday,
    ] = await Promise.all([
      this.eventRepository.count(),
      this.eventRepository.count({ where: { status: EventStatus.ACTIVE } }),
      this.eventRepository.count({ where: { status: EventStatus.PUBLISHED } }),
      this.eventRepository.count({ where: { status: EventStatus.DRAFT } }),
      this.eventRepository.count({ where: { status: EventStatus.CANCELLED } }),
      this.eventRepository.count({
        where: { created_at: MoreThan(startOfDay(new Date())) },
      }),
    ]);

    return {
      total: totalEvents,
      active: activeEvents,
      published: publishedEvents,
      draft: draftEvents,
      cancelled: cancelledEvents,
      newToday: newEventsToday,
    };
  }
} 