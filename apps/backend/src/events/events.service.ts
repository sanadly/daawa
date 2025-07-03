import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Event, EventStatus } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import { User } from '../database/entities/user.entity';
import { CreateEventDto } from './dtos/create-event.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { CreateTierDto } from './dtos/create-tier.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createEvent(organizerId: string, createEventDto: CreateEventDto): Promise<Event> {
    // Verify organizer exists
    const organizer = await this.userRepository.findOne({
      where: { id: organizerId }
    });
    
    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    // Validate dates
    const startDate = new Date(createEventDto.start_datetime);
    const endDate = new Date(createEventDto.end_datetime);
    
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate <= new Date()) {
      throw new BadRequestException('Start date must be in the future');
    }

    // Validate check-in dates if provided
    if (createEventDto.check_in_starts_at && createEventDto.check_in_ends_at) {
      const checkInStart = new Date(createEventDto.check_in_starts_at);
      const checkInEnd = new Date(createEventDto.check_in_ends_at);
      
      if (checkInStart >= checkInEnd) {
        throw new BadRequestException('Check-in end time must be after check-in start time');
      }
    }

    const event = this.eventRepository.create({
      ...createEventDto,
      organizer_id: organizerId,
      status: EventStatus.DRAFT,
      start_datetime: startDate,
      end_datetime: endDate,
      check_in_starts_at: createEventDto.check_in_starts_at ? new Date(createEventDto.check_in_starts_at) : null,
      check_in_ends_at: createEventDto.check_in_ends_at ? new Date(createEventDto.check_in_ends_at) : null,
      timezone: createEventDto.timezone || 'UTC',
      primary_language: createEventDto.primary_language || 'en',
      default_plus_n: createEventDto.default_plus_n || 0,
      check_in_enabled: createEventDto.check_in_enabled ?? true,
    });

    return await this.eventRepository.save(event);
  }

  async findAll(organizerId?: string, status?: EventStatus): Promise<Event[]> {
    const where: FindOptionsWhere<Event> = {};
    
    if (organizerId) {
      where.organizer_id = organizerId;
    }
    
    if (status) {
      where.status = status;
    }

    return await this.eventRepository.find({
      where,
      relations: ['organizer', 'default_tier', 'tiers'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, organizerId?: string): Promise<Event> {
    const where: FindOptionsWhere<Event> = { id };
    
    if (organizerId) {
      where.organizer_id = organizerId;
    }

    const event = await this.eventRepository.findOne({
      where,
      relations: ['organizer', 'default_tier', 'tiers'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async updateEvent(id: string, organizerId: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id, organizerId);

    // Validate date changes if provided
    if (updateEventDto.start_datetime || updateEventDto.end_datetime) {
      const startDate = updateEventDto.start_datetime ? new Date(updateEventDto.start_datetime) : event.start_datetime;
      const endDate = updateEventDto.end_datetime ? new Date(updateEventDto.end_datetime) : event.end_datetime;
      
      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate status transitions
    if (updateEventDto.status && updateEventDto.status !== event.status) {
      this.validateStatusTransition(event.status, updateEventDto.status);
    }

    // Prepare update data
    const updateData: Partial<Event> = {};
    
    // Copy simple fields
    if (updateEventDto.name !== undefined) updateData.name = updateEventDto.name;
    if (updateEventDto.description !== undefined) updateData.description = updateEventDto.description;
    if (updateEventDto.venue_name !== undefined) updateData.venue_name = updateEventDto.venue_name;
    if (updateEventDto.venue_address !== undefined) updateData.venue_address = updateEventDto.venue_address;
    if (updateEventDto.timezone !== undefined) updateData.timezone = updateEventDto.timezone;
    if (updateEventDto.primary_language !== undefined) updateData.primary_language = updateEventDto.primary_language;
    if (updateEventDto.default_plus_n !== undefined) updateData.default_plus_n = updateEventDto.default_plus_n;
    if (updateEventDto.capacity_limit !== undefined) updateData.capacity_limit = updateEventDto.capacity_limit;
    if (updateEventDto.design_config !== undefined) updateData.design_config = updateEventDto.design_config;
    if (updateEventDto.form_config !== undefined) updateData.form_config = updateEventDto.form_config;
    if (updateEventDto.event_details !== undefined) updateData.event_details = updateEventDto.event_details;
    if (updateEventDto.check_in_enabled !== undefined) updateData.check_in_enabled = updateEventDto.check_in_enabled;
    if (updateEventDto.status !== undefined) updateData.status = updateEventDto.status;
    
    // Handle date conversions
    if (updateEventDto.start_datetime) {
      updateData.start_datetime = new Date(updateEventDto.start_datetime);
    }
    
    if (updateEventDto.end_datetime) {
      updateData.end_datetime = new Date(updateEventDto.end_datetime);
    }
    
    if (updateEventDto.check_in_starts_at) {
      updateData.check_in_starts_at = new Date(updateEventDto.check_in_starts_at);
    }
    
    if (updateEventDto.check_in_ends_at) {
      updateData.check_in_ends_at = new Date(updateEventDto.check_in_ends_at);
    }

    await this.eventRepository.update(id, updateData);
    return await this.findOne(id, organizerId);
  }

  async submitForActivation(id: string, organizerId: string): Promise<Event> {
    const event = await this.findOne(id, organizerId);
    
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be submitted for activation');
    }

    // Validate event has required data for activation
    if (!event.tier_id && (!event.tiers || event.tiers.length === 0)) {
      throw new BadRequestException('Event must have at least one tier before activation');
    }

    await this.eventRepository.update(id, { status: EventStatus.PUBLISHED });
    return await this.findOne(id, organizerId);
  }

  async addTierToEvent(eventId: string, organizerId: string, createTierDto: CreateTierDto): Promise<Tier> {
    const event = await this.findOne(eventId, organizerId);
    
    // Check if tier name already exists for this event
    const existingTier = await this.tierRepository.findOne({
      where: { event_id: eventId, name: createTierDto.name }
    });
    
    if (existingTier) {
      throw new BadRequestException('Tier name already exists for this event');
    }

    const tier = this.tierRepository.create({
      ...createTierDto,
      event_id: eventId,
      price: createTierDto.price || 0,
      currency: createTierDto.currency || 'USD',
      max_plus_n: createTierDto.max_plus_n || 0,
      is_active: createTierDto.is_active ?? true,
      sort_order: createTierDto.sort_order || 0,
    });

    return await this.tierRepository.save(tier);
  }

  async updateEventTier(eventId: string, tierId: string, organizerId: string, updateData: Partial<CreateTierDto>): Promise<Tier> {
    // Verify event ownership
    await this.findOne(eventId, organizerId);
    
    const tier = await this.tierRepository.findOne({
      where: { id: tierId, event_id: eventId }
    });
    
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    await this.tierRepository.update(tierId, updateData);
    return await this.tierRepository.findOne({ where: { id: tierId } });
  }

  async setDefaultTier(eventId: string, tierId: string, organizerId: string): Promise<Event> {
    const event = await this.findOne(eventId, organizerId);
    
    const tier = await this.tierRepository.findOne({
      where: { id: tierId, event_id: eventId }
    });
    
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    await this.eventRepository.update(eventId, { tier_id: tierId });
    return await this.findOne(eventId, organizerId);
  }

  async deleteEvent(id: string, organizerId: string): Promise<void> {
    const event = await this.findOne(id, organizerId);
    
    if (event.status === EventStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete active events');
    }

    await this.eventRepository.delete(id);
  }

  private validateStatusTransition(currentStatus: EventStatus, newStatus: EventStatus): void {
    const allowedTransitions: Record<EventStatus, EventStatus[]> = {
      [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
      [EventStatus.PUBLISHED]: [EventStatus.ACTIVE, EventStatus.CANCELLED],
      [EventStatus.ACTIVE]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
      [EventStatus.COMPLETED]: [],
      [EventStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }
} 