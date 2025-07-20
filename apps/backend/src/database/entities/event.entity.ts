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
  PENDING_PAYMENT = 'pending_payment',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PlatformPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  OVERDUE = 'overdue',
}

@Entity('events')
@Index(['organizer_id'])
@Index(['status'])
@Index(['start_datetime'])
@Index(['platform_payment_status'])
@Index(['created_at'])
@Check('chk_events_dates', 'end_datetime > start_datetime')
@Check('chk_events_plus_n', 'default_plus_n >= 0')
@Check('chk_events_platform_fee', 'platform_fee >= 0')
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

  // Platform payment (required for all events to be published)
  @Column({
    type: 'enum',
    enum: PlatformPaymentStatus,
    default: PlatformPaymentStatus.PENDING,
  })
  platform_payment_status: PlatformPaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  platform_fee: number;

  @Column({ length: 3, default: 'LYD' })
  platform_currency: string;

  @Column({ type: 'text', nullable: true })
  platform_payment_reference?: string;

  @Column({ type: 'timestamp', nullable: true })
  platform_payment_date?: Date;

  // Event settings
  @Column({ length: 5, default: 'en' })
  primary_language: string;

  @Column({ type: 'int', default: 0 })
  default_plus_n: number;

  @Column({ length: 255, nullable: true })
  venue_name?: string;

  @Column({ type: 'text', nullable: true })
  venue_address?: string;

  @Column({ type: 'timestamptz' }) // Using timestamptz for proper timezone support
  start_datetime: Date;

  @Column({ type: 'timestamptz' }) // Using timestamptz for proper timezone support
  end_datetime: Date;

  @Column({ length: 50, default: 'UTC' })
  timezone: string;

  // Configuration stored as JSON for flexibility
  @Column({ type: 'jsonb', nullable: true })
  design_config?: {
    template_id?: string; // e.g., 'classic-wedding', 'modern-floral'
    custom_background_url?: string; // For user-uploaded designs
    layout?: 'portrait' | 'landscape';
    elements?: Array<{
      id: string; // e.g., 'guest_name', 'event_title', 'date_time', 'venue_address'
      text: string; // The placeholder text or label, e.g., "{guestName}"
      x: number; // position from left
      y: number; // position from top
      font: string; // e.g., 'Times New Roman', 'Lato'
      size: number; // font size
      weight: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
      style?: 'normal' | 'italic';
      color: string; // hex code
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    }>;
    qr_code?: {
      x: number;
      y: number;
      size: number; // width and height of the QR code
      color?: string;
      background_color?: string;
    };
    // Deprecated fields, kept for potential migration
    theme?: string;
    colors?: Record<string, string>;
    logo_url?: string;
    background_image_url?: string;
    custom_css?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  form_config?: {
    required_fields?: string[];
    optional_fields?: string[];
    custom_questions?: Array<{
      id: string;
      type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
      question: string;
      options?: string[];
      required: boolean;
    }>;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  event_settings?: {
    max_capacity?: number;
    allow_self_registration?: boolean;
    registration_deadline?: string;
    approval_required?: boolean;
    waitlist_enabled?: boolean;
    email_notifications?: {
      reminder_enabled?: boolean;
      reminder_days_before?: number[];
      confirmation_template?: string;
    };
    social_sharing?: {
      enabled?: boolean;
      platforms?: string[];
      custom_message?: string;
    };
    [key: string]: any;
  };

  // Check-in functionality
  @Column({ default: true })
  check_in_enabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  check_in_starts_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  check_in_ends_at?: Date;

  // Metadata for extensibility
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    tags?: string[];
    category?: string;
    is_featured?: boolean;
    external_links?: Array<{
      platform: string;
      url: string;
    }>;
    analytics?: {
      tracking_id?: string;
      conversion_tracking?: boolean;
    };
    [key: string]: any;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.organized_events)
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @OneToMany(() => Tier, (tier) => tier.event, { cascade: true })
  tiers: Tier[];

  @OneToMany(() => Guest, (guest) => guest.event)
  guests: Guest[];

  @OneToMany(() => CheckinRecord, (checkinRecord) => checkinRecord.event)
  checkin_records: CheckinRecord[];

  @OneToMany(() => EventStaff, (eventStaff) => eventStaff.event)
  staff_assignments: EventStaff[];

  // Computed properties
  get has_paid_tiers(): boolean {
    return this.tiers?.some(tier => tier.price > 0) || false;
  }

  get total_capacity(): number {
    return this.tiers?.reduce((sum, tier) => sum + (tier.guest_limit || 0), 0) || 0;
  }

  get is_published(): boolean {
    return this.status === EventStatus.PUBLISHED || this.status === EventStatus.ACTIVE;
  }

  get can_be_published(): boolean {
    return this.platform_payment_status === PlatformPaymentStatus.PAID;
  }
} 