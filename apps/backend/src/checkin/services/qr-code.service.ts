import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guest } from '../../database/entities/guest.entity';
import { Event } from '../../database/entities/event.entity';
import { QrValidationRequestDto, QrValidationResponseDto } from '../dtos/qr-validation.dto';

interface QrCodePayload {
  guest_id: string;
  event_id: string;
  tier_id?: string;
  generated_at: number; // Unix timestamp
  expires_at?: number; // Unix timestamp
  version: string; // QR code format version
}

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);
  private readonly QR_VERSION = '1.0';
  private readonly QR_EXPIRY_HOURS = 24; // QR codes expire after 24 hours

  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Generate QR code data for a guest
   */
  async generateQrCode(guestId: string, eventId: string): Promise<string> {
    this.logger.log(`Generating QR code for guest ${guestId} and event ${eventId}`);

    // Verify guest exists and belongs to event
    const guest = await this.guestRepository.findOne({
      where: { id: guestId, event_id: eventId },
      relations: ['tier'],
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${guestId} not found for event ${eventId}`);
    }

    const now = Date.now();
    const expiresAt = now + (this.QR_EXPIRY_HOURS * 60 * 60 * 1000);

    const payload: QrCodePayload = {
      guest_id: guestId,
      event_id: eventId,
      tier_id: guest.tier_id,
      generated_at: now,
      expires_at: expiresAt,
      version: this.QR_VERSION,
    };

    // Convert to base64 encoded JSON
    const qrData = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    this.logger.log(`QR code generated successfully for guest ${guestId}`);
    return qrData;
  }

  /**
   * Validate QR code and return guest/event information
   */
  async validateQrCode(request: QrValidationRequestDto): Promise<QrValidationResponseDto> {
    this.logger.log(`Validating QR code for event ${request.event_id}`);

    try {
      // Decode QR code data
      const payload = this.decodeQrCode(request.qr_code_data);
      
      // Validate QR code format and expiry
      const validationResult = this.validateQrCodePayload(payload);
      if (!validationResult.is_valid) {
        return validationResult;
      }

      // Additional event ID validation if provided
      if (request.event_id && payload.event_id !== request.event_id) {
        return {
          is_valid: false,
          error_message: 'QR code is not valid for this event',
          error_code: 'INVALID_QR',
          already_checked_in: false,
        };
      }

      // Fetch guest and event information
      const [guest, event] = await Promise.all([
        this.guestRepository.findOne({
          where: { id: payload.guest_id, event_id: payload.event_id },
          relations: ['tier', 'additional_guests'],
        }),
        this.eventRepository.findOne({
          where: { id: payload.event_id },
        }),
      ]);

      if (!guest) {
        return {
          is_valid: false,
          error_message: 'Guest not found',
          error_code: 'GUEST_NOT_FOUND',
          already_checked_in: false,
        };
      }

      if (!event) {
        return {
          is_valid: false,
          error_message: 'Event not found',
          error_code: 'INVALID_QR',
          already_checked_in: false,
        };
      }

      // Check if event is active for check-in
      const now = new Date();
      const checkInStart = new Date(event.check_in_starts_at);
      const checkInEnd = new Date(event.check_in_ends_at);

      if (now < checkInStart || now > checkInEnd) {
        return {
          is_valid: false,
          error_message: 'Event check-in is not currently active',
          error_code: 'EVENT_NOT_ACTIVE',
          already_checked_in: false,
        };
      }

      // Check if guest is already checked in
      const alreadyCheckedIn = guest.checkin_status === 'checked_in';
      
      return {
        is_valid: true,
        guest: {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          tier_name: guest.tier?.name || 'Unknown',
          is_primary: guest.is_primary,
          additional_guests_count: guest.additional_guests?.length || 0,
          allowed_additional_guests: guest.allowed_plus_n_override ?? guest.tier?.guest_limit ?? 0,
          additional_guests: guest.additional_guests?.map(ag => ({
            id: ag.id,
            name: ag.name,
            checked_in_at: ag.checkin_timestamp
          })) || []
        },
        event: {
          id: event.id,
          title: event.name,
          check_in_starts_at: event.check_in_starts_at,
          check_in_ends_at: event.check_in_ends_at,
        },
        already_checked_in: alreadyCheckedIn,
        previous_checkin_at: guest.checkin_timestamp,
      };

    } catch (error) {
      this.logger.error('Error validating QR code', error);
      return {
        is_valid: false,
        error_message: 'Invalid QR code format',
        error_code: 'INVALID_QR',
        already_checked_in: false,
      };
    }
  }

  /**
   * Decode base64 QR code data to payload
   */
  private decodeQrCode(qrCodeData: string): QrCodePayload {
    try {
      const decodedData = Buffer.from(qrCodeData, 'base64').toString('utf-8');
      return JSON.parse(decodedData) as QrCodePayload;
    } catch (error) {
      throw new BadRequestException('Invalid QR code format');
    }
  }

  /**
   * Validate QR code payload structure and expiry
   */
  private validateQrCodePayload(payload: QrCodePayload): QrValidationResponseDto {
    // Check required fields
    if (!payload.guest_id || !payload.event_id || !payload.version) {
      return {
        is_valid: false,
        error_message: 'Invalid QR code structure',
        error_code: 'INVALID_QR',
        already_checked_in: false,
      };
    }

    // Check version compatibility
    if (payload.version !== this.QR_VERSION) {
      return {
        is_valid: false,
        error_message: 'QR code version not supported',
        error_code: 'INVALID_QR',
        already_checked_in: false,
      };
    }

    // Check expiry
    if (payload.expires_at && Date.now() > payload.expires_at) {
      return {
        is_valid: false,
        error_message: 'QR code has expired',
        error_code: 'EXPIRED_QR',
        already_checked_in: false,
      };
    }

    return {
      is_valid: true,
      already_checked_in: false,
    };
  }
} 