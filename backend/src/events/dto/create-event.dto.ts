import { IsString, IsOptional, IsDateString, IsEnum, IsInt } from 'class-validator';

export enum EventType {
  WEDDING = 'WEDDING',
  CONFERENCE = 'CONFERENCE',
  PARTY = 'PARTY',
  OTHER = 'OTHER',
}

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dateTime!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsEnum(EventType)
  type!: EventType;

  @IsOptional()
  @IsString()
  state?: string; // Draft, Pending, Active, etc.

  @IsOptional()
  staffIds?: number[]; // Array of user IDs to assign as staff

  @IsOptional()
  @IsInt()
  expectedGuests?: number;
} 