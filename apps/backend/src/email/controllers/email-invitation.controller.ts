import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/user.decorator';
import { EmailInvitationService, SendInvitationDto, BatchInvitationResult } from '../services/email-invitation.service';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { User } from '../../database/entities/user.entity';

export class SendInvitationRequestDto {
  guestIds: string[];
  eventId: string;
  templateType?: 'invitation' | 'reminder' = 'invitation';
  locale?: string = 'en';
  customMessage?: string;
  includePass?: boolean = false;
  isUrgent?: boolean = false;
}

export class SendReminderRequestDto {
  eventId: string;
  daysBeforeEvent?: number;
  onlyUnconfirmed?: boolean = true;
  isUrgent?: boolean = false;
  locale?: string = 'en';
}

@ApiTags('Email Invitations')
@Controller('email-invitations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EmailInvitationController {
  private readonly logger = new Logger(EmailInvitationController.name);

  constructor(
    private readonly emailInvitationService: EmailInvitationService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send invitation emails to selected guests',
    description: 'Send personalized invitation emails to multiple guests for an event'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Invitations sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalSent: { type: 'number' },
            totalFailed: { type: 'number' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  guestId: { type: 'string' },
                  guestEmail: { type: 'string' },
                  error: { type: 'string' },
                  messageId: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async sendInvitations(
    @Body() sendData: SendInvitationRequestDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`User ${userId} sending invitations for event ${sendData.eventId}`);

    if (!sendData.guestIds || sendData.guestIds.length === 0) {
      throw new BadRequestException('At least one guest ID is required');
    }

    if (!sendData.eventId) {
      throw new BadRequestException('Event ID is required');
    }

    try {
      const result = await this.emailInvitationService.sendBatchInvitations(
        sendData as SendInvitationDto,
        userId
      );

      return {
        success: true,
        data: result,
        message: `Successfully sent ${result.totalSent} invitations, ${result.totalFailed} failed`
      };
    } catch (error) {
      this.logger.error('Failed to send invitations:', error);
      throw error;
    }
  }

  @Post('send-reminders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send reminder emails to guests',
    description: 'Send reminder emails to guests who haven\'t responded or confirmed attendance'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Reminders sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalSent: { type: 'number' },
            totalFailed: { type: 'number' },
            results: { type: 'array' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendReminders(
    @Body() reminderData: SendReminderRequestDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`User ${userId} sending reminders for event ${reminderData.eventId}`);

    if (!reminderData.eventId) {
      throw new BadRequestException('Event ID is required');
    }

    try {
      const result = await this.emailInvitationService.sendReminders(
        reminderData.eventId,
        userId,
        {
          daysBeforeEvent: reminderData.daysBeforeEvent,
          onlyUnconfirmed: reminderData.onlyUnconfirmed,
          isUrgent: reminderData.isUrgent,
          locale: reminderData.locale
        }
      );

      return {
        success: true,
        data: result,
        message: `Successfully sent ${result.totalSent} reminders, ${result.totalFailed} failed`
      };
    } catch (error) {
      this.logger.error('Failed to send reminders:', error);
      throw error;
    }
  }

  @Post('retry-failed/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Retry failed invitations',
    description: 'Retry sending invitations that previously failed'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Failed invitations retried successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid event ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async retryFailedInvitations(
    @Param('eventId') eventId: string,
    @GetUser('id') userId: string,
    @Query('maxRetries') maxRetries?: number,
  ) {
    this.logger.log(`User ${userId} retrying failed invitations for event ${eventId}`);

    if (!eventId) {
      throw new BadRequestException('Event ID is required');
    }

    try {
      const result = await this.emailInvitationService.retryFailedInvitations(
        eventId,
        userId,
        maxRetries || 3
      );

      return {
        success: true,
        data: result,
        message: `Successfully retried ${result.totalSent} invitations, ${result.totalFailed} still failed`
      };
    } catch (error) {
      this.logger.error('Failed to retry invitations:', error);
      throw error;
    }
  }

  @Get('stats/:eventId')
  @ApiOperation({ 
    summary: 'Get invitation statistics',
    description: 'Get detailed statistics about invitations sent for an event'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Invitation statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalGuests: { type: 'number' },
            invitationsSent: { type: 'number' },
            responsesReceived: { type: 'number' },
            confirmedAttendees: { type: 'number' },
            pendingResponses: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid event ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInvitationStats(
    @Param('eventId') eventId: string,
    @GetUser('id') userId: string,
  ) {
    if (!eventId) {
      throw new BadRequestException('Event ID is required');
    }

    try {
      const stats = await this.emailInvitationService.getInvitationStats(eventId, userId);

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      this.logger.error('Failed to get invitation stats:', error);
      throw error;
    }
  }

  @Get('test-template/:templateType')
  @ApiOperation({ 
    summary: 'Test email template rendering',
    description: 'Test how email templates will look with sample data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template rendered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            html: { type: 'string' },
            templateType: { type: 'string' },
            locale: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid template type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async testTemplate(
    @Param('templateType') templateType: 'invitation' | 'reminder',
    @Query('locale') locale: string = 'en',
  ) {
    if (!['invitation', 'reminder'].includes(templateType)) {
      throw new BadRequestException('Template type must be either "invitation" or "reminder"');
    }

    try {
      const html = await this.emailInvitationService.testEmailTemplate(templateType, locale);

      return {
        success: true,
        data: {
          html,
          templateType,
          locale
        }
      };
    } catch (error) {
      this.logger.error('Failed to test template:', error);
      throw error;
    }
  }
} 