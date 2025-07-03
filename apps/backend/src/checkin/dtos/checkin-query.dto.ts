import { IsOptional, IsUUID, IsEnum, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CheckinMethod } from '../../database/entities/checkin-record.entity';

export class CheckinQueryDto {
  @ApiPropertyOptional({ description: 'Filter by event ID', example: 'uuid' })
  @IsOptional()
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  event_id?: string;

  @ApiPropertyOptional({ description: 'Filter by guest ID', example: 'uuid' })
  @IsOptional()
  @IsUUID(4, { message: 'Guest ID must be a valid UUID' })
  guest_id?: string;

  @ApiPropertyOptional({ description: 'Filter by user who performed check-in', example: 'uuid' })
  @IsOptional()
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  checked_in_by_user_id?: string;

  @ApiPropertyOptional({ description: 'Filter by check-in method', enum: CheckinMethod })
  @IsOptional()
  @IsEnum(CheckinMethod, { message: 'Check-in method must be a valid enum value' })
  checkin_method?: CheckinMethod;

  @ApiPropertyOptional({ description: 'Filter by location', example: 'Main Entrance' })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @ApiPropertyOptional({ description: 'Filter check-ins from this date (ISO string)', example: '2024-01-20T00:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'From date must be a valid ISO date string' })
  from_date?: string;

  @ApiPropertyOptional({ description: 'Filter check-ins to this date (ISO string)', example: '2024-01-20T23:59:59Z' })
  @IsOptional()
  @IsDateString({}, { message: 'To date must be a valid ISO date string' })
  to_date?: string;

  @ApiPropertyOptional({ description: 'Search in guest names', example: 'John' })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of records per page', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must be at most 100' })
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Include only primary guests', example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  primary_only?: boolean;
} 