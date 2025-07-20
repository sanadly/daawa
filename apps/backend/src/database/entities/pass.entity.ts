import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Guest } from './guest.entity';

export enum PassStatus {
  ACTIVE = 'active',
  VOIDED = 'voided',
  EXPIRED = 'expired',
}

@Entity('passes')
@Index(['guest_id'], { unique: true })
@Index(['access_token'], { unique: true })
export class Pass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  guest_id: string;

  @OneToOne(() => Guest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;

  @Column({ type: 'varchar', length: 255, unique: true })
  access_token: string;

  @Column({
    type: 'enum',
    enum: PassStatus,
    default: PassStatus.ACTIVE,
  })
  status: PassStatus;

  @Column({ type: 'timestamp', nullable: true })
  last_accessed_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
