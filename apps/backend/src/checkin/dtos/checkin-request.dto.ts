import { IsString, IsOptional, IsUUID, IsEnum, IsObject, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckinMethod } from '../../database/entities/checkin-record.entity';

export class CheckinRequestDto {
  @ApiProperty({ description: 'Guest ID to check in', example: 'uuid' })
  @IsUUID(4, { message: 'Guest ID must be a valid UUID' })
  guest_id: string;

  @ApiProperty({ description: 'Event ID', example: 'uuid' })
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  event_id: string;

  @ApiProperty({ description: 'Check-in method', enum: CheckinMethod, example: CheckinMethod.QR_CODE })
  @IsEnum(CheckinMethod, { message: 'Check-in method must be a valid enum value' })
  checkin_method: CheckinMethod;

  @ApiPropertyOptional({ description: 'Array of additional guest IDs present for check-in' })
  @IsOptional()
  @IsArray({ message: 'Additional guest IDs must be an array' })
  @IsUUID(4, { each: true, message: 'Each additional guest ID must be a valid UUID' })
  additional_guest_ids?: string[];

  @ApiPropertyOptional({ description: 'Location where check-in is performed', example: 'Main Entrance' })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @ApiPropertyOptional({ description: 'Device information', example: { device_type: 'mobile', app_version: '1.0.0' } })
  @IsOptional()
  @IsObject({ message: 'Device info must be an object' })
  device_info?: any;

  @ApiPropertyOptional({ description: 'Additional notes for check-in' })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({ description: 'QR code data (for QR code check-ins)' })
  @IsOptional()
  @IsString({ message: 'QR code data must be a string' })
  qr_code_data?: string;
}

export class BulkCheckinRequestDto {
  @ApiProperty({ description: 'Array of check-in requests', type: [CheckinRequestDto] })
  @IsArray({ message: 'Check-in requests must be an array' })
  checkin_requests: CheckinRequestDto[];

  @ApiPropertyOptional({ description: 'Whether to perform all check-ins in a single transaction' })
  @IsOptional()
  @IsBoolean({ message: 'Use transaction must be a boolean' })
  use_transaction?: boolean;
} 