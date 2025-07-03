import { IsOptional, IsUUID, IsEnum, IsString, IsInt, Min, Max, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InviteStatus, RsvpStatus, CheckinStatus } from '../../database/entities/guest.entity';

export class GuestQueryDto {
  @ApiPropertyOptional({ description: 'Event ID to filter guests' })
  @IsOptional()
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  event_id?: string;

  @ApiPropertyOptional({ description: 'Tier ID to filter guests' })
  @IsOptional()
  @IsUUID(4, { message: 'Tier ID must be a valid UUID' })
  tier_id?: string;

  @ApiPropertyOptional({ description: 'Primary guest ID to get +N guests' })
  @IsOptional()
  @IsUUID(4, { message: 'Primary guest ID must be a valid UUID' })
  primary_guest_id?: string;

  @ApiPropertyOptional({ description: 'Filter by invite status', enum: InviteStatus })
  @IsOptional()
  @IsEnum(InviteStatus, { message: 'Invite status must be a valid enum value' })
  invite_status?: InviteStatus;

  @ApiPropertyOptional({ description: 'Filter by RSVP status', enum: RsvpStatus })
  @IsOptional()
  @IsEnum(RsvpStatus, { message: 'RSVP status must be a valid enum value' })
  rsvp_status?: RsvpStatus;

  @ApiPropertyOptional({ description: 'Filter by check-in status', enum: CheckinStatus })
  @IsOptional()
  @IsEnum(CheckinStatus, { message: 'Check-in status must be a valid enum value' })
  checkin_status?: CheckinStatus;

  @ApiPropertyOptional({ description: 'Search by guest name' })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @ApiPropertyOptional({ description: 'Search by email' })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'Filter primary guests only', default: false })
  @IsOptional()
  @Type(() => Boolean)
  primary_only?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(200, { message: 'Limit must be at most 200' })
  limit?: number = 50;
} 