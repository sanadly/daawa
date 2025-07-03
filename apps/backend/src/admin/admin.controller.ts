import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ActivationService } from '../events/activation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { UserRole } from '../database/entities/user.entity';
import { UpdateEventStatusDto } from './dtos/update-event-status.dto';
import { UpdateEventNotesDto } from './dtos/update-event-notes.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly activationService: ActivationService,
  ) {}

  @Get('dashboard/metrics')
  async getDashboardMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('events')
  async getEvents(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getEvents({
      status,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('events/:id')
  async getEventDetail(@Param('id') eventId: string) {
    return this.adminService.getEventDetail(eventId);
  }

  @Patch('events/:id/status')
  async updateEventStatus(
    @Param('id') eventId: string,
    @Body() updateStatusDto: UpdateEventStatusDto,
    @GetUser() adminUser: any,
  ) {
    return this.adminService.updateEventStatus(
      eventId,
      updateStatusDto,
      adminUser.id,
    );
  }

  @Patch('events/:id/notes')
  async updateEventNotes(
    @Param('id') eventId: string,
    @Body() updateNotesDto: UpdateEventNotesDto,
    @GetUser() adminUser: any,
  ) {
    return this.adminService.updateEventNotes(
      eventId,
      updateNotesDto.notes,
      adminUser.id,
    );
  }

  @Post('events/bulk-action')
  async bulkUpdateEvents(
    @Body() bulkActionDto: { eventIds: string[]; action: string },
    @GetUser() adminUser: any,
  ) {
    return this.adminService.bulkUpdateEvents(
      bulkActionDto.eventIds,
      bulkActionDto.action,
      adminUser.id,
    );
  }

  @Get('organizers')
  async getOrganizers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getOrganizers({
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('audit-log')
  async getAuditLog(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLog({
      entityType,
      entityId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  // Activation-specific endpoints
  @Post('events/:id/activate')
  async activateEvent(
    @Param('id') eventId: string,
    @Body() activationDto: { notes?: string },
    @GetUser() adminUser: any,
  ) {
    try {
      this.logger.log(`Admin ${adminUser.email} attempting to activate event ${eventId}`);
      
      if (!eventId || eventId.trim() === '') {
        throw new BadRequestException('Event ID is required');
      }

      const result = await this.activationService.activateEvent(
        eventId,
        adminUser.id,
        activationDto.notes,
      );

      if (!result.success) {
        this.logger.error(`Event activation failed for ${eventId}: ${result.error}`);
        throw new BadRequestException(result.error || 'Event activation failed');
      }

      this.logger.log(`Event ${eventId} successfully activated by admin ${adminUser.email}`);
      
      return {
        success: true,
        event: result.event,
        registrationLink: result.registrationLink,
        message: 'Event activated successfully',
      };
    } catch (error) {
      this.logger.error(`Error activating event ${eventId}:`, error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        `Failed to activate event: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  @Post('events/:id/deactivate')
  async deactivateEvent(
    @Param('id') eventId: string,
    @Body() deactivationDto: { reason?: string },
    @GetUser() adminUser: any,
  ) {
    const event = await this.activationService.deactivateEvent(
      eventId,
      adminUser.id,
      deactivationDto.reason,
    );

    return {
      success: true,
      event,
      message: 'Event deactivated successfully',
    };
  }

  @Get('events/:id/activation-status')
  async getActivationStatus(@Param('id') eventId: string) {
    return this.activationService.getActivationStatus(eventId);
  }
} 