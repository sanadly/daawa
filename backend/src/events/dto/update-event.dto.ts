import { IsString, IsOptional, IsDateString, IsInt, IsEnum } from 'class-validator';
import { EventType } from './create-event.dto';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsInt()
  organizerId?: number;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  staffIds?: number[];
  
  @IsOptional()
  @IsInt()
  expectedGuests?: number;

  @IsOptional()
  @IsString()
  status?: string;

} 