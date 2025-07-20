import { ApiProperty } from '@nestjs/swagger';
import { Pass } from '../database/entities/pass.entity';

export class PassResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  guestName: string;

  @ApiProperty()
  eventName: string;

  @ApiProperty()
  tierName: string;

  @ApiProperty()
  eventDate: Date;

  @ApiProperty()
  venue: string;

  @ApiProperty()
  qrCodeData: string;

  static fromEntity(pass: Pass): PassResponseDto {
    const dto = new PassResponseDto();
    dto.id = pass.id;
    dto.guestName = pass.guest.name;
    dto.eventName = pass.guest.event.name;
    dto.tierName = pass.guest.tier.name;
    dto.eventDate = pass.guest.event.start_datetime;
    dto.venue = pass.guest.event.venue_name;
    dto.qrCodeData = JSON.stringify({ passId: pass.id, guestId: pass.guest_id, eventId: pass.guest.event_id });
    return dto;
  }
}
