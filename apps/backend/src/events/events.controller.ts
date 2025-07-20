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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';

import { CreateEventDto } from './dtos/create-event.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { CreateTierDto } from './dtos/create-tier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Event, EventStatus, PlatformPaymentStatus } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  @Post()
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully', type: Event })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @Body(ValidationPipe) createEventDto: CreateEventDto,
    @Request() req
  ) {
    return this.eventsService.create(createEventDto, req.user.id);
  }

  @Get()
  @Roles(
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @ApiOperation({ summary: 'Get all events for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req) {
    return this.eventsService.findAll(req.user.id);
  }

  @Get(':id')
  @Roles(
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @ApiOperation({ summary: 'Get a specific event by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateEventDto: UpdateEventDto,
    @Request() req
  ) {
    return this.eventsService.update(id, updateEventDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete active events' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.eventsService.remove(id, req.user.id);
    return { message: 'Event deleted successfully' };
  }

  @Post(':id/publish')
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish an event (requires paid platform fee)' })
  @ApiResponse({ status: 200, description: 'Event published successfully' })
  @ApiResponse({ status: 400, description: 'Platform fee not paid or invalid status' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async publish(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.eventsService.publish(id, req.user.id);
  }

  @Patch(':id/payment-status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update platform payment status (admin only)' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: PlatformPaymentStatus; payment_reference?: string }
  ) {
    return this.eventsService.updatePlatformPaymentStatus(
      id,
      body.status,
      body.payment_reference
    );
  }



  @Post(':id/tiers')
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new tier for an event' })
  @ApiResponse({ status: 201, description: 'Tier created successfully', type: Tier })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async createTier(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body(ValidationPipe) createTierDto: CreateTierDto,
    @Request() req
  ) {
    return this.eventsService.createTier(eventId, createTierDto, req.user.id);
  }

  @Get(':id/tiers')
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all tiers for an event' })
  @ApiResponse({ status: 200, description: 'Tiers retrieved successfully', type: [Tier] })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getTiers(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.getTiers(id);
  }

  @Patch('tiers/:tierId')
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a tier' })
  @ApiResponse({ status: 200, description: 'Tier updated successfully', type: Tier })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Tier not found' })
  async updateTier(
    @Param('tierId', ParseUUIDPipe) tierId: string,
    @Body(ValidationPipe) updateTierDto: Partial<CreateTierDto>,
    @Request() req
  ) {
    return this.eventsService.updateTier(tierId, updateTierDto, req.user.id);
  }

  @Delete('tiers/:tierId')
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a tier' })
  @ApiResponse({ status: 200, description: 'Tier deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete tier with registered guests' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Tier not found' })
  async removeTier(@Param('tierId', ParseUUIDPipe) tierId: string, @Request() req) {
    await this.eventsService.removeTier(tierId, req.user.id);
    return { message: 'Tier deleted successfully' };
  }


} 