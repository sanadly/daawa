import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Event, EventStatus } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import { Guest } from '../database/entities/guest.entity';
import { UserActivity, ActivityType } from '../database/entities/user-activity.entity';
import { NotificationService } from '../notifications/notification.service';
import { PostActivationHooksService } from './post-activation-hooks.service';
import { v4 as uuidv4 } from 'uuid';

export interface ActivationResult {
  success: boolean;
  event: Event;
  registrationLink?: string;
  error?: string;
  rollbackRequired?: boolean;
}

export interface ActivationNotification {
  eventId: string;
  organizerId: string;
  eventName: string;
  registrationLink: string;
  activatedBy: string;
  activatedAt: Date;
}

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly hooksService: PostActivationHooksService,
  ) {}

  /**
   * Main activation method that orchestrates the complete activation process
   */
  async activateEvent(eventId: string, activatedBy: string, adminNotes?: string): Promise<ActivationResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Starting activation process for event ${eventId} by user ${activatedBy}`);

      // Step 1: Validate event and change status
      const event = await this.validateAndChangeStatus(queryRunner, eventId);
      
      // Step 2: Enforce capacity constraints
      await this.enforceCapacityConstraints(queryRunner, event);
      
      // Step 3: Generate registration link
      const registrationLink = await this.generateRegistrationLink(queryRunner, event);
      
      // Step 4: Log activation process
      await this.logActivationProcess(queryRunner, event, activatedBy, adminNotes);
      
      // Step 5: Commit transaction
      await queryRunner.commitTransaction();
      
      this.logger.log(`Event ${eventId} activated successfully`);
      
      // Step 6: Send notifications (after successful commit)
      try {
        await this.notificationService.sendEventActivationNotifications(event, registrationLink);
      } catch (notificationError) {
        this.logger.error(`Failed to send notifications for event ${eventId}:`, notificationError);
        // Don't fail the activation for notification errors
      }

      // Step 7: Execute post-activation hooks
      try {
        await this.hooksService.executePostActivationHooks(event, registrationLink);
      } catch (hookError) {
        this.logger.error(`Post-activation hooks failed for event ${eventId}:`, hookError);
        // Don't fail the activation for hook errors
      }

      return {
        success: true,
        event: await this.eventRepository.findOne({
          where: { id: eventId },
          relations: ['organizer', 'default_tier', 'tiers'],
        }),
        registrationLink,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Activation failed for event ${eventId}:`, error);
      
      return {
        success: false,
        event: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        rollbackRequired: true,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Step 1: Validate event state and change status to ACTIVE
   */
  private async validateAndChangeStatus(queryRunner: QueryRunner, eventId: string): Promise<Event> {
    const event = await queryRunner.manager.findOne(Event, {
      where: { id: eventId },
      relations: ['organizer', 'default_tier', 'tiers'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate current status
    if (event.status === EventStatus.ACTIVE) {
      throw new BadRequestException('Event is already active');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cannot activate a cancelled event');
    }

    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException('Cannot activate a completed event');
    }

    // Validate event has required data
    if (!event.tiers || event.tiers.length === 0) {
      throw new BadRequestException('Event must have at least one tier before activation');
    }

    if (!event.venue_name) {
      throw new BadRequestException('Event must have a venue before activation');
    }

    if (!event.start_datetime || !event.end_datetime) {
      throw new BadRequestException('Event must have start and end dates before activation');
    }

    // Validate event is in the future
    if (event.start_datetime <= new Date()) {
      throw new BadRequestException('Cannot activate events that have already started');
    }

    // Update status to ACTIVE
    await queryRunner.manager.update(Event, eventId, {
      status: EventStatus.ACTIVE,
      updated_at: new Date(),
    });

    return { ...event, status: EventStatus.ACTIVE };
  }

  /**
   * Step 2: Enforce capacity constraints
   */
  private async enforceCapacityConstraints(queryRunner: QueryRunner, event: Event): Promise<void> {
    // Get current guest count (including +N guests)
    const currentGuestCount = await queryRunner.manager.count(Guest, {
      where: { event_id: event.id },
    });

    // Calculate total capacity from all tiers
    const totalCapacity = event.tiers.reduce((sum, tier) => {
      return sum + (tier.guest_limit || 0);
    }, 0);

    // Use event capacity limit if set, otherwise use sum of tier capacities
    const maxCapacity = event.capacity_limit || totalCapacity;

    if (maxCapacity === 0) {
      throw new BadRequestException('Event capacity limit must be greater than zero');
    }

    if (currentGuestCount > maxCapacity) {
      throw new BadRequestException(
        `Cannot activate event: current guest count (${currentGuestCount}) exceeds capacity (${maxCapacity})`
      );
    }

    this.logger.log(`Capacity check passed: ${currentGuestCount}/${maxCapacity} guests`);
  }

  /**
   * Step 3: Generate unique registration link
   */
  private async generateRegistrationLink(queryRunner: QueryRunner, event: Event): Promise<string> {
    // Generate a unique registration token
    const registrationToken = uuidv4();
    
    // Store the registration link in event_details
    const updatedEventDetails = {
      ...event.event_details,
      registration_token: registrationToken,
      activation_date: new Date().toISOString(),
    };

    await queryRunner.manager.update(Event, event.id, {
      event_details: updatedEventDetails,
    });

    // Generate the full registration URL (this would typically use your domain)
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const registrationLink = `${baseUrl}/register/${event.id}?token=${registrationToken}`;

    this.logger.log(`Generated registration link for event ${event.id}: ${registrationLink}`);
    return registrationLink;
  }

  /**
   * Step 4: Log activation process for auditing
   */
  private async logActivationProcess(
    queryRunner: QueryRunner,
    event: Event,
    activatedBy: string,
    adminNotes?: string
  ): Promise<void> {
    const activityData = {
      event_id: event.id,
      event_name: event.name,
      organizer_id: event.organizer_id,
      activation_timestamp: new Date().toISOString(),
      admin_notes: adminNotes,
      capacity_at_activation: await queryRunner.manager.count(Guest, {
        where: { event_id: event.id },
      }),
    };

    await queryRunner.manager.save(UserActivity, {
      user_id: activatedBy,
      activity_type: ActivityType.EVENT_ACTIVATED,
      description: `Event "${event.name}" activated`,
      metadata: activityData,
      is_successful: true,
      created_at: new Date(),
    });

    this.logger.log(`Logged activation for event ${event.id} by user ${activatedBy}`);
  }





  /**
   * Get activation status and registration link for an event
   */
  async getActivationStatus(eventId: string): Promise<{
    isActive: boolean;
    registrationLink?: string;
    activationDate?: Date;
  }> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isActive = event.status === EventStatus.ACTIVE;
    let registrationLink: string | undefined;
    let activationDate: Date | undefined;

    if (isActive && event.event_details?.registration_token) {
      const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
      registrationLink = `${baseUrl}/register/${event.id}?token=${event.event_details.registration_token}`;
      
      if (event.event_details.activation_date) {
        activationDate = new Date(event.event_details.activation_date);
      }
    }

    return {
      isActive,
      registrationLink,
      activationDate,
    };
  }

  /**
   * Deactivate an event (change status back to PUBLISHED)
   */
  async deactivateEvent(eventId: string, deactivatedBy: string, reason?: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== EventStatus.ACTIVE) {
      throw new BadRequestException('Only active events can be deactivated');
    }

    // Update status
    await this.eventRepository.update(eventId, {
      status: EventStatus.PUBLISHED,
      updated_at: new Date(),
    });

    // Log deactivation
    await this.activityRepository.save({
      user_id: deactivatedBy,
      activity_type: ActivityType.EVENT_DEACTIVATED,
      description: `Event "${event.name}" deactivated`,
      metadata: {
        event_id: eventId,
        event_name: event.name,
        organizer_id: event.organizer_id,
        deactivation_reason: reason,
        deactivation_timestamp: new Date().toISOString(),
      },
      is_successful: true,
      created_at: new Date(),
    });

    this.logger.log(`Event ${eventId} deactivated by user ${deactivatedBy}`);

    return await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'default_tier', 'tiers'],
    });
  }
} 