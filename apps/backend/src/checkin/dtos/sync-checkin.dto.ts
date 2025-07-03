import { IsString, IsOptional, IsUUID, IsEnum, IsObject, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckinMethod } from '../../database/entities/checkin-record.entity';

export class OfflineCheckinDto {
  @ApiProperty({ description: 'Temporary offline ID for the check-in', example: 'offline-uuid-1' })
  @IsString({ message: 'Offline ID must be a string' })
  offline_id: string;

  @ApiProperty({ description: 'Guest ID to check in', example: 'uuid' })
  @IsUUID(4, { message: 'Guest ID must be a valid UUID' })
  guest_id: string;

  @ApiProperty({ description: 'Event ID', example: 'uuid' })
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  event_id: string;

  @ApiProperty({ description: 'Check-in method', enum: CheckinMethod })
  @IsEnum(CheckinMethod, { message: 'Check-in method must be a valid enum value' })
  checkin_method: CheckinMethod;

  @ApiProperty({ description: 'Offline check-in timestamp (ISO string)', example: '2024-01-20T10:30:00Z' })
  @IsDateString({}, { message: 'Check-in timestamp must be a valid ISO date string' })
  offline_checkin_timestamp: string;

  @ApiPropertyOptional({ description: 'Array of additional guest IDs present for check-in' })
  @IsOptional()
  @IsArray({ message: 'Additional guest IDs must be an array' })
  @IsUUID(4, { each: true, message: 'Each additional guest ID must be a valid UUID' })
  additional_guest_ids?: string[];

  @ApiPropertyOptional({ description: 'Location where check-in was performed' })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @ApiPropertyOptional({ description: 'Device information' })
  @IsOptional()
  @IsObject({ message: 'Device info must be an object' })
  device_info?: any;

  @ApiPropertyOptional({ description: 'Additional notes for check-in' })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({ description: 'QR code data used for check-in' })
  @IsOptional()
  @IsString({ message: 'QR code data must be a string' })
  qr_code_data?: string;
}

export class SyncCheckinRequestDto {
  @ApiProperty({ description: 'Array of offline check-ins to sync', type: [OfflineCheckinDto] })
  @IsArray({ message: 'Offline check-ins must be an array' })
  offline_checkins: OfflineCheckinDto[];

  @ApiPropertyOptional({ description: 'Device ID for conflict resolution' })
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  device_id?: string;

  @ApiPropertyOptional({ description: 'Last sync timestamp (ISO string)' })
  @IsOptional()
  @IsDateString({}, { message: 'Last sync timestamp must be a valid ISO date string' })
  last_sync_timestamp?: string;
}

export class SyncCheckinResponseDto {
  @ApiProperty({ description: 'Successfully synced check-ins' })
  successful_syncs: {
    offline_id: string;
    server_checkin_id: string;
    guest_name: string;
  }[];

  @ApiProperty({ description: 'Failed check-in syncs with errors' })
  failed_syncs: {
    offline_id: string;
    error_message: string;
    error_code: 'DUPLICATE_CHECKIN' | 'GUEST_NOT_FOUND' | 'EVENT_NOT_FOUND' | 'INVALID_TIMESTAMP' | 'VALIDATION_ERROR';
  }[];

  @ApiProperty({ description: 'Conflicts that need manual resolution' })
  conflicts: {
    offline_id: string;
    conflict_type: 'ALREADY_CHECKED_IN' | 'TIMESTAMP_MISMATCH';
    server_checkin_timestamp: Date;
    offline_checkin_timestamp: string;
    guest_name: string;
  }[];

  @ApiProperty({ description: 'Current server timestamp for next sync', example: '2024-01-20T12:00:00Z' })
  sync_timestamp: string;

  @ApiProperty({ description: 'Summary of sync operation' })
  summary: {
    total_submitted: number;
    successful: number;
    failed: number;
    conflicts: number;
  };
} 