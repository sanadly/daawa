import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus, PlatformPaymentStatus } from '../database/entities/event.entity';
import { Tier, TierType } from '../database/entities/tier.entity';
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

  async create(createEventDto: CreateEventDto, organizerId: string): Promise<Event> {
    const organizer = await this.userRepository.findOne({
      where: { id: organizerId },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    // Calculate platform fee (you can implement your own logic here)
    const platformFee = this.calculatePlatformFee(createEventDto);

    const event = this.eventRepository.create({
      ...createEventDto,
      organizer_id: organizerId,
      platform_fee: platformFee,
      platform_payment_status: PlatformPaymentStatus.PENDING,
      status: EventStatus.DRAFT,
      start_datetime: new Date(createEventDto.start_datetime),
      end_datetime: new Date(createEventDto.end_datetime),
      check_in_starts_at: createEventDto.check_in_starts_at 
        ? new Date(createEventDto.check_in_starts_at) 
        : null,
      check_in_ends_at: createEventDto.check_in_ends_at 
        ? new Date(createEventDto.check_in_ends_at) 
        : null,
    });

    const savedEvent = await this.eventRepository.save(event);

    // Create a default free tier if none specified
    if (!createEventDto.metadata?.skip_default_tier) {
      await this.createDefaultTier(savedEvent.id);
    }

    return this.findOne(savedEvent.id);
  }

  async findAll(userId: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { organizer_id: userId },
      relations: ['tiers', 'guests'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['organizer', 'tiers', 'guests'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string): Promise<Event> {
    const event = await this.findOne(id);

    if (event.organizer_id !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }

    // Prevent certain updates based on status
    if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Cannot update completed or cancelled events');
    }

    // Handle datetime updates
    const updateData: any = { ...updateEventDto };
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
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const event = await this.findOne(id);

    if (event.organizer_id !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    if (event.status === EventStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete active events');
    }

    await this.eventRepository.remove(event);
  }

  async publish(id: string, userId: string): Promise<Event> {
    const event = await this.findOne(id);

    if (event.organizer_id !== userId) {
      throw new ForbiddenException('You can only publish your own events');
    }

    if (event.platform_payment_status !== PlatformPaymentStatus.PAID) {
      throw new BadRequestException('Platform fee must be paid before publishing');
    }

    if (event.status !== EventStatus.DRAFT && event.status !== EventStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Only draft or pending payment events can be published');
    }

    await this.eventRepository.update(id, {
      status: EventStatus.PUBLISHED,
    });

    return this.findOne(id);
  }

  async updatePlatformPaymentStatus(
    id: string, 
    status: PlatformPaymentStatus, 
    paymentReference?: string
  ): Promise<Event> {
    const event = await this.findOne(id);
    
    const updateData: any = {
      platform_payment_status: status,
    };

    if (paymentReference) {
      updateData.platform_payment_reference = paymentReference;
    }

    if (status === PlatformPaymentStatus.PAID) {
      updateData.platform_payment_date = new Date();
      // Automatically move to published if payment is successful
      if (event.status === EventStatus.PENDING_PAYMENT || event.status === EventStatus.DRAFT) {
        updateData.status = EventStatus.PUBLISHED;
      }
    }

    await this.eventRepository.update(id, updateData);
    return this.findOne(id);
  }

  // Tier management methods
  async createTier(eventId: string, createTierDto: CreateTierDto, userId: string): Promise<Tier> {
    const event = await this.findOne(eventId);

    if (event.organizer_id !== userId) {
      throw new ForbiddenException('You can only add tiers to your own events');
    }

    const tier = this.tierRepository.create({
      ...createTierDto,
      event_id: eventId,
      sale_starts_at: createTierDto.sale_starts_at 
        ? new Date(createTierDto.sale_starts_at) 
        : null,
      sale_ends_at: createTierDto.sale_ends_at 
        ? new Date(createTierDto.sale_ends_at) 
        : null,
    });

    return this.tierRepository.save(tier);
  }

  async updateTier(tierId: string, updateTierDto: Partial<CreateTierDto>, userId: string): Promise<Tier> {
    const tier = await this.tierRepository.findOne({
      where: { id: tierId },
      relations: ['event'],
    });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    if (tier.event.organizer_id !== userId) {
      throw new ForbiddenException('You can only update tiers of your own events');
    }

    const updateData: any = { ...updateTierDto };
    if (updateTierDto.sale_starts_at) {
      updateData.sale_starts_at = new Date(updateTierDto.sale_starts_at);
    }
    if (updateTierDto.sale_ends_at) {
      updateData.sale_ends_at = new Date(updateTierDto.sale_ends_at);
    }

    await this.tierRepository.update(tierId, updateData);
    return this.tierRepository.findOne({ where: { id: tierId } });
  }

  async removeTier(tierId: string, userId: string): Promise<void> {
    const tier = await this.tierRepository.findOne({
      where: { id: tierId },
      relations: ['event', 'guests'],
    });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    if (tier.event.organizer_id !== userId) {
      throw new ForbiddenException('You can only delete tiers of your own events');
    }

    if (tier.guests && tier.guests.length > 0) {
      throw new BadRequestException('Cannot delete tier with registered guests');
    }

    await this.tierRepository.remove(tier);
  }

  async getTiers(eventId: string): Promise<Tier[]> {
    return this.tierRepository.find({
      where: { event_id: eventId },
      order: { price: 'ASC' },
    });
  }

  async getDashboardStats(userId: string) {
    // Get user's events with guest counts
    const events = await this.eventRepository.find({
      where: { organizer_id: userId },
      relations: ['guests'],
    });

    // Calculate statistics
    const totalEvents = events.length;
    const activeEvents = events.filter(event => event.status === EventStatus.ACTIVE).length;
    const totalGuests = events.reduce((sum, event) => sum + (event.guests?.length || 0), 0);
    
    // Calculate checked-in guests
    const checkedIn = events.reduce((sum, event) => {
      const checkedInGuests = event.guests?.filter(guest => guest.checkin_status === 'checked_in') || [];
      return sum + checkedInGuests.length;
    }, 0);

    return {
      totalEvents,
      activeEvents,
      totalGuests,
      checkedIn,
    };
  }

  // Private helper methods
  private calculatePlatformFee(createEventDto: CreateEventDto): number {
    // Implement your platform fee calculation logic here
    // For example: base fee + percentage of estimated revenue
    const baseFee = 10.0; // 10 LYD base fee
    
    // You could factor in expected attendance, event duration, etc.
    const complexityMultiplier = this.getComplexityMultiplier(createEventDto);
    
    return baseFee * complexityMultiplier;
  }

  private getComplexityMultiplier(createEventDto: CreateEventDto): number {
    let multiplier = 1.0;
    
    // Add complexity based on features
    if (createEventDto.event_settings?.max_capacity && createEventDto.event_settings.max_capacity > 100) {
      multiplier += 0.5; // Large events
    }
    
    if (createEventDto.form_config?.custom_questions?.length > 0) {
      multiplier += 0.2; // Custom forms
    }
    
    if (createEventDto.design_config) {
      multiplier += 0.3; // Custom design
    }
    
    return Math.min(multiplier, 3.0); // Cap at 3x base fee
  }

  private async createDefaultTier(eventId: string): Promise<Tier> {
    const defaultTier = this.tierRepository.create({
      event_id: eventId,
      name: 'General Admission',
      description: 'Standard event access',
      tier_type: TierType.FREE,
      price: 0,
      currency: 'LYD',
      is_active: true,
      sort_order: 0,
    });

    return this.tierRepository.save(defaultTier);
  }
} 