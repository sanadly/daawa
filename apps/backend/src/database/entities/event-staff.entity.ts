import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from './user.entity';

export enum StaffRole {
  ORGANIZER = 'organizer',
  CHECK_IN_STAFF = 'check_in_staff',
  VIEWER = 'viewer',
}

@Entity('event_staff')
@Index(['event_id'])
@Index(['user_id'])
@Index(['role'])
@Index(['user_id', 'event_id'], { unique: true })
export class EventStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({
    type: 'enum',
    enum: StaffRole,
  })
  role: StaffRole;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: any;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  assigned_at: Date;

  @Column({ type: 'uuid' })
  assigned_by_user_id: string;

  // Relationships
  @ManyToOne(() => Event, (event) => event.staff_assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, (user) => user.staff_assignments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.assigned_staff)
  @JoinColumn({ name: 'assigned_by_user_id' })
  assigned_by_user: User;
} 