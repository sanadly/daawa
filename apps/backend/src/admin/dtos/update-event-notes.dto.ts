import { IsString } from 'class-validator';

export class UpdateEventNotesDto {
  @IsString()
  notes: string;
} 