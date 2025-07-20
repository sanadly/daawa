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
import { Guest } from './guest.entity';

export enum TierType {
  FREE = 'free',
  PAID = 'paid',
  VIP = 'vip',
  SPONSOR = 'sponsor',
  STUDENT = 'student',
  EARLY_BIRD = 'early_bird',
}

@Entity('tiers')
@Index(['event_id'])
@Index(['is_active'])
@Index(['tier_type'])
@Index(['event_id', 'name'], { unique: true })
@Index(['event_id', 'sort_order'])
@Check('chk_tiers_price', 'price >= 0')
@Check('chk_tiers_guest_limit', 'guest_limit IS NULL OR guest_limit > 0')
@Check('chk_tiers_max_plus_n', 'max_plus_n >= 0')
export class Tier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TierType,
    default: TierType.FREE,
  })
  tier_type: TierType;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  price: number;

  @Column({ length: 3, default: 'LYD' })
  currency: string;

  // Capacity management
  @Column({ type: 'int', nullable: true })
  guest_limit?: number;

  @Column({ type: 'int', default: 0 })
  registered_count: number;

  @Column({ type: 'int', default: 0 })
  max_plus_n: number;

  // Availability
  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  sale_starts_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sale_ends_at?: Date;

  // Organization
  @Column({ type: 'int', default: 0 })
  sort_order: number;

  // Tier-specific settings
  @Column({ type: 'jsonb', nullable: true })
  tier_settings?: {
    benefits?: string[];
    restrictions?: string[];
    includes_meal?: boolean;
    includes_merchandise?: boolean;
    parking_included?: boolean;
    early_access?: boolean;
    special_seating?: boolean;
    meet_and_greet?: boolean;
    [key: string]: any;
  };

  // Access control
  @Column({ type: 'jsonb', nullable: true })
  access_config?: {
    requires_approval?: boolean;
    invite_only?: boolean;
    access_codes?: string[];
    min_age?: number;
    max_age?: number;
    allowed_domains?: string[];
    [key: string]: any;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Event, (event) => event.tiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @OneToMany(() => Guest, (guest) => guest.tier)
  guests: Guest[];

  // Computed properties
  get is_sold_out(): boolean {
    return this.guest_limit !== null && this.registered_count >= this.guest_limit;
  }

  get is_available(): boolean {
    if (!this.is_active) return false;
    if (this.is_sold_out) return false;
    
    const now = new Date();
    if (this.sale_starts_at && now < this.sale_starts_at) return false;
    if (this.sale_ends_at && now > this.sale_ends_at) return false;
    
    return true;
  }

  get remaining_spots(): number | null {
    if (this.guest_limit === null) return null;
    return Math.max(0, this.guest_limit - this.registered_count);
  }

  get is_free(): boolean {
    return this.price === 0;
  }
} 