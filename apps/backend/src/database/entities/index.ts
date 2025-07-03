// Import all entities
import { User, UserRole } from './user.entity';
import { UserActivity, ActivityType } from './user-activity.entity';
import { PasswordHistory } from './password-history.entity';
import { Event, EventStatus } from './event.entity';
import { Tier } from './tier.entity';
import { Guest, InviteStatus, RsvpStatus, CheckinStatus } from './guest.entity';
import { CheckinRecord, CheckinMethod } from './checkin-record.entity';
import { EventStaff, StaffRole } from './event-staff.entity';
import { EventTemplate } from './event-template.entity';
import { PasswordResetToken } from './password-reset-token.entity';

// Export all entities
export { User, UserRole } from './user.entity';
export { UserActivity, ActivityType } from './user-activity.entity';
export { PasswordHistory } from './password-history.entity';
export { Event, EventStatus } from './event.entity';
export { Tier } from './tier.entity';
export { Guest, InviteStatus, RsvpStatus, CheckinStatus } from './guest.entity';
export { CheckinRecord, CheckinMethod } from './checkin-record.entity';
export { EventStaff, StaffRole } from './event-staff.entity';
export { EventTemplate } from './event-template.entity';
export { PasswordResetToken } from './password-reset-token.entity';

// Export all entities as array for TypeORM configuration
export const entities = [
  User,
  UserActivity,
  PasswordHistory,
  Event,
  Tier,
  Guest,
  CheckinRecord,
  EventStaff,
  EventTemplate,
  PasswordResetToken,
]; 