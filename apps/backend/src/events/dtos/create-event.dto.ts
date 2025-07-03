import { IsString, IsUUID, IsOptional, IsEnum, IsDateString, IsInt, Min, Max, IsBoolean, IsObject, IsArray, ValidateNested, IsNotEmpty, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../../database/entities/event.entity';

export class CreateEventDto {
  @ApiProperty({ description: 'Name of the event', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Venue name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  venue_name?: string;

  @ApiPropertyOptional({ description: 'Venue address' })
  @IsOptional()
  @IsString()
  venue_address?: string;

  @ApiProperty({ description: 'Event start date and time' })
  @IsDateString()
  start_datetime: string;

  @ApiProperty({ description: 'Event end date and time' })
  @IsDateString()
  end_datetime: string;

  @ApiPropertyOptional({ description: 'Event timezone', default: 'UTC' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ description: 'Primary language', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  primary_language?: string;

  @ApiPropertyOptional({ description: 'Default plus N allowed', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  default_plus_n?: number;

  @ApiPropertyOptional({ description: 'Event capacity limit' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity_limit?: number;

  @ApiPropertyOptional({ description: 'Design configuration' })
  @IsOptional()
  @IsObject()
  design_config?: any;

  @ApiPropertyOptional({ description: 'Form configuration' })
  @IsOptional()
  @IsObject()
  form_config?: any;

  @ApiPropertyOptional({ description: 'Additional event details' })
  @IsOptional()
  @IsObject()
  event_details?: any;

  @ApiPropertyOptional({ description: 'Whether check-in is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  check_in_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Check-in start time' })
  @IsOptional()
  @IsDateString()
  check_in_starts_at?: string;

  @ApiPropertyOptional({ description: 'Check-in end time' })
  @IsOptional()
  @IsDateString()
  check_in_ends_at?: string;
} 