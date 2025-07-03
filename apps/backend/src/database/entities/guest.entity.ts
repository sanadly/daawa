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
import { Event } from './event.entity';
import { Tier } from './tier.entity';
import { User } from './user.entity';
import { CheckinRecord } from './checkin-record.entity';

export enum InviteStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum RsvpStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
}

export enum CheckinStatus {
  NOT_CHECKED_IN = 'not_checked_in',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
}

@Entity('guests')
@Index(['event_id'])
@Index(['primary_guest_id'])
@Index(['email'])
@Index(['rsvp_status'])
@Index(['checkin_status'])
@Index(['tier_id'])
@Index(['event_id', 'checkin_status'])
@Index(['event_id', 'rsvp_status'])
@Index(['event_id', 'email'], { unique: true, where: 'email IS NOT NULL' })
@Check('chk_guests_plus_n_override', 'allowed_plus_n_override >= 0')
export class Guest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @Column({ type: 'uuid', nullable: true })
  primary_guest_id?: string;

  @Column({ type: 'uuid' })
  tier_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  invite_status: InviteStatus;

  @Column({
    type: 'enum',
    enum: RsvpStatus,
    default: RsvpStatus.PENDING,
  })
  rsvp_status: RsvpStatus;

  @Column({
    type: 'enum',
    enum: CheckinStatus,
    default: CheckinStatus.NOT_CHECKED_IN,
  })
  checkin_status: CheckinStatus;

  @Column({ type: 'timestamp', nullable: true })
  checkin_timestamp?: Date;

  @Column({ type: 'uuid', nullable: true })
  checked_in_by_user_id?: string;

  @Column({ type: 'int', nullable: true })
  allowed_plus_n_override?: number;

  @Column({ type: 'jsonb', nullable: true })
  custom_field_answers?: any;

  @Column({ default: true })
  is_primary: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  dietary_restrictions?: string;

  @Column({ type: 'text', nullable: true })
  accessibility_needs?: string;

  @Column({ type: 'timestamp', nullable: true })
  invite_sent_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  rsvp_responded_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Event, (event) => event.guests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => Guest, (guest) => guest.additional_guests, { nullable: true })
  @JoinColumn({ name: 'primary_guest_id' })
  primary_guest?: Guest;

  @OneToMany(() => Guest, (guest) => guest.primary_guest)
  additional_guests: Guest[];

  @ManyToOne(() => Tier, (tier) => tier.guests)
  @JoinColumn({ name: 'tier_id' })
  tier: Tier;

  @ManyToOne(() => User, (user) => user.checked_in_guests, { nullable: true })
  @JoinColumn({ name: 'checked_in_by_user_id' })
  checked_in_by_user?: User;

  @OneToMany(() => CheckinRecord, (checkinRecord) => checkinRecord.guest)
  checkin_records: CheckinRecord[];
} 