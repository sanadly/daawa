import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from './user.entity';
import { Tier } from './tier.entity';
import { Guest } from './guest.entity';
import { CheckinRecord } from './checkin-record.entity';
import { EventStaff } from './event-staff.entity';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('events')
@Index(['organizer_id'])
@Index(['status'])
@Index(['start_datetime'])
@Index(['tier_id'])
@Check('chk_events_dates', 'end_datetime > start_datetime')
@Check('chk_events_capacity', 'capacity_limit > 0')
@Check('chk_events_plus_n', 'default_plus_n >= 0')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizer_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @Column({ type: 'uuid', nullable: true })
  tier_id?: string;

  @Column({ type: 'int', nullable: true })
  capacity_limit?: number;

  @Column({ length: 5, default: 'en' })
  primary_language: string;

  @Column({ type: 'int', default: 0 })
  default_plus_n: number;

  @Column({ length: 255, nullable: true })
  venue_name?: string;

  @Column({ type: 'text', nullable: true })
  venue_address?: string;

  @Column({ type: 'timestamp' })
  start_datetime: Date;

  @Column({ type: 'timestamp' })
  end_datetime: Date;

  @Column({ length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true })
  design_config?: any;

  @Column({ type: 'jsonb', nullable: true })
  form_config?: any;

  @Column({ type: 'jsonb', nullable: true })
  event_details?: any;

  @Column({ default: true })
  check_in_enabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  check_in_starts_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_in_ends_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.organized_events)
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @ManyToOne(() => Tier, { nullable: true })
  @JoinColumn({ name: 'tier_id' })
  default_tier?: Tier;

  @OneToMany(() => Tier, (tier) => tier.event, { cascade: true })
  tiers: Tier[];

  @OneToMany(() => Guest, (guest) => guest.event)
  guests: Guest[];

  @OneToMany(() => CheckinRecord, (checkinRecord) => checkinRecord.event)
  checkin_records: CheckinRecord[];

  @OneToMany(() => EventStaff, (eventStaff) => eventStaff.event)
  staff_assignments: EventStaff[];
} 