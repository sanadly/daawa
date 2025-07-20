import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsUUID, 
  IsArray, 
  IsObject, 
  ValidateNested, 
  IsInt, 
  Min, 
  Max, 
  Length,
  ArrayMaxSize 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdditionalGuestDto {
  @ApiProperty({ description: 'Additional guest name', example: 'Jane Doe', minLength: 1, maxLength: 255 })
  @IsString({ message: 'Name must be a string' })
  @Length(1, 255, { message: 'Name must be between 1 and 255 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'Additional guest email', example: 'jane@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Length(1, 255, { message: 'Email must be between 1 and 255 characters' })
  email?: string;

  @ApiPropertyOptional({ description: 'Additional guest phone number', example: '+1234567890', maxLength: 20 })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Length(1, 20, { message: 'Phone must be between 1 and 20 characters' })
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Custom field answers for additional guest as JSON object', 
    example: { dietary: 'vegan', emergency_contact: 'John Doe' } 
  })
  @IsOptional()
  @IsObject({ message: 'Custom field answers must be an object' })
  custom_field_answers?: any;

  @ApiPropertyOptional({ description: 'Dietary restrictions for additional guest' })
  @IsOptional()
  @IsString({ message: 'Dietary restrictions must be a string' })
  dietary_restrictions?: string;

  @ApiPropertyOptional({ description: 'Accessibility needs for additional guest' })
  @IsOptional()
  @IsString({ message: 'Accessibility needs must be a string' })
  accessibility_needs?: string;
}

export class SelfRegistrationDto {
  @ApiProperty({ description: 'Event ID', example: 'uuid' })
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  event_id: string;

  @ApiProperty({ description: 'Tier ID', example: 'uuid' })
  @IsUUID(4, { message: 'Tier ID must be a valid UUID' })
  tier_id: string;

  // Primary guest information
  @ApiProperty({ description: 'Primary guest name', example: 'John Doe', minLength: 1, maxLength: 255 })
  @IsString({ message: 'Name must be a string' })
  @Length(1, 255, { message: 'Name must be between 1 and 255 characters' })
  name: string;

  @ApiProperty({ description: 'Primary guest email', example: 'john@example.com' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Length(1, 255, { message: 'Email must be between 1 and 255 characters' })
  email: string;

  @ApiPropertyOptional({ description: 'Primary guest phone number', example: '+1234567890', maxLength: 20 })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Length(1, 20, { message: 'Phone must be between 1 and 20 characters' })
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Custom field answers for primary guest as JSON object', 
    example: { dietary: 'vegetarian', emergency_contact: 'Jane Doe' } 
  })
  @IsOptional()
  @IsObject({ message: 'Custom field answers must be an object' })
  custom_field_answers?: any;

  @ApiPropertyOptional({ description: 'Dietary restrictions for primary guest' })
  @IsOptional()
  @IsString({ message: 'Dietary restrictions must be a string' })
  dietary_restrictions?: string;

  @ApiPropertyOptional({ description: 'Accessibility needs for primary guest' })
  @IsOptional()
  @IsString({ message: 'Accessibility needs must be a string' })
  accessibility_needs?: string;

  // Additional guests (+N functionality)
  @ApiPropertyOptional({ 
    description: 'Additional guests (+N guests)', 
    type: [AdditionalGuestDto],
    maxItems: 10 
  })
  @IsOptional()
  @IsArray({ message: 'Additional guests must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 additional guests allowed' })
  @ValidateNested({ each: true })
  @Type(() => AdditionalGuestDto)
  additional_guests?: AdditionalGuestDto[];
}

export class SelfRegistrationResponseDto {
  @ApiProperty({ description: 'Primary guest ID' })
  primary_guest_id: string;

  @ApiProperty({ description: 'List of all guest IDs created (primary + additional)' })
  guest_ids: string[];

  @ApiProperty({ description: 'Total number of guests registered' })
  total_guests: number;

  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Event information' })
  event: {
    id: string;
    title: string;
    date: Date;
  };

  @ApiProperty({ description: 'Tier information' })
  tier: {
    id: string;
    name: string;
    price?: number;
  };

  static create(data: {
    primary_guest_id: string;
    guest_ids: string[];
    total_guests: number;
    event: { id: string; title: string; date: Date };
    tier: { id: string; name: string; price?: number };
  }): SelfRegistrationResponseDto {
    const response = new SelfRegistrationResponseDto();
    response.primary_guest_id = data.primary_guest_id;
    response.guest_ids = data.guest_ids;
    response.total_guests = data.total_guests;
    response.message = `Successfully registered ${data.total_guests} guest${data.total_guests > 1 ? 's' : ''} for ${data.event.title}`;
    response.event = data.event;
    response.tier = data.tier;
    return response;
  }
} 