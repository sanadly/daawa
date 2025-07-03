import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckinMethod } from '../../database/entities/checkin-record.entity';
import { CheckinStatus } from '../../database/entities/guest.entity';

export class CheckinResponseDto {
  @ApiProperty({ description: 'Check-in record ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Guest ID', example: 'uuid' })
  guest_id: string;

  @ApiProperty({ description: 'Guest name', example: 'John Doe' })
  guest_name: string;

  @ApiProperty({ description: 'Event ID', example: 'uuid' })
  event_id: string;

  @ApiProperty({ description: 'Check-in timestamp', example: '2024-01-20T10:30:00Z' })
  checkin_timestamp: Date;

  @ApiProperty({ description: 'Check-in method', enum: CheckinMethod })
  checkin_method: CheckinMethod;

  @ApiProperty({ description: 'User who performed check-in', example: 'uuid' })
  checked_in_by_user_id: string;

  @ApiPropertyOptional({ description: 'IDs of additional guests that were checked in' })
  present_additional_guest_ids?: string[];

  @ApiPropertyOptional({ description: 'Location where check-in was performed' })
  location?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @ApiProperty({ description: 'Whether this guest was already checked in', example: false })
  was_already_checked_in: boolean;

  @ApiProperty({ description: 'Total guests checked in (including +N)', example: 2 })
  total_guests_checked_in: number;

  static fromEntity(checkinRecord: any, guestName: string, wasAlreadyCheckedIn: boolean = false): CheckinResponseDto {
    const dto = new CheckinResponseDto();
    dto.id = checkinRecord.id;
    dto.guest_id = checkinRecord.guest_id;
    dto.guest_name = guestName;
    dto.event_id = checkinRecord.event_id;
    dto.checkin_timestamp = checkinRecord.checkin_timestamp;
    dto.checkin_method = checkinRecord.checkin_method;
    dto.checked_in_by_user_id = checkinRecord.checked_in_by_user_id;
    dto.present_additional_guest_ids = checkinRecord.present_additional_guest_ids;
    dto.location = checkinRecord.location;
    dto.notes = checkinRecord.notes;
    dto.was_already_checked_in = wasAlreadyCheckedIn;
    dto.total_guests_checked_in = 1 + (checkinRecord.present_additional_guest_ids?.length || 0);
    return dto;
  }
}

export class CheckinStatsResponseDto {
  @ApiProperty({ description: 'Total check-ins for the event', example: 150 })
  total_checkins: number;

  @ApiProperty({ description: 'Primary guests checked in', example: 75 })
  primary_guests_checked_in: number;

  @ApiProperty({ description: 'Additional guests checked in', example: 75 })
  additional_guests_checked_in: number;

  @ApiProperty({ description: 'Check-ins by method', type: 'object' })
  checkins_by_method: {
    [key in CheckinMethod]: number;
  };

  @ApiProperty({ description: 'Check-ins by hour', type: 'object' })
  checkins_by_hour: { [hour: string]: number };

  @ApiProperty({ description: 'Most recent check-ins', type: [CheckinResponseDto] })
  recent_checkins: CheckinResponseDto[];
}

export class CheckinHistoryResponseDto {
  @ApiProperty({ description: 'Check-in records', type: [CheckinResponseDto] })
  checkins: CheckinResponseDto[];

  @ApiProperty({ description: 'Total number of check-in records', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Records per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrev: boolean;
} 