import { ApiProperty } from '@nestjs/swagger';

class TierStatistic {
  @ApiProperty({ example: 'uuid' })
  tier_id: string;

  @ApiProperty({ example: 'VIP' })
  tier_name: string;

  @ApiProperty({ example: 100 })
  total_guests: number;

  @ApiProperty({ example: 50 })
  checked_in_count: number;
}

class TimelineStatistic {
  @ApiProperty({ example: '18:00' })
  hour: string;

  @ApiProperty({ example: 25 })
  count: number;
}

export class CheckinStatisticsDto {
  @ApiProperty({ example: 500 })
  total_guests: number;

  @ApiProperty({ example: 250 })
  checked_in_count: number;

  @ApiProperty({ example: 50.0 })
  checkin_percentage: number;

  @ApiProperty({ type: [TierStatistic] })
  by_tier: TierStatistic[];

  @ApiProperty({ type: [TimelineStatistic] })
  timeline: TimelineStatistic[];
} 