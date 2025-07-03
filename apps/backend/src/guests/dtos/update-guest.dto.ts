import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGuestDto } from './create-guest.dto';

export class UpdateGuestDto extends PartialType(
  OmitType(CreateGuestDto, ['event_id', 'tier_id'] as const)
) {
  // Inherits all fields from CreateGuestDto except event_id and tier_id
  // All fields are optional for updates
} 