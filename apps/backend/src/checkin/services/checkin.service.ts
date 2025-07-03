import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In } from 'typeorm';
import { CheckinRecord, CheckinMethod } from '../../database/entities/checkin-record.entity';
import { Guest, CheckinStatus } from '../../database/entities/guest.entity';
import { Event } from '../../database/entities/event.entity';
import { User } from '../../database/entities/user.entity';
import {
  CheckinRequestDto,
  CheckinResponseDto,
  CheckinQueryDto,
  CheckinStatsResponseDto,
  CheckinHistoryResponseDto,
  BulkCheckinRequestDto,
  SyncCheckinRequestDto,
  SyncCheckinResponseDto,
  OfflineCheckinDto,
  CheckinStatisticsDto,
} from '../dtos';

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    @InjectRepository(CheckinRecord)
    private readonly checkinRecordRepository: Repository<CheckinRecord>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Record a check-in for a guest
   */
  async recordCheckin(request: CheckinRequestDto, checkedInByUserId: string): Promise<CheckinResponseDto> {
    this.logger.log(`Recording check-in for guest ${request.guest_id} by user ${checkedInByUserId}`);

    return await this.dataSource.transaction(async manager => {
      // Fetch guest with relations
      const guest = await manager.findOne(Guest, {
        where: { id: request.guest_id },
        relations: ['event', 'tier', 'additional_guests'],
      });

      if (!guest) {
        throw new NotFoundException(`Guest with ID ${request.guest_id} not found`);
      }

      // Check if guest is already checked in
      if (guest.checkin_status === CheckinStatus.CHECKED_IN) {
        throw new ConflictException('Guest is already checked in');
      }

      // Fetch the staff user
      const checkedInByUser = await manager.findOne(User, {
        where: { id: checkedInByUserId },
      });

      if (!checkedInByUser) {
        throw new NotFoundException(`User with ID ${checkedInByUserId} not found`);
      }

      // Determine additional guests to check in
      let additionalGuestsToCheckin: Guest[] = [];
      let totalGuestsCheckedin = 1; // Primary guest

      if (request.additional_guest_ids && request.additional_guest_ids.length > 0) {
        // Validate that additional guests belong to this primary guest
        additionalGuestsToCheckin = await manager.find(Guest, {
          where: {
            id: In(request.additional_guest_ids),
            primary_guest_id: guest.id,
            checkin_status: CheckinStatus.NOT_CHECKED_IN,
          },
        });

        if (additionalGuestsToCheckin.length !== request.additional_guest_ids.length) {
          throw new BadRequestException('Some additional guests are invalid or already checked in');
        }

        totalGuestsCheckedin += additionalGuestsToCheckin.length;
      }

      const checkinTimestamp = new Date();

      // Create checkin record
      const checkinRecord = manager.create(CheckinRecord, {
        guest_id: guest.id,
        event_id: guest.event_id,
        checkin_timestamp: checkinTimestamp,
        checked_in_by_user_id: checkedInByUserId,
        checkin_method: request.checkin_method || CheckinMethod.QR_CODE,
        device_info: request.device_info,
        location: request.location,
        present_additional_guest_ids: additionalGuestsToCheckin.map(g => g.id),
        notes: request.notes,
      });

      await manager.save(CheckinRecord, checkinRecord);

      // Update primary guest status
      await manager.update(Guest, guest.id, {
        checkin_status: CheckinStatus.CHECKED_IN,
        checkin_timestamp: checkinTimestamp,
        checked_in_by_user_id: checkedInByUserId,
      });

      // Update additional guests status
      if (additionalGuestsToCheckin.length > 0) {
        await manager.update(
          Guest,
          additionalGuestsToCheckin.map(g => g.id),
          {
            checkin_status: CheckinStatus.CHECKED_IN,
            checkin_timestamp: checkinTimestamp,
            checked_in_by_user_id: checkedInByUserId,
          }
        );
      }

      this.logger.log(`Successfully checked in ${totalGuestsCheckedin} guests for event ${guest.event_id}`);

      return CheckinResponseDto.fromEntity(checkinRecord, guest.name);
    });
  }

  /**
   * Process bulk check-ins
   */
  async processBulkCheckin(request: BulkCheckinRequestDto, checkedInByUserId: string): Promise<CheckinResponseDto[]> {
    this.logger.log(`Processing bulk check-in for ${request.checkin_requests.length} requests`);

    const results: CheckinResponseDto[] = [];

    for (const checkinRequest of request.checkin_requests) {
      try {
        const result = await this.recordCheckin(checkinRequest, checkedInByUserId);
        results.push(result);
      } catch (error) {
        const errorMessage = `Failed to check in guest ${checkinRequest.guest_id}: ${(error as Error).message}`;
        this.logger.error(errorMessage);
        
        // Add failed result with basic structure
        const failedResult = new CheckinResponseDto();
        failedResult.id = '';
        failedResult.guest_id = checkinRequest.guest_id;
        failedResult.guest_name = 'Unknown';
        failedResult.event_id = '';
        failedResult.checkin_timestamp = new Date();
        failedResult.checkin_method = checkinRequest.checkin_method || CheckinMethod.QR_CODE;
        failedResult.checked_in_by_user_id = checkedInByUserId;
        failedResult.was_already_checked_in = false;
        failedResult.total_guests_checked_in = 0;
        
        results.push(failedResult);
      }
    }

    return results;
  }

  /**
   * Get check-in history with filtering and pagination
   */
  async getCheckinHistory(query: CheckinQueryDto): Promise<CheckinHistoryResponseDto> {
    const queryBuilder = this.checkinRecordRepository.createQueryBuilder('checkin')
      .leftJoinAndSelect('checkin.guest', 'guest')
      .leftJoinAndSelect('checkin.event', 'event')
      .leftJoinAndSelect('checkin.checked_in_by_user', 'user')
      .leftJoinAndSelect('guest.tier', 'tier');

    // Apply filters
    if (query.event_id) {
      queryBuilder.andWhere('checkin.event_id = :eventId', { eventId: query.event_id });
    }

    if (query.guest_id) {
      queryBuilder.andWhere('checkin.guest_id = :guestId', { guestId: query.guest_id });
    }

    if (query.checked_in_by_user_id) {
      queryBuilder.andWhere('checkin.checked_in_by_user_id = :userId', { userId: query.checked_in_by_user_id });
    }

    if (query.checkin_method) {
      queryBuilder.andWhere('checkin.checkin_method = :method', { method: query.checkin_method });
    }

    if (query.location) {
      queryBuilder.andWhere('checkin.location ILIKE :location', { location: `%${query.location}%` });
    }

    if (query.from_date && query.to_date) {
      queryBuilder.andWhere('checkin.checkin_timestamp BETWEEN :dateFrom AND :dateTo', {
        dateFrom: query.from_date,
        dateTo: query.to_date,
      });
    } else if (query.from_date) {
      queryBuilder.andWhere('checkin.checkin_timestamp >= :dateFrom', { dateFrom: query.from_date });
    } else if (query.to_date) {
      queryBuilder.andWhere('checkin.checkin_timestamp <= :dateTo', { dateTo: query.to_date });
    }

    // Apply search
    if (query.search) {
      queryBuilder.andWhere(
        '(guest.name ILIKE :search OR guest.email ILIKE :search OR event.name ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    queryBuilder
      .orderBy('checkin.checkin_timestamp', 'DESC')
      .skip(offset)
      .take(limit);

    const checkinRecords = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      checkins: checkinRecords.map(record => 
        CheckinResponseDto.fromEntity(record, record.guest.name)
      ),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get detailed check-in statistics for an event
   */
  async getDetailedCheckinStats(eventId: string): Promise<CheckinStatisticsDto> {
    this.logger.log(`Getting detailed check-in stats for event ${eventId}`);

    // 1. Verify event exists
    const event = await this.eventRepository.findOneBy({ id: eventId });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // 2. Fetch all guests and check-ins for the event
    const [guests, checkIns] = await Promise.all([
      this.guestRepository.find({
        where: { event_id: eventId },
        relations: ['tier'],
      }),
      this.checkinRecordRepository.find({
        where: { event_id: eventId },
      }),
    ]);

    const total_guests = guests.length;
    const checked_in_count = checkIns.length;
    const checkin_percentage = total_guests > 0 ? (checked_in_count / total_guests) * 100 : 0;

    // 3. Group guests and check-ins by tier
    const tierStats = new Map<string, { tier_id: string; tier_name: string; total_guests: number; checked_in_count: number }>();

    for (const guest of guests) {
      const tierId = guest.tier?.id || 'unknown';
      const tierName = guest.tier?.name || 'Unknown';

      if (!tierStats.has(tierId)) {
        tierStats.set(tierId, {
          tier_id: tierId,
          tier_name: tierName,
          total_guests: 0,
          checked_in_count: 0,
        });
      }
      tierStats.get(tierId)!.total_guests++;
    }

    for (const checkIn of checkIns) {
      const guest = guests.find(g => g.id === checkIn.guest_id);
      if (guest) {
        const tierId = guest.tier?.id || 'unknown';
        if (tierStats.has(tierId)) {
          tierStats.get(tierId)!.checked_in_count++;
        }
      }
    }

    // 4. Group check-ins by hour
    const timelineStats = new Map<string, { hour: string; count: number }>();
    for (const checkIn of checkIns) {
      const hour = new Date(checkIn.checkin_timestamp).toTimeString().slice(0, 5); // "HH:MM"
      if (!timelineStats.has(hour)) {
        timelineStats.set(hour, { hour, count: 0 });
      }
      timelineStats.get(hour)!.count++;
    }

    // 5. Assemble the DTO
    return {
      total_guests,
      checked_in_count,
      checkin_percentage: parseFloat(checkin_percentage.toFixed(2)),
      by_tier: Array.from(tierStats.values()).sort((a, b) => b.total_guests - a.total_guests),
      timeline: Array.from(timelineStats.values()).sort((a, b) => a.hour.localeCompare(b.hour)),
    };
  }

  /**
   * Get check-in statistics for an event
   */
  async getCheckinStats(eventId: string, dateFrom?: Date, dateTo?: Date): Promise<CheckinStatsResponseDto> {
    this.logger.log(`Getting check-in stats for event ${eventId}`);

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['guests'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Base query for checked-in guests
    const checkedInQuery = this.guestRepository.createQueryBuilder('guest')
      .where('guest.event_id = :eventId', { eventId })
      .andWhere('guest.checkin_status = :status', { status: CheckinStatus.CHECKED_IN });

    // Base query for check-in records
    const recordsQuery = this.checkinRecordRepository.createQueryBuilder('checkin')
      .where('checkin.event_id = :eventId', { eventId });

    // Apply date filters if provided
    if (dateFrom && dateTo) {
      checkedInQuery.andWhere('guest.checkin_timestamp BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });
      recordsQuery.andWhere('checkin.checkin_timestamp BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });
    }

    // Get statistics
    const [
      totalCheckedIn,
      totalPrimaryCheckedIn,
      totalAdditionalCheckedIn,
      totalCheckinRecords,
    ] = await Promise.all([
      checkedInQuery.getCount(),
      checkedInQuery.clone().andWhere('guest.is_primary = true').getCount(),
      checkedInQuery.clone().andWhere('guest.is_primary = false').getCount(),
      recordsQuery.getCount(),
    ]);

    // Get check-in methods breakdown
    const methodStats = await recordsQuery
      .select('checkin.checkin_method', 'method')
      .addSelect('COUNT(*)', 'count')
      .groupBy('checkin.checkin_method')
      .getRawMany();

    // Get hourly check-ins for today (if no date range specified)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hourlyCounts = await this.checkinRecordRepository.createQueryBuilder('checkin')
      .select("EXTRACT(hour FROM checkin.checkin_timestamp)", 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('checkin.event_id = :eventId', { eventId })
      .andWhere('checkin.checkin_timestamp >= :today', { today })
      .andWhere('checkin.checkin_timestamp < :tomorrow', { tomorrow })
      .groupBy("EXTRACT(hour FROM checkin.checkin_timestamp)")
      .orderBy('hour')
      .getRawMany();

    // Get recent check-ins
    const recentCheckins = await this.checkinRecordRepository.find({
      where: { event_id: eventId },
      relations: ['guest'],
      order: { checkin_timestamp: 'DESC' },
      take: 10,
    });

    const checkinsByMethod = {} as { [key in CheckinMethod]: number };
    Object.values(CheckinMethod).forEach(method => {
      checkinsByMethod[method] = 0;
    });
    methodStats.forEach(stat => {
      checkinsByMethod[stat.method as CheckinMethod] = parseInt(stat.count);
    });

    const checkinsByHour: { [hour: string]: number } = {};
    hourlyCounts.forEach(stat => {
      checkinsByHour[stat.hour] = parseInt(stat.count);
    });

    return {
      total_checkins: totalCheckinRecords,
      primary_guests_checked_in: totalPrimaryCheckedIn,
      additional_guests_checked_in: totalAdditionalCheckedIn,
      checkins_by_method: checkinsByMethod,
      checkins_by_hour: checkinsByHour,
      recent_checkins: recentCheckins.map(record => 
        CheckinResponseDto.fromEntity(record, record.guest.name)
      ),
    };
  }

  /**
   * Sync offline check-ins
   */
  async syncOfflineCheckins(request: SyncCheckinRequestDto, checkedInByUserId: string): Promise<SyncCheckinResponseDto> {
    this.logger.log(`Syncing ${request.offline_checkins.length} offline check-ins`);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const offlineCheckin of request.offline_checkins) {
      try {
        // Convert offline check-in to regular check-in request
        const checkinRequest: CheckinRequestDto = {
          guest_id: offlineCheckin.guest_id,
          event_id: offlineCheckin.event_id,
          checkin_method: offlineCheckin.checkin_method,
          additional_guest_ids: offlineCheckin.additional_guest_ids,
          device_info: offlineCheckin.device_info,
          location: offlineCheckin.location,
          notes: offlineCheckin.notes,
        };

        // Check if this check-in already exists (based on offline_id)
        const offlineTimestamp = new Date(offlineCheckin.offline_checkin_timestamp);
        const existingRecord = await this.checkinRecordRepository.findOne({
          where: {
            guest_id: offlineCheckin.guest_id,
            checkin_timestamp: Between(
              new Date(offlineTimestamp.getTime() - 60000), // 1 minute before
              new Date(offlineTimestamp.getTime() + 60000)  // 1 minute after
            ),
          },
        });

        if (existingRecord) {
          results.push({
            offline_id: offlineCheckin.offline_id,
            status: 'duplicate',
            message: 'Check-in already exists',
            server_checkin_id: existingRecord.id,
          });
          continue;
        }

        const result = await this.recordCheckin(checkinRequest, checkedInByUserId);
        
        results.push({
          offline_id: offlineCheckin.offline_id,
          status: 'success',
          message: 'Check-in synced successfully',
          server_checkin_id: result.id,
        });
        
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to sync offline check-in ${offlineCheckin.offline_id}:`, error);
        
        results.push({
          offline_id: offlineCheckin.offline_id,
          status: 'error',
          message: (error as Error).message,
          server_checkin_id: null,
        });
        
        errorCount++;
      }
    }

    const successfulSyncs = results.filter(r => r.status === 'success').map(r => ({
      offline_id: r.offline_id,
      server_checkin_id: r.server_checkin_id,
      guest_name: 'Guest', // Will be populated from actual guest data in full implementation
    }));

    const failedSyncs = results.filter(r => r.status === 'error').map(r => ({
      offline_id: r.offline_id,
      error_message: r.message,
      error_code: 'VALIDATION_ERROR' as const,
    }));

    const conflicts = results.filter(r => r.status === 'duplicate').map(r => ({
      offline_id: r.offline_id,
      conflict_type: 'ALREADY_CHECKED_IN' as const,
      server_checkin_timestamp: new Date(),
      offline_checkin_timestamp: new Date().toISOString(),
      guest_name: 'Guest', // Will be populated from actual guest data in full implementation
    }));

    return {
      successful_syncs: successfulSyncs,
      failed_syncs: failedSyncs,
      conflicts: conflicts,
      sync_timestamp: new Date().toISOString(),
      summary: {
        total_submitted: request.offline_checkins.length,
        successful: successCount,
        failed: errorCount,
        conflicts: conflicts.length,
      },
    };
  }

  /**
   * Get guest check-in status
   */
  async getGuestCheckinStatus(guestId: string): Promise<any> {
    const guest = await this.guestRepository.findOne({
      where: { id: guestId },
      relations: ['tier', 'additional_guests'],
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${guestId} not found`);
    }

    const checkinRecord = await this.checkinRecordRepository.findOne({
      where: { guest_id: guestId },
      relations: ['checked_in_by_user'],
    });

    return {
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        tier_name: guest.tier?.name || 'Unknown',
        is_primary: guest.is_primary,
      },
      checkin_status: guest.checkin_status,
      checkin_timestamp: guest.checkin_timestamp,
      checked_in_by: checkinRecord?.checked_in_by_user ? {
        id: checkinRecord.checked_in_by_user.id,
        name: checkinRecord.checked_in_by_user.name,
      } : null,
      additional_guests_count: guest.additional_guests?.length || 0,
      checkin_method: checkinRecord?.checkin_method,
      location: checkinRecord?.location,
    };
  }
} 