import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EmailTemplateService, EmailTemplateData } from './email-template.service';
import { NotificationService } from '../../notifications/notification.service';
import { Guest, InviteStatus } from '../../database/entities/guest.entity';
import { Event } from '../../database/entities/event.entity';
import { Tier } from '../../database/entities/tier.entity';
import { User } from '../../database/entities/user.entity';

export interface SendInvitationDto {
  guestIds: string[];
  eventId: string;
  templateType?: 'invitation' | 'reminder';
  locale?: string;
  customMessage?: string;
  includePass?: boolean;
  isUrgent?: boolean;
  scheduledTime?: Date;
}

export interface InvitationResult {
  success: boolean;
  guestId: string;
  guestEmail: string;
  error?: string;
  messageId?: string;
}

export interface BatchInvitationResult {
  totalSent: number;
  totalFailed: number;
  results: InvitationResult[];
  errors: string[];
}

export interface EmailDeliveryStatus {
  id: string;
  guestId: string;
  eventId: string;
  emailType: 'invitation' | 'reminder';
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failureReason?: string;
  retryCount: number;
  lastRetryAt?: Date;
  messageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EmailInvitationService {
  private readonly logger = new Logger(EmailInvitationService.name);

  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Send invitation emails to multiple guests
   */
  async sendBatchInvitations(
    sendData: SendInvitationDto,
    organizerId: string
  ): Promise<BatchInvitationResult> {
    this.logger.log(`Starting batch invitation for event ${sendData.eventId} to ${sendData.guestIds.length} guests`);

    const results: InvitationResult[] = [];
    const errors: string[] = [];

    try {
      // Validate event and organizer
      const event = await this.eventRepository.findOne({
        where: { id: sendData.eventId, organizer_id: organizerId },
        relations: ['organizer']
      });

      if (!event) {
        throw new BadRequestException('Event not found or you do not have permission to send invitations');
      }

      // Get guests
      const guests = await this.guestRepository.find({
        where: { 
          id: In(sendData.guestIds),
          event_id: sendData.eventId 
        },
        relations: ['tier']
      });

      if (guests.length === 0) {
        throw new BadRequestException('No valid guests found for the specified IDs');
      }

      // Send invitations to each guest
      for (const guest of guests) {
        try {
          const result = await this.sendSingleInvitation(guest, event, sendData);
          results.push(result);
        } catch (error) {
          const errorMessage = `Failed to send invitation to ${guest.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          this.logger.error(errorMessage);
          errors.push(errorMessage);
          
          results.push({
            success: false,
            guestId: guest.id,
            guestEmail: guest.email || '',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const totalSent = results.filter(r => r.success).length;
      const totalFailed = results.filter(r => !r.success).length;

      this.logger.log(`Batch invitation completed: ${totalSent} sent, ${totalFailed} failed`);

      return {
        totalSent,
        totalFailed,
        results,
        errors
      };

    } catch (error) {
      this.logger.error('Batch invitation failed:', error);
      throw error;
    }
  }

  /**
   * Send invitation to a single guest
   */
  async sendSingleInvitation(
    guest: Guest,
    event: Event,
    sendData: SendInvitationDto
  ): Promise<InvitationResult> {
    try {
      // Prepare template data
      const templateData: EmailTemplateData = {
        guest,
        event,
        tier: guest.tier,
        locale: sendData.locale || 'en',
        registrationLink: this.generateRegistrationLink(event.id, guest.id),
        unsubscribeLink: this.generateUnsubscribeLink(guest.email),
        isUrgent: sendData.isUrgent || false,
        customData: {
          customMessage: sendData.customMessage,
          organizerName: event.organizer?.name || 'Event Organizer'
        }
      };

      // Add pass link if requested
      if (sendData.includePass) {
        templateData.passLink = this.generatePassLink(event.id, guest.id);
        templateData.qrCodeUrl = this.emailTemplateService.generateQRCodeUrl(guest, event);
      }

      // Render email based on template type
      const templateType = sendData.templateType || 'invitation';
      let renderedEmail;

      if (templateType === 'reminder') {
        renderedEmail = await this.emailTemplateService.renderReminderEmail(templateData);
      } else {
        renderedEmail = await this.emailTemplateService.renderInvitationEmail(templateData);
      }

      // Send email
      await this.notificationService.sendEmail({
        to: guest.email,
        subject: renderedEmail.subject,
        body: `Please view this email in HTML format`,
        html: renderedEmail.html
      });

      // Update guest invitation status
      await this.updateGuestInvitationStatus(guest.id, InviteStatus.SENT);

      this.logger.log(`Invitation sent successfully to ${guest.email}`);

      return {
        success: true,
        guestId: guest.id,
        guestEmail: guest.email,
        messageId: `msg_${Date.now()}_${guest.id}` // Placeholder message ID
      };

    } catch (error) {
      this.logger.error(`Failed to send invitation to ${guest.email}:`, error);
      
      // Update guest invitation status to failed
      await this.updateGuestInvitationStatus(guest.id, InviteStatus.FAILED);

      return {
        success: false,
        guestId: guest.id,
        guestEmail: guest.email || '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send reminder emails to guests who haven't responded
   */
  async sendReminders(
    eventId: string,
    organizerId: string,
    options: {
      daysBeforeEvent?: number;
      onlyUnconfirmed?: boolean;
      isUrgent?: boolean;
      locale?: string;
    } = {}
  ): Promise<BatchInvitationResult> {
    this.logger.log(`Sending reminders for event ${eventId}`);

    // Get event
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizer_id: organizerId },
      relations: ['organizer']
    });

    if (!event) {
      throw new BadRequestException('Event not found or access denied');
    }

    // Build query for guests who need reminders
    const queryBuilder = this.guestRepository.createQueryBuilder('guest')
      .leftJoinAndSelect('guest.tier', 'tier')
      .where('guest.event_id = :eventId', { eventId });

    if (options.onlyUnconfirmed) {
      queryBuilder.andWhere('guest.rsvp_status != :confirmed', { confirmed: 'confirmed' });
    }

    const guests = await queryBuilder.getMany();

    if (guests.length === 0) {
      return {
        totalSent: 0,
        totalFailed: 0,
        results: [],
        errors: ['No guests found for reminder criteria']
      };
    }

    // Send reminders
    const sendData: SendInvitationDto = {
      guestIds: guests.map(g => g.id),
      eventId,
      templateType: 'reminder',
      locale: options.locale,
      isUrgent: options.isUrgent || false
    };

    return this.sendBatchInvitations(sendData, organizerId);
  }

  /**
   * Get invitation statistics for an event
   */
  async getInvitationStats(eventId: string, organizerId: string): Promise<{
    totalGuests: number;
    invitationsSent: number;
    responsesReceived: number;
    confirmedAttendees: number;
    pendingResponses: number;
  }> {
    // Verify event access
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizer_id: organizerId }
    });

    if (!event) {
      throw new BadRequestException('Event not found or access denied');
    }

    const stats = await this.guestRepository
      .createQueryBuilder('guest')
      .select([
        'COUNT(*) as totalGuests',
        'SUM(CASE WHEN guest.invite_status = \'sent\' THEN 1 ELSE 0 END) as invitationsSent',
        'SUM(CASE WHEN guest.rsvp_status IS NOT NULL THEN 1 ELSE 0 END) as responsesReceived',
        'SUM(CASE WHEN guest.rsvp_status = \'confirmed\' THEN 1 ELSE 0 END) as confirmedAttendees',
        'SUM(CASE WHEN guest.invite_status = \'sent\' AND guest.rsvp_status IS NULL THEN 1 ELSE 0 END) as pendingResponses'
      ])
      .where('guest.event_id = :eventId', { eventId })
      .getRawOne();

    return {
      totalGuests: parseInt(stats.totalGuests) || 0,
      invitationsSent: parseInt(stats.invitationsSent) || 0,
      responsesReceived: parseInt(stats.responsesReceived) || 0,
      confirmedAttendees: parseInt(stats.confirmedAttendees) || 0,
      pendingResponses: parseInt(stats.pendingResponses) || 0
    };
  }

  /**
   * Retry failed invitations
   */
  async retryFailedInvitations(
    eventId: string,
    organizerId: string,
    maxRetries: number = 3
  ): Promise<BatchInvitationResult> {
    this.logger.log(`Retrying failed invitations for event ${eventId}`);

    // Get guests with failed invitation status
    const failedGuests = await this.guestRepository.find({
      where: { 
        event_id: eventId,
        invite_status: InviteStatus.FAILED
      },
      relations: ['tier']
    });

    if (failedGuests.length === 0) {
      return {
        totalSent: 0,
        totalFailed: 0,
        results: [],
        errors: ['No failed invitations to retry']
      };
    }

    // Filter guests based on retry count (if we had a retry tracking system)
    const guestsToRetry = failedGuests; // For now, retry all failed

    const sendData: SendInvitationDto = {
      guestIds: guestsToRetry.map(g => g.id),
      eventId,
      templateType: 'invitation'
    };

    return this.sendBatchInvitations(sendData, organizerId);
  }

  /**
   * Generate registration link for a guest
   */
  private generateRegistrationLink(eventId: string, guestId: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}/register/${eventId}?guest=${guestId}`;
  }

  /**
   * Generate pass link for a guest
   */
  private generatePassLink(eventId: string, guestId: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}/passes/${eventId}/${guestId}`;
  }

  /**
   * Generate unsubscribe link
   */
  private generateUnsubscribeLink(email: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
  }

  /**
   * Update guest invitation status
   */
  private async updateGuestInvitationStatus(
    guestId: string, 
    status: InviteStatus
  ): Promise<void> {
    try {
      await this.guestRepository.update(guestId, {
        invite_status: status,
        updated_at: new Date()
      });
    } catch (error) {
      this.logger.error(`Failed to update guest ${guestId} invitation status:`, error);
    }
  }

  /**
   * Test email template rendering
   */
  async testEmailTemplate(
    templateType: 'invitation' | 'reminder',
    locale: string = 'en'
  ): Promise<string> {
    return this.emailTemplateService.testTemplate(templateType, locale);
  }
} 