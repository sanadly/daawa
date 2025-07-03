import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Guest } from '../../database/entities/guest.entity';

export class GuestResponseDto {
  @ApiProperty({ description: 'Guest ID' })
  id: string;

  @ApiProperty({ description: 'Event ID' })
  event_id: string;

  @ApiPropertyOptional({ description: 'Primary guest ID (for +N guests)' })
  primary_guest_id?: string;

  @ApiProperty({ description: 'Tier ID' })
  tier_id: string;

  @ApiProperty({ description: 'Guest name' })
  name: string;

  @ApiPropertyOptional({ description: 'Guest email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Guest phone number' })
  phone?: string;

  @ApiProperty({ description: 'Invite status' })
  invite_status: string;

  @ApiProperty({ description: 'RSVP status' })
  rsvp_status: string;

  @ApiProperty({ description: 'Check-in status' })
  checkin_status: string;

  @ApiPropertyOptional({ description: 'Check-in timestamp' })
  checkin_timestamp?: Date;

  @ApiPropertyOptional({ description: 'Checked in by user ID' })
  checked_in_by_user_id?: string;

  @ApiPropertyOptional({ description: 'Override for allowed +N guests' })
  allowed_plus_n_override?: number;

  @ApiPropertyOptional({ description: 'Custom field answers' })
  custom_field_answers?: any;

  @ApiProperty({ description: 'Whether this is a primary guest' })
  is_primary: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Dietary restrictions' })
  dietary_restrictions?: string;

  @ApiPropertyOptional({ description: 'Accessibility needs' })
  accessibility_needs?: string;

  @ApiPropertyOptional({ description: 'Invite sent timestamp' })
  invite_sent_at?: Date;

  @ApiPropertyOptional({ description: 'RSVP responded timestamp' })
  rsvp_responded_at?: Date;

  @ApiProperty({ description: 'Created timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Additional guests (for primary guests)' })
  additional_guests?: GuestResponseDto[];

  @ApiPropertyOptional({ description: 'Primary guest info (for +N guests)' })
  primary_guest?: GuestResponseDto;

  static fromEntity(guest: Guest): GuestResponseDto {
    const dto = new GuestResponseDto();
    dto.id = guest.id;
    dto.event_id = guest.event_id;
    dto.primary_guest_id = guest.primary_guest_id;
    dto.tier_id = guest.tier_id;
    dto.name = guest.name;
    dto.email = guest.email;
    dto.phone = guest.phone;
    dto.invite_status = guest.invite_status;
    dto.rsvp_status = guest.rsvp_status;
    dto.checkin_status = guest.checkin_status;
    dto.checkin_timestamp = guest.checkin_timestamp;
    dto.checked_in_by_user_id = guest.checked_in_by_user_id;
    dto.allowed_plus_n_override = guest.allowed_plus_n_override;
    dto.custom_field_answers = guest.custom_field_answers;
    dto.is_primary = guest.is_primary;
    dto.notes = guest.notes;
    dto.dietary_restrictions = guest.dietary_restrictions;
    dto.accessibility_needs = guest.accessibility_needs;
    dto.invite_sent_at = guest.invite_sent_at;
    dto.rsvp_responded_at = guest.rsvp_responded_at;
    dto.created_at = guest.created_at;
    dto.updated_at = guest.updated_at;

    if (guest.additional_guests) {
      dto.additional_guests = guest.additional_guests.map(ag => GuestResponseDto.fromEntity(ag));
    }

    if (guest.primary_guest) {
      dto.primary_guest = GuestResponseDto.fromEntity(guest.primary_guest);
    }

    return dto;
  }
}

export class PaginatedGuestResponseDto {
  @ApiProperty({ description: 'List of guests', type: [GuestResponseDto] })
  guests: GuestResponseDto[];

  @ApiProperty({ description: 'Total number of guests' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;
} 