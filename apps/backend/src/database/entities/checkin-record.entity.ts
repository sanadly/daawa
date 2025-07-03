import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Guest } from './guest.entity';
import { Event } from './event.entity';
import { User } from './user.entity';

export enum CheckinMethod {
  MANUAL = 'manual',
  QR_CODE = 'qr_code',
  NFC = 'nfc',
  MOBILE = 'mobile',
}

@Entity('checkin_records')
@Index(['guest_id'])
@Index(['event_id'])
@Index(['checkin_timestamp'])
@Index(['checked_in_by_user_id'])
@Index(['event_id', 'checkin_timestamp'])
@Check('chk_checkin_checkout_order', 'checkout_timestamp IS NULL OR checkout_timestamp > checkin_timestamp')
export class CheckinRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  guest_id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @Column({ type: 'uuid' })
  checked_in_by_user_id: string;

  @CreateDateColumn()
  checkin_timestamp: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkout_timestamp?: Date;

  @Column({ type: 'uuid', array: true, nullable: true })
  present_additional_guest_ids?: string[];

  @Column({
    type: 'enum',
    enum: CheckinMethod,
    default: CheckinMethod.MANUAL,
  })
  checkin_method: CheckinMethod;

  @Column({ length: 100, nullable: true })
  location?: string;

  @Column({ type: 'jsonb', nullable: true })
  device_info?: any;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Guest, (guest) => guest.checkin_records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;

  @ManyToOne(() => Event, (event) => event.checkin_records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, (user) => user.performed_checkins)
  @JoinColumn({ name: 'checked_in_by_user_id' })
  checked_in_by_user: User;
} 