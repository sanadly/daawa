import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventStatus } from '../../database/entities/event.entity';

export class UpdateEventStatusDto {
  @IsEnum(EventStatus)
  status: EventStatus;

  @IsOptional()
  @IsString()
  notes?: string;
} 