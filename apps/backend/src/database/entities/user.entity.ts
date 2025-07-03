import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Event } from './event.entity';
import { CheckinRecord } from './checkin-record.entity';
import { EventStaff } from './event-staff.entity';
import { EventTemplate } from './event-template.entity';
import { Guest } from './guest.entity';

export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  STAFF = 'staff',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['role'])
@Index(['is_active'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ length: 5, default: 'en' })
  preferred_language: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 500, nullable: true })
  avatar_url?: string;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => Event, (event) => event.organizer)
  organized_events: Event[];

  @OneToMany(() => CheckinRecord, (checkinRecord) => checkinRecord.checked_in_by_user)
  performed_checkins: CheckinRecord[];

  @OneToMany(() => EventStaff, (eventStaff) => eventStaff.user)
  staff_assignments: EventStaff[];

  @OneToMany(() => EventTemplate, (template) => template.created_by_user)
  created_templates: EventTemplate[];

  @OneToMany(() => Guest, (guest) => guest.checked_in_by_user)
  checked_in_guests: Guest[];

  @OneToMany(() => EventStaff, (eventStaff) => eventStaff.assigned_by_user)
  assigned_staff: EventStaff[];
} 