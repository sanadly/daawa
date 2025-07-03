import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, FindOptionsWhere, Like } from 'typeorm';
import { Guest } from '../database/entities/guest.entity';
import { Event } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import {
  CreateGuestDto,
  UpdateGuestDto,
  GuestQueryDto,
  GuestResponseDto,
  PaginatedGuestResponseDto,
} from './dtos';

@Injectable()
export class GuestsService {
  private readonly logger = new Logger(GuestsService.name);

  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
  ) {}

  async createGuest(createGuestDto: CreateGuestDto): Promise<GuestResponseDto> {
    this.logger.log(`Creating guest for event ${createGuestDto.event_id}`);

    // Validate event exists
    const event = await this.eventRepository.findOne({
      where: { id: createGuestDto.event_id },
      relations: ['tiers'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${createGuestDto.event_id} not found`);
    }

    // Validate tier exists and belongs to event
    const tier = await this.tierRepository.findOne({
      where: { id: createGuestDto.tier_id, event_id: createGuestDto.event_id },
    });

    if (!tier) {
      throw new NotFoundException(
        `Tier with ID ${createGuestDto.tier_id} not found for event ${createGuestDto.event_id}`
      );
    }

    // If this is a +N guest, validate primary guest exists
    if (createGuestDto.primary_guest_id) {
      const primaryGuest = await this.guestRepository.findOne({
        where: {
          id: createGuestDto.primary_guest_id,
          event_id: createGuestDto.event_id,
          is_primary: true,
        },
      });

      if (!primaryGuest) {
        throw new NotFoundException(
          `Primary guest with ID ${createGuestDto.primary_guest_id} not found`
        );
      }
    }

    // Check for duplicate email if provided
    if (createGuestDto.email) {
      const existingGuest = await this.guestRepository.findOne({
        where: {
          email: createGuestDto.email,
          event_id: createGuestDto.event_id,
        },
      });

      if (existingGuest) {
        throw new ConflictException(
          `Guest with email ${createGuestDto.email} already exists for this event`
        );
      }
    }

    // Check capacity constraints
    await this.validateCapacity(createGuestDto.event_id, createGuestDto.tier_id, 1);

    // Create the guest
    const guest = this.guestRepository.create({
      ...createGuestDto,
      is_primary: !createGuestDto.primary_guest_id, // If no primary_guest_id, this is primary
    });

    const savedGuest = await this.guestRepository.save(guest);

    this.logger.log(`Guest created successfully with ID ${savedGuest.id}`);

    return GuestResponseDto.fromEntity(savedGuest);
  }

  async findGuests(query: GuestQueryDto): Promise<PaginatedGuestResponseDto> {
    this.logger.log('Finding guests with query', JSON.stringify(query));

    const { page = 1, limit = 50, ...filters } = query;
    const offset = (page - 1) * limit;

    const queryBuilder = this.guestRepository.createQueryBuilder('guest')
      .leftJoinAndSelect('guest.additional_guests', 'additional_guests')
      .leftJoinAndSelect('guest.primary_guest', 'primary_guest')
      .leftJoinAndSelect('guest.tier', 'tier')
      .leftJoinAndSelect('guest.event', 'event');

    // Apply filters
    if (filters.event_id) {
      queryBuilder.andWhere('guest.event_id = :event_id', { event_id: filters.event_id });
    }

    if (filters.tier_id) {
      queryBuilder.andWhere('guest.tier_id = :tier_id', { tier_id: filters.tier_id });
    }

    if (filters.primary_guest_id) {
      queryBuilder.andWhere('guest.primary_guest_id = :primary_guest_id', {
        primary_guest_id: filters.primary_guest_id,
      });
    }

    if (filters.invite_status) {
      queryBuilder.andWhere('guest.invite_status = :invite_status', {
        invite_status: filters.invite_status,
      });
    }

    if (filters.rsvp_status) {
      queryBuilder.andWhere('guest.rsvp_status = :rsvp_status', {
        rsvp_status: filters.rsvp_status,
      });
    }

    if (filters.checkin_status) {
      queryBuilder.andWhere('guest.checkin_status = :checkin_status', {
        checkin_status: filters.checkin_status,
      });
    }

    if (filters.primary_only) {
      queryBuilder.andWhere('guest.is_primary = :is_primary', { is_primary: true });
    }

    if (filters.search) {
      queryBuilder.andWhere('guest.name ILIKE :search', { search: `%${filters.search}%` });
    }

    if (filters.email) {
      queryBuilder.andWhere('guest.email = :email', { email: filters.email });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const guests = await queryBuilder
      .orderBy('guest.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      guests: guests.map(guest => GuestResponseDto.fromEntity(guest)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findGuestById(id: string): Promise<GuestResponseDto> {
    this.logger.log(`Finding guest with ID ${id}`);

    const guest = await this.guestRepository.findOne({
      where: { id },
      relations: ['additional_guests', 'primary_guest', 'tier', 'event'],
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    return GuestResponseDto.fromEntity(guest);
  }

  async updateGuest(id: string, updateGuestDto: UpdateGuestDto): Promise<GuestResponseDto> {
    this.logger.log(`Updating guest with ID ${id}`);

    const guest = await this.guestRepository.findOne({
      where: { id },
      relations: ['event'],
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    // Check for duplicate email if being updated
    if (updateGuestDto.email && updateGuestDto.email !== guest.email) {
      const existingGuest = await this.guestRepository.findOne({
        where: {
          email: updateGuestDto.email,
          event_id: guest.event_id,
        },
      });

      if (existingGuest && existingGuest.id !== id) {
        throw new ConflictException(
          `Guest with email ${updateGuestDto.email} already exists for this event`
        );
      }
    }

    // Update the guest
    Object.assign(guest, updateGuestDto);
    const updatedGuest = await this.guestRepository.save(guest);

    this.logger.log(`Guest updated successfully with ID ${id}`);

    return GuestResponseDto.fromEntity(updatedGuest);
  }

  async deleteGuest(id: string): Promise<void> {
    this.logger.log(`Deleting guest with ID ${id}`);

    const guest = await this.guestRepository.findOne({
      where: { id },
      relations: ['additional_guests'],
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    // If this is a primary guest with additional guests, we need to handle them
    if (guest.is_primary && guest.additional_guests?.length > 0) {
      throw new BadRequestException(
        'Cannot delete primary guest with additional guests. Delete additional guests first.'
      );
    }

    await this.guestRepository.delete(id);

    this.logger.log(`Guest deleted successfully with ID ${id}`);
  }

  async addAdditionalGuest(
    primaryGuestId: string,
    createGuestDto: CreateGuestDto,
  ): Promise<GuestResponseDto> {
    this.logger.log(`Adding additional guest to primary guest ${primaryGuestId}`);

    // Find primary guest
    const primaryGuest = await this.guestRepository.findOne({
      where: { id: primaryGuestId, is_primary: true },
      relations: ['additional_guests', 'tier'],
    });

    if (!primaryGuest) {
      throw new NotFoundException(`Primary guest with ID ${primaryGuestId} not found`);
    }

    // Check +N capacity for primary guest
    const currentAdditionalCount = primaryGuest.additional_guests?.length || 0;
    const allowedPlusN = primaryGuest.allowed_plus_n_override ?? primaryGuest.tier?.guest_limit ?? 0;

    if (currentAdditionalCount >= allowedPlusN) {
      throw new BadRequestException(
        `Primary guest has reached maximum additional guests limit (${allowedPlusN})`
      );
    }

    // Create additional guest
    const additionalGuestDto: CreateGuestDto = {
      ...createGuestDto,
      event_id: primaryGuest.event_id,
      tier_id: primaryGuest.tier_id,
      primary_guest_id: primaryGuestId,
    };

    return this.createGuest(additionalGuestDto);
  }

  async getGuestStats(eventId: string): Promise<any> {
    this.logger.log(`Getting guest statistics for event ${eventId}`);

    const stats = await this.guestRepository
      .createQueryBuilder('guest')
      .select([
        'COUNT(*) as total_guests',
        'COUNT(CASE WHEN guest.is_primary = true THEN 1 END) as primary_guests',
        'COUNT(CASE WHEN guest.is_primary = false THEN 1 END) as additional_guests',
        'COUNT(CASE WHEN guest.rsvp_status = \'accepted\' THEN 1 END) as accepted_rsvps',
        'COUNT(CASE WHEN guest.checkin_status = \'checked_in\' THEN 1 END) as checked_in',
      ])
      .where('guest.event_id = :event_id', { event_id: eventId })
      .getRawOne();

    return {
      totalGuests: parseInt(stats.total_guests),
      primaryGuests: parseInt(stats.primary_guests),
      additionalGuests: parseInt(stats.additional_guests),
      acceptedRsvps: parseInt(stats.accepted_rsvps),
      checkedIn: parseInt(stats.checked_in),
    };
  }

  private async validateCapacity(
    eventId: string,
    tierId: string,
    guestCount: number = 1,
  ): Promise<void> {
    this.logger.log(`Validating capacity for event ${eventId}, tier ${tierId}`);

    // Get tier with capacity info
    const tier = await this.tierRepository.findOne({
      where: { id: tierId, event_id: eventId },
    });

    if (!tier) {
      throw new NotFoundException(`Tier with ID ${tierId} not found`);
    }

    // If tier has no guest limit, skip validation
    if (!tier.guest_limit) {
      return;
    }

    // Count current guests for this tier
    const currentGuestCount = await this.guestRepository.count({
      where: { tier_id: tierId, event_id: eventId },
    });

    if (currentGuestCount + guestCount > tier.guest_limit) {
      throw new BadRequestException(
        `Adding ${guestCount} guest(s) would exceed tier capacity (${currentGuestCount + guestCount}/${tier.guest_limit})`
      );
    }

    this.logger.log(`Capacity check passed: ${currentGuestCount + guestCount}/${tier.guest_limit}`);
  }
} 