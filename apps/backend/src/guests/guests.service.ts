import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, FindOptionsWhere, Like } from 'typeorm';
import { Guest, InviteStatus, RsvpStatus } from '../database/entities/guest.entity';
import { Event } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import {
  CreateGuestDto,
  UpdateGuestDto,
  GuestQueryDto,
  GuestResponseDto,
  PaginatedGuestResponseDto,
  SelfRegistrationDto,
  SelfRegistrationResponseDto,
} from './dtos';
import { NotificationService } from '../notifications/notification.service';
import { PassesService } from '../passes/passes.service';

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
    private readonly notificationService: NotificationService,
    private readonly passesService: PassesService,
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

    await this.passesService.createPassForGuest(savedGuest.id);

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

  async selfRegister(selfRegistrationDto: SelfRegistrationDto): Promise<SelfRegistrationResponseDto> {
    this.logger.log(`Self-registration for event ${selfRegistrationDto.event_id}`);

    const queryRunner = this.guestRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate event exists and is accepting registrations
      const event = await queryRunner.manager.findOne(Event, {
        where: { id: selfRegistrationDto.event_id },
        relations: ['tiers'],
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${selfRegistrationDto.event_id} not found`);
      }

      // Additional validation for self-registration
      if (event.status !== 'active') {
        throw new BadRequestException('Event is not currently accepting registrations');
      }

      // Check if registration period is valid
      const now = new Date();
      if (event.start_datetime < now) {
        throw new BadRequestException('Registration is closed - event has already occurred');
      }

      // Validate tier exists and belongs to event
      const tier = await queryRunner.manager.findOne(Tier, {
        where: { id: selfRegistrationDto.tier_id, event_id: selfRegistrationDto.event_id },
      });

      if (!tier) {
        throw new NotFoundException(
          `Tier with ID ${selfRegistrationDto.tier_id} not found for event ${selfRegistrationDto.event_id}`
        );
      }

      // Calculate total guests (primary + additional)
      const totalGuestsCount = 1 + (selfRegistrationDto.additional_guests?.length || 0);

      // Validate capacity for all guests
      await this.validateCapacityWithQueryRunner(
        queryRunner,
        selfRegistrationDto.event_id,
        selfRegistrationDto.tier_id,
        totalGuestsCount
      );

      // Check for duplicate email (primary guest)
      const existingGuest = await queryRunner.manager.findOne(Guest, {
        where: {
          email: selfRegistrationDto.email,
          event_id: selfRegistrationDto.event_id,
        },
      });

      if (existingGuest) {
        throw new ConflictException(
          `Guest with email ${selfRegistrationDto.email} already exists for this event`
        );
      }

      // Create primary guest
      const primaryGuestData = {
        event_id: selfRegistrationDto.event_id,
        tier_id: selfRegistrationDto.tier_id,
        name: selfRegistrationDto.name,
        email: selfRegistrationDto.email,
        phone: selfRegistrationDto.phone,
        custom_field_answers: selfRegistrationDto.custom_field_answers,
        dietary_restrictions: selfRegistrationDto.dietary_restrictions,
        accessibility_needs: selfRegistrationDto.accessibility_needs,
        is_primary: true,
        rsvp_status: RsvpStatus.ACCEPTED, // Self-registration implies acceptance
        invite_status: InviteStatus.DELIVERED, // Self-registration means invite was "delivered"
        rsvp_responded_at: new Date(),
      };

      const primaryGuest = queryRunner.manager.create(Guest, primaryGuestData);
      const savedPrimaryGuest = await queryRunner.manager.save(Guest, primaryGuest);

      const guestIds = [savedPrimaryGuest.id];

      // Create additional guests if provided
      if (selfRegistrationDto.additional_guests?.length > 0) {
        for (const additionalGuestData of selfRegistrationDto.additional_guests) {
          // Check for duplicate email if provided for additional guest
          if (additionalGuestData.email) {
            const existingAdditionalGuest = await queryRunner.manager.findOne(Guest, {
              where: {
                email: additionalGuestData.email,
                event_id: selfRegistrationDto.event_id,
              },
            });

            if (existingAdditionalGuest) {
              throw new ConflictException(
                `Additional guest with email ${additionalGuestData.email} already exists for this event`
              );
            }
          }

          const additionalGuest = queryRunner.manager.create(Guest, {
            event_id: selfRegistrationDto.event_id,
            tier_id: selfRegistrationDto.tier_id,
            primary_guest_id: savedPrimaryGuest.id,
            name: additionalGuestData.name,
            email: additionalGuestData.email,
            phone: additionalGuestData.phone,
            custom_field_answers: additionalGuestData.custom_field_answers,
            dietary_restrictions: additionalGuestData.dietary_restrictions,
            accessibility_needs: additionalGuestData.accessibility_needs,
            is_primary: false,
            rsvp_status: RsvpStatus.ACCEPTED,
            invite_status: InviteStatus.DELIVERED,
            rsvp_responded_at: new Date(),
          });

          const savedAdditionalGuest = await queryRunner.manager.save(Guest, additionalGuest);
          guestIds.push(savedAdditionalGuest.id);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Self-registration completed: ${totalGuestsCount} guest(s) registered for event ${event.id}`
      );

      // Send confirmation email
      try {
        await this.sendRegistrationConfirmationEmail(savedPrimaryGuest, event, tier);
      } catch (emailError) {
        this.logger.error(`Failed to send confirmation email for guest ${savedPrimaryGuest.id}`, emailError);
        // Do not throw error here, registration is already successful
      }

      // Create passes for all new guests
      for (const guestId of guestIds) {
        await this.passesService.createPassForGuest(guestId);
      }

      return SelfRegistrationResponseDto.create({
        primary_guest_id: savedPrimaryGuest.id,
        guest_ids: guestIds,
        total_guests: totalGuestsCount,
        event: {
          id: event.id,
          title: event.name,
          date: event.start_datetime,
        },
        tier: {
          id: tier.id,
          name: tier.name,
          price: tier.price,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Self-registration failed', error instanceof Error ? error.stack : String(error));
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async validateCapacityWithQueryRunner(
    queryRunner: any,
    eventId: string,
    tierId: string,
    guestCount: number = 1,
  ): Promise<void> {
    this.logger.log(`Validating capacity for event ${eventId}, tier ${tierId}`);

    // Get tier with capacity info
    const tier = await queryRunner.manager.findOne(Tier, {
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
    const currentGuestCount = await queryRunner.manager.count(Guest, {
      where: { tier_id: tierId, event_id: eventId },
    });

    if (currentGuestCount + guestCount > tier.guest_limit) {
      throw new BadRequestException(
        `Adding ${guestCount} guest(s) would exceed tier capacity (${currentGuestCount + guestCount}/${tier.guest_limit})`
      );
    }

    this.logger.log(`Capacity check passed: ${currentGuestCount + guestCount}/${tier.guest_limit}`);
  }

  private async sendRegistrationConfirmationEmail(guest: Guest, event: Event, tier: Tier): Promise<void> {
    const subject = `Confirmation for ${event.name}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    // TODO: Create a more sophisticated QR code generation that includes more data
    const qrCodeData = JSON.stringify({ guestId: guest.id, eventId: event.id });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;

    const htmlBody = `
      <h1>Registration Confirmed!</h1>
      <p>Hello ${guest.name},</p>
      <p>Your registration for the event "<strong>${event.name}</strong>" is confirmed.</p>
      <h3>Event Details:</h3>
      <ul>
        <li><strong>Event:</strong> ${event.name}</li>
        <li><strong>Date:</strong> ${event.start_datetime.toLocaleString()}</li>
        <li><strong>Venue:</strong> ${event.venue_name || 'TBA'}</li>
        <li><strong>Tier:</strong> ${tier.name}</li>
      </ul>
      <p>Here is your unique QR code for check-in:</p>
      <img src="${qrCodeUrl}" alt="Your QR Code" />
      <p>We look forward to seeing you there!</p>
      <br/>
      <p>Thank you,</p>
      <p>The Daawa Team</p>
    `;

    const textBody = `
      Registration Confirmed!
      Hello ${guest.name},
      Your registration for the event "${event.name}" is confirmed.
      
      Event Details:
      - Event: ${event.name}
      - Date: ${event.start_datetime.toLocaleString()}
      - Venue: ${event.venue_name || 'TBA'}
      - Tier: ${tier.name}
      
      We look forward to seeing you there!

      Thank you,
      The Daawa Team
    `;

    await this.notificationService.sendEmail({
      to: guest.email,
      subject,
      body: textBody,
      html: htmlBody,
    });
  }
} 