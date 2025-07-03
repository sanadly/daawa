import { IsString, IsEmail, IsOptional, IsUUID, IsBoolean, IsEnum, IsObject, IsInt, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InviteStatus, RsvpStatus } from '../../database/entities/guest.entity';

export class CreateGuestDto {
  @ApiProperty({ description: 'Event ID', example: 'uuid' })
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  event_id: string;

  @ApiProperty({ description: 'Tier ID', example: 'uuid' })
  @IsUUID(4, { message: 'Tier ID must be a valid UUID' })
  tier_id: string;

  @ApiPropertyOptional({ description: 'Primary guest ID (for +N guests)', example: 'uuid' })
  @IsOptional()
  @IsUUID(4, { message: 'Primary guest ID must be a valid UUID' })
  primary_guest_id?: string;

  @ApiProperty({ description: 'Guest name', example: 'John Doe', minLength: 1, maxLength: 255 })
  @IsString({ message: 'Name must be a string' })
  @Length(1, 255, { message: 'Name must be between 1 and 255 characters' })
  name: string;

  @ApiPropertyOptional({ description: 'Guest email', example: 'john@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Length(1, 255, { message: 'Email must be between 1 and 255 characters' })
  email?: string;

  @ApiPropertyOptional({ description: 'Guest phone number', example: '+1234567890', maxLength: 20 })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Length(1, 20, { message: 'Phone must be between 1 and 20 characters' })
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Invite status', 
    enum: InviteStatus, 
    default: InviteStatus.PENDING 
  })
  @IsOptional()
  @IsEnum(InviteStatus, { message: 'Invite status must be a valid enum value' })
  invite_status?: InviteStatus;

  @ApiPropertyOptional({ 
    description: 'RSVP status', 
    enum: RsvpStatus, 
    default: RsvpStatus.PENDING 
  })
  @IsOptional()
  @IsEnum(RsvpStatus, { message: 'RSVP status must be a valid enum value' })
  rsvp_status?: RsvpStatus;

  @ApiPropertyOptional({ 
    description: 'Override for allowed +N guests', 
    example: 2, 
    minimum: 0 
  })
  @IsOptional()
  @IsInt({ message: 'Allowed plus N override must be an integer' })
  @Min(0, { message: 'Allowed plus N override must be at least 0' })
  @Max(50, { message: 'Allowed plus N override must be at most 50' })
  allowed_plus_n_override?: number;

  @ApiPropertyOptional({ 
    description: 'Custom field answers as JSON object', 
    example: { dietary: 'vegetarian', emergency_contact: 'Jane Doe' } 
  })
  @IsOptional()
  @IsObject({ message: 'Custom field answers must be an object' })
  custom_field_answers?: any;

  @ApiPropertyOptional({ 
    description: 'Whether this is a primary guest', 
    default: true 
  })
  @IsOptional()
  @IsBoolean({ message: 'Is primary must be a boolean' })
  is_primary?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes about the guest' })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Dietary restrictions' })
  @IsOptional()
  @IsString({ message: 'Dietary restrictions must be a string' })
  dietary_restrictions?: string;

  @ApiPropertyOptional({ description: 'Accessibility needs' })
  @IsOptional()
  @IsString({ message: 'Accessibility needs must be a string' })
  accessibility_needs?: string;
} 