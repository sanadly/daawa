import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { CheckinRecord } from './checkin-record.entity';
import { EventStaff } from './event-staff.entity';
import { EventTemplate } from './event-template.entity';
import { Guest } from './guest.entity';

export enum UserRole {
  ADMIN = 'admin',
  COMPANY_ORGANIZER = 'company_organizer',
  INDIVIDUAL_ORGANIZER = 'individual_organizer',
  STAFF = 'staff',
}

export enum AccountType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['role'])
@Index(['is_active'])
@Index(['account_type'])
@Index(['managing_organization_id'])
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

  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.INDIVIDUAL,
  })
  account_type: AccountType;

  // Company-specific fields
  @Column({ length: 255, nullable: true })
  company_name?: string;

  @Column({ length: 255, nullable: true })
  company_registration_number?: string;

  @Column({ length: 255, nullable: true })
  company_website?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  job_title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_location: string;

  @Column({ type: 'text', nullable: true })
  company_description: string;

  @Column({ type: 'integer', nullable: true })
  company_events_per_month: number;

  @Column({ type: 'integer', nullable: true })
  company_staff_needed: number;

  @Column({ type: 'uuid', nullable: true })
  managing_organization_id: string;

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
  @ManyToOne(() => User, (user) => user.managed_users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'managing_organization_id' })
  managing_organization?: User;

  @OneToMany(() => User, (user) => user.managing_organization)
  managed_users: User[];

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