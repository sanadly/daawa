import { IsString, IsOptional, IsUUID, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckinMethod } from '../../database/entities/checkin-record.entity';

export class QrValidationRequestDto {
  @ApiProperty({ description: 'QR code data string', example: 'eyJndWVzdF9pZCI6InV1aWQiLCJldmVudF9pZCI6InV1aWQifQ==' })
  @IsString({ message: 'QR code data must be a string' })
  qr_code_data: string;

  @ApiPropertyOptional({ description: 'Event ID for additional validation', example: 'uuid' })
  @IsOptional()
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  event_id?: string;

  @ApiPropertyOptional({ description: 'Device information', example: { device_type: 'mobile', app_version: '1.0.0' } })
  @IsOptional()
  @IsObject({ message: 'Device info must be an object' })
  device_info?: any;

  @ApiPropertyOptional({ description: 'Location where check-in is performed', example: 'Main Entrance' })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;
}

export class QrValidationResponseDto {
  @ApiProperty({ description: 'Whether QR code is valid', example: true })
  is_valid: boolean;

  @ApiProperty({ description: 'Guest information if valid', type: 'object' })
  guest?: {
    id: string;
    name: string;
    email?: string;
    tier_name: string;
    is_primary: boolean;
    additional_guests_count: number;
    allowed_additional_guests: number;
    additional_guests?: { id: string; name: string; checked_in_at?: Date }[];
  };

  @ApiProperty({ description: 'Event information if valid', type: 'object' })
  event?: {
    id: string;
    title: string;
    check_in_starts_at: Date;
    check_in_ends_at: Date;
  };

  @ApiPropertyOptional({ description: 'Error message if invalid' })
  error_message?: string;

  @ApiPropertyOptional({ description: 'Error code for programmatic handling' })
  error_code?: 'INVALID_QR' | 'EXPIRED_QR' | 'ALREADY_CHECKED_IN' | 'EVENT_NOT_ACTIVE' | 'GUEST_NOT_FOUND';

  @ApiProperty({ description: 'Whether guest is already checked in', example: false })
  already_checked_in: boolean;

  @ApiPropertyOptional({ description: 'Previous check-in timestamp if applicable' })
  previous_checkin_at?: Date;
} 