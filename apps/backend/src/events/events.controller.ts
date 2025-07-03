import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { ActivationService, ActivationResult } from './activation.service';
import { CreateEventDto } from './dtos/create-event.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { CreateTierDto } from './dtos/create-tier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Event, EventStatus } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly activationService: ActivationService,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully', type: Event })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createEvent(
    @GetUser('id') userId: string,
    @Body(ValidationPipe) createEventDto: CreateEventDto,
  ): Promise<Event> {
    return await this.eventsService.createEvent(userId, createEventDto);
  }

  @Get()
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully', type: [Event] })
  @ApiQuery({ name: 'status', required: false, enum: EventStatus })
  @ApiQuery({ name: 'organizer_id', required: false, type: String })
  async findAll(
    @GetUser() user: any,
    @Query('status') status?: EventStatus,
    @Query('organizer_id') organizerId?: string,
  ): Promise<Event[]> {
    // If user is not admin, only show their own events
    const filterOrganizerId = user.role === UserRole.ADMIN ? organizerId : user.id;
    return await this.eventsService.findAll(filterOrganizerId, status);
  }

  @Get(':id')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: any,
  ): Promise<Event> {
    // If user is not admin, only show their own events
    const organizerId = user.role === UserRole.ADMIN ? undefined : user.id;
    return await this.eventsService.findOne(id, organizerId);
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully', type: Event })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @Body(ValidationPipe) updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    return await this.eventsService.updateEvent(id, userId, updateEventDto);
  }

  @Post(':id/submit-for-activation')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit event for activation (changes status to Published)' })
  @ApiResponse({ status: 200, description: 'Event submitted for activation successfully', type: Event })
  @ApiResponse({ status: 400, description: 'Bad request - event cannot be activated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async submitForActivation(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<Event> {
    return await this.eventsService.submitForActivation(id, userId);
  }

  @Post(':id/tiers')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add tier to event' })
  @ApiResponse({ status: 201, description: 'Tier added successfully', type: Tier })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async addTier(
    @Param('id', ParseUUIDPipe) eventId: string,
    @GetUser('id') userId: string,
    @Body(ValidationPipe) createTierDto: CreateTierDto,
  ): Promise<Tier> {
    return await this.eventsService.addTierToEvent(eventId, userId, createTierDto);
  }

  @Patch(':id/tiers/:tierId')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update event tier' })
  @ApiResponse({ status: 200, description: 'Tier updated successfully', type: Tier })
  @ApiResponse({ status: 404, description: 'Event or tier not found' })
  async updateTier(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('tierId', ParseUUIDPipe) tierId: string,
    @GetUser('id') userId: string,
    @Body(ValidationPipe) updateTierDto: Partial<CreateTierDto>,
  ): Promise<Tier> {
    return await this.eventsService.updateEventTier(eventId, tierId, userId, updateTierDto);
  }

  @Post(':id/tiers/:tierId/set-default')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set tier as default for event' })
  @ApiResponse({ status: 200, description: 'Default tier set successfully', type: Event })
  @ApiResponse({ status: 404, description: 'Event or tier not found' })
  async setDefaultTier(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('tierId', ParseUUIDPipe) tierId: string,
    @GetUser('id') userId: string,
  ): Promise<Event> {
    return await this.eventsService.setDefaultTier(eventId, tierId, userId);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate an event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event activated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - event cannot be activated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async activateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @Body() body: { adminNotes?: string } = {},
  ): Promise<ActivationResult> {
    return await this.activationService.activateEvent(id, userId, body.adminNotes);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event deactivated successfully', type: Event })
  @ApiResponse({ status: 400, description: 'Bad request - event cannot be deactivated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async deactivateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @Body() body: { reason?: string } = {},
  ): Promise<Event> {
    return await this.activationService.deactivateEvent(id, userId, body.reason);
  }

  @Get(':id/activation-status')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get event activation status and registration link' })
  @ApiResponse({ status: 200, description: 'Activation status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getActivationStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    isActive: boolean;
    registrationLink?: string;
    activationDate?: Date;
  }> {
    return await this.activationService.getActivationStatus(id);
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 204, description: 'Event deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot delete active event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return await this.eventsService.deleteEvent(id, userId);
  }
} 