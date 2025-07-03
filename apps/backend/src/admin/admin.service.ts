import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Event, EventStatus } from '../database/entities/event.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { UserActivity, ActivityType } from '../database/entities/user-activity.entity';
import { UpdateEventStatusDto } from './dtos/update-event-status.dto';
import { ActivationService } from '../events/activation.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
    private activationService: ActivationService,
  ) {}

  async getDashboardMetrics() {
    const [
      totalEvents,
      pendingApproval,
      activeEvents,
      totalOrganizers,
      recentActivity,
    ] = await Promise.all([
      this.eventRepository.count(),
      this.eventRepository.count({ where: { status: EventStatus.PUBLISHED } }),
      this.eventRepository.count({ where: { status: EventStatus.ACTIVE } }),
      this.userRepository.count({ where: { role: UserRole.ORGANIZER } }),
      this.userActivityRepository.find({
        take: 10,
        order: { created_at: 'DESC' },
        relations: ['user'],
      }),
    ]);

    return {
      totalEvents,
      pendingApproval,
      activeEvents,
      totalOrganizers,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.activity_type,
        entity: 'User Activity',
        entityId: activity.user_id,
        timestamp: activity.created_at,
        adminUser: activity.user?.email || 'System',
      })),
    };
  }

  async getEvents(filters: {
    status?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { status, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer');

    if (status) {
      queryBuilder.andWhere('event.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(event.name ILIKE :search OR event.venue_name ILIKE :search OR organizer.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [events, total] = await queryBuilder
      .orderBy('event.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      events: events.map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: event.start_datetime,
        endDate: event.end_datetime,
        venue: event.venue_name,
        status: event.status,
        organizerName: event.organizer?.name || 'Unknown',
        organizerEmail: event.organizer?.email || 'Unknown',
        totalCapacity: event.capacity_limit,
        submittedAt: event.created_at,
        activatedAt: event.updated_at,
        adminNotes: event.event_details?.adminNotes,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventDetail(eventId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'tiers'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Get audit log for this event
    const auditLog = await this.userActivityRepository.find({
      where: { user_id: event.organizer_id },
      order: { created_at: 'DESC' },
      relations: ['user'],
    });

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      startDate: event.start_datetime,
      endDate: event.end_datetime,
      venue: event.venue_name,
      address: event.venue_address,
      status: event.status,
      organizerName: event.organizer?.name || 'Unknown',
      organizerEmail: event.organizer?.email || 'Unknown',
      organizerPhone: event.organizer?.phone || 'N/A',
      totalCapacity: event.capacity_limit,
      registeredCount: 0, // TODO: Calculate from actual registrations
      checkedInCount: 0, // TODO: Calculate from actual check-ins
      submittedAt: event.created_at,
      activatedAt: event.status === EventStatus.ACTIVE ? event.updated_at : null,
      adminNotes: event.event_details?.adminNotes,
      tiers: event.tiers?.map(tier => ({
        id: tier.id,
        name: tier.name,
        price: tier.price,
        currency: tier.currency,
        capacity: tier.guest_limit,
        description: tier.description,
        availableCount: tier.guest_limit, // TODO: Calculate from actual sales
      })) || [],
      forms: event.form_config || [],
      design: event.design_config || {},
      auditLog: auditLog.map(entry => ({
        id: entry.id,
        action: entry.activity_type,
        details: entry.description,
        timestamp: entry.created_at,
        adminUser: entry.user?.email || 'System',
      })),
    };
  }

  async updateEventStatus(
    eventId: string,
    updateStatusDto: UpdateEventStatusDto,
    adminUserId: string,
  ) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const oldStatus = event.status;

    // Handle activation using the ActivationService
    if (updateStatusDto.status === EventStatus.ACTIVE) {
      const activationResult = await this.activationService.activateEvent(
        eventId,
        adminUserId,
        updateStatusDto.notes,
      );

      if (!activationResult.success) {
        throw new Error(`Activation failed: ${activationResult.error}`);
      }

      return {
        success: true,
        event: activationResult.event,
        registrationLink: activationResult.registrationLink,
      };
    }

    // Handle deactivation
    if (oldStatus === EventStatus.ACTIVE && updateStatusDto.status as string !== EventStatus.ACTIVE) {
      const deactivatedEvent = await this.activationService.deactivateEvent(
        eventId,
        adminUserId,
        updateStatusDto.notes,
      );

      return { success: true, event: deactivatedEvent };
    }

    // Handle other status changes
    event.status = updateStatusDto.status;
    
    if (updateStatusDto.notes) {
      event.event_details = {
        ...event.event_details,
        adminNotes: updateStatusDto.notes
      };
    }

    await this.eventRepository.save(event);

    // Log the status change with detailed metadata
    await this.userActivityRepository.save({
      user_id: adminUserId,
      activity_type: ActivityType.EVENT_UPDATED,
      description: `Admin changed event status from ${oldStatus} to ${updateStatusDto.status}${updateStatusDto.notes ? ' with notes: ' + updateStatusDto.notes : ''}`,
      metadata: {
        event_id: eventId,
        event_name: event.name,
        old_status: oldStatus,
        new_status: updateStatusDto.status,
        admin_notes: updateStatusDto.notes,
        timestamp: new Date().toISOString(),
        action_type: 'status_change',
      },
      is_successful: true,
    });

    return { success: true, event };
  }

  async updateEventNotes(eventId: string, notes: string, adminUserId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const oldNotes = event.event_details?.adminNotes;
    event.event_details = {
      ...event.event_details,
      adminNotes: notes
    };

    await this.eventRepository.save(event);

    // Log the notes update with enhanced details
    await this.userActivityRepository.save({
      user_id: adminUserId,
      activity_type: ActivityType.EVENT_UPDATED,
      description: `Admin updated event notes${oldNotes ? ' (replacing previous notes)' : ' (first time)'}`,
      metadata: {
        event_id: eventId,
        event_name: event.name,
        action_type: 'notes_update',
        old_notes_length: oldNotes?.length || 0,
        new_notes_length: notes.length,
        timestamp: new Date().toISOString(),
      },
      is_successful: true,
    });

    return { success: true, event };
  }

  async bulkUpdateEvents(eventIds: string[], action: string, adminUserId: string) {
    const events = await this.eventRepository.find({
      where: { id: In(eventIds) },
    });

    if (events.length === 0) {
      throw new NotFoundException('No events found');
    }

    let newStatus: EventStatus;
    switch (action) {
      case 'activate':
        newStatus = EventStatus.ACTIVE;
        break;
      case 'reject':
        newStatus = EventStatus.CANCELLED;
        break;
      default:
        throw new Error('Invalid action');
    }

    // Update all events
    await this.eventRepository.update(
      { id: In(eventIds) },
      { status: newStatus }
    );

    // Log bulk action
    await this.userActivityRepository.save({
      user_id: adminUserId,
      activity_type: ActivityType.PROFILE_UPDATE,
      description: `${action} applied to ${eventIds.length} events`,
    });

    return { success: true, updatedCount: events.length };
  }

  async getOrganizers(filters: {
    search?: string;
    page: number;
    limit: number;
  }) {
    const { search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.ORGANIZER });

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [organizers, total] = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      organizers: organizers.map(organizer => ({
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
        phone: organizer.phone,
        createdAt: organizer.created_at,
        lastLoginAt: organizer.last_login_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLog(filters: {
    entityType?: string;
    entityId?: string;
    page: number;
    limit: number;
  }) {
    const { entityType, entityId, page, limit } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user');

    if (entityType) {
      queryBuilder.andWhere('activity.entityType = :entityType', { entityType });
    }

    if (entityId) {
      queryBuilder.andWhere('activity.entityId = :entityId', { entityId });
    }

    const [activities, total] = await queryBuilder
      .orderBy('activity.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      activities: activities.map(activity => ({
        id: activity.id,
        action: activity.activity_type,
        details: activity.description,
        entityType: 'User Activity',
        entityId: activity.user_id,
        timestamp: activity.created_at,
        adminUser: activity.user?.email || 'System',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
} 