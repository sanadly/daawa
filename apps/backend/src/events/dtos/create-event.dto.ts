import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsArray, ValidateNested, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../../database/entities/event.entity';

class EventSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  max_capacity?: number;

  @IsOptional()
  @IsBoolean()
  allow_self_registration?: boolean;

  @IsOptional()
  @IsDateString()
  registration_deadline?: string;

  @IsOptional()
  @IsBoolean()
  approval_required?: boolean;

  @IsOptional()
  @IsBoolean()
  waitlist_enabled?: boolean;

  @IsOptional()
  @IsObject()
  email_notifications?: {
    reminder_enabled?: boolean;
    reminder_days_before?: number[];
    confirmation_template?: string;
  };

  @IsOptional()
  @IsObject()
  social_sharing?: {
    enabled?: boolean;
    platforms?: string[];
    custom_message?: string;
  };
}

class DesignConfigDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsObject()
  colors?: Record<string, string>;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  background_image_url?: string;

  @IsOptional()
  @IsString()
  custom_css?: string;
}

class FormQuestionDto {
  @IsString()
  id: string;

  @IsEnum(['text', 'textarea', 'select', 'checkbox', 'radio'])
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';

  @IsString()
  question: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsBoolean()
  required: boolean;
}

class FormConfigDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_fields?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optional_fields?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormQuestionDto)
  custom_questions?: FormQuestionDto[];
}

class MetadataDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  skip_default_tier?: boolean;

  @IsOptional()
  @IsArray()
  external_links?: Array<{
    platform: string;
    url: string;
  }>;

  @IsOptional()
  @IsObject()
  analytics?: {
    tracking_id?: string;
    conversion_tracking?: boolean;
  };
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Event status', enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Primary language' })
  @IsOptional()
  @IsString()
  primary_language?: string;

  @ApiPropertyOptional({ description: 'Default plus one guests allowed' })
  @IsOptional()
  @IsInt()
  @Min(0)
  default_plus_n?: number;

  @ApiPropertyOptional({ description: 'Venue name' })
  @IsOptional()
  @IsString()
  venue_name?: string;

  @ApiPropertyOptional({ description: 'Venue address' })
  @IsOptional()
  @IsString()
  venue_address?: string;

  @ApiProperty({ description: 'Event start date and time in ISO 8601 format' })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  start_datetime: string;

  @ApiProperty({ description: 'Event end date and time in ISO 8601 format' })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  end_datetime: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Design configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DesignConfigDto)
  design_config?: DesignConfigDto;

  @ApiPropertyOptional({ description: 'Form configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormConfigDto)
  form_config?: FormConfigDto;

  @ApiPropertyOptional({ description: 'Event settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventSettingsDto)
  event_settings?: EventSettingsDto;

  @ApiPropertyOptional({ description: 'Check-in enabled' })
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

  @ApiPropertyOptional({ description: 'Event metadata' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata?: MetadataDto;

  @ApiPropertyOptional({ description: 'Platform fee (calculated automatically)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platform_fee?: number;

  @ApiPropertyOptional({ description: 'Platform currency' })
  @IsOptional()
  @IsString()
  platform_currency?: string;
} 