# Database Relationship Mappings

This document details all entity relationships implemented in the Daawa database schema using TypeORM decorators.

## Relationship Overview

The Daawa schema implements a comprehensive relationship model supporting event management, guest tracking, and staff coordination. All relationships are properly mapped with TypeORM decorators to ensure data integrity and optimal query performance.

## Core Entity Relationships

### User Entity Relationships

```typescript
// User → Events (One-to-Many)
@OneToMany(() => Event, (event) => event.organizer)
organized_events: Event[];

// User → CheckinRecords (One-to-Many) - as performer
@OneToMany(() => CheckinRecord, (checkinRecord) => checkinRecord.checked_in_by_user)
performed_checkins: CheckinRecord[];

// User → EventStaff (One-to-Many) - as staff member
@OneToMany(() => EventStaff, (eventStaff) => eventStaff.user)
staff_assignments: EventStaff[];

// User → EventTemplates (One-to-Many) - as creator
@OneToMany(() => EventTemplate, (template) => template.created_by_user)
created_templates: EventTemplate[];

// User → Guests (One-to-Many) - as check-in performer
@OneToMany(() => Guest, (guest) => guest.checked_in_by_user)
checked_in_guests: Guest[];

// User → EventStaff (One-to-Many) - as assigner
@OneToMany(() => EventStaff, (eventStaff) => eventStaff.assigned_by_user)
assigned_staff: EventStaff[];
```

**Relationship Types:**
- **Organizer**: One user can organize multiple events
- **Check-in Performer**: One user can perform check-ins for multiple guests/records
- **Staff Member**: One user can be assigned to multiple events as staff
- **Template Creator**: One user can create multiple event templates
- **Staff Assigner**: One user can assign multiple staff members to events

### Event Entity Relationships

```typescript
// Event → User (Many-to-One) - organizer
@ManyToOne(() => User, (user) => user.organized_events)
@JoinColumn({ name: 'organizer_id' })
organizer: User;

// Event → Tier (Many-to-One) - default tier
@ManyToOne(() => Tier, { nullable: true })
@JoinColumn({ name: 'tier_id' })
default_tier?: Tier;

// Event → Tiers (One-to-Many) - all tiers
@OneToMany(() => Tier, (tier) => tier.event, { cascade: true })
tiers: Tier[];

// Event → Guests (One-to-Many)
@OneToMany(() => Guest, (guest) => guest.event)
guests: Guest[];

// Event → CheckinRecords (One-to-Many)
@OneToMany(() => CheckinRecord, (checkinRecord) => checkinRecord.event)
checkin_records: CheckinRecord[];

// Event → EventStaff (One-to-Many)
@OneToMany(() => EventStaff, (eventStaff) => eventStaff.event)
staff_assignments: EventStaff[];
```

**Relationship Types:**
- **Organizer**: Event belongs to one user (organizer)
- **Default Tier**: Event can have one default tier for pricing
- **Tiers**: Event can have multiple pricing tiers
- **Guests**: Event can have multiple guests
- **Check-in Records**: Event tracks multiple check-in activities
- **Staff Assignments**: Event can have multiple staff members

### Tier Entity Relationships

```typescript
// Tier → Event (Many-to-One)
@ManyToOne(() => Event, (event) => event.tiers, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'event_id' })
event: Event;

// Tier → Guests (One-to-Many)
@OneToMany(() => Guest, (guest) => guest.tier)
guests: Guest[];
```

**Relationship Types:**
- **Event**: Tier belongs to one event
- **Guests**: Tier can categorize multiple guests

### Guest Entity Relationships

```typescript
// Guest → Event (Many-to-One)
@ManyToOne(() => Event, (event) => event.guests, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'event_id' })
event: Event;

// Guest → Guest (Self-referencing Many-to-One) - primary guest relationship
@ManyToOne(() => Guest, (guest) => guest.additional_guests, { nullable: true })
@JoinColumn({ name: 'primary_guest_id' })
primary_guest?: Guest;

// Guest → Guests (Self-referencing One-to-Many) - additional guests
@OneToMany(() => Guest, (guest) => guest.primary_guest)
additional_guests: Guest[];

// Guest → Tier (Many-to-One)
@ManyToOne(() => Tier, (tier) => tier.guests)
@JoinColumn({ name: 'tier_id' })
tier: Tier;

// Guest → User (Many-to-One) - checked in by
@ManyToOne(() => User, (user) => user.checked_in_guests, { nullable: true })
@JoinColumn({ name: 'checked_in_by_user_id' })
checked_in_by_user?: User;

// Guest → CheckinRecords (One-to-Many)
@OneToMany(() => CheckinRecord, (checkinRecord) => checkinRecord.guest)
checkin_records: CheckinRecord[];
```

**Relationship Types:**
- **Event**: Guest belongs to one event
- **Primary Guest**: +N guests reference their primary guest (self-referencing)
- **Additional Guests**: Primary guests can have multiple +N guests
- **Tier**: Guest is categorized under one tier
- **Check-in User**: Guest can be checked in by one user
- **Check-in Records**: Guest can have multiple check-in records

### CheckinRecord Entity Relationships

```typescript
// CheckinRecord → Guest (Many-to-One)
@ManyToOne(() => Guest, (guest) => guest.checkin_records, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'guest_id' })
guest: Guest;

// CheckinRecord → Event (Many-to-One)
@ManyToOne(() => Event, (event) => event.checkin_records, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'event_id' })
event: Event;

// CheckinRecord → User (Many-to-One) - performer
@ManyToOne(() => User, (user) => user.performed_checkins)
@JoinColumn({ name: 'checked_in_by_user_id' })
checked_in_by_user: User;
```

**Relationship Types:**
- **Guest**: Check-in record belongs to one guest
- **Event**: Check-in record belongs to one event
- **Performer**: Check-in record performed by one user

### EventStaff Entity Relationships

```typescript
// EventStaff → Event (Many-to-One)
@ManyToOne(() => Event, (event) => event.staff_assignments, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'event_id' })
event: Event;

// EventStaff → User (Many-to-One) - staff member
@ManyToOne(() => User, (user) => user.staff_assignments)
@JoinColumn({ name: 'user_id' })
user: User;

// EventStaff → User (Many-to-One) - assigner
@ManyToOne(() => User, (user) => user.assigned_staff)
@JoinColumn({ name: 'assigned_by_user_id' })
assigned_by_user: User;
```

**Relationship Types:**
- **Event**: Staff assignment belongs to one event
- **Staff Member**: Assignment references one user as staff
- **Assigner**: Assignment tracked by one user who made it

### EventTemplate Entity Relationships

```typescript
// EventTemplate → User (Many-to-One) - creator
@ManyToOne(() => User, (user) => user.created_templates)
@JoinColumn({ name: 'created_by_user_id' })
created_by_user: User;
```

**Relationship Types:**
- **Creator**: Template created by one user

## Cascade and Deletion Behavior

### CASCADE Operations
- **Event Deletion**: Removes all tiers, guests, check-in records, and staff assignments
- **Tier Deletion**: Handled by foreign key constraints (RESTRICT for guests)
- **Guest Deletion**: Removes all check-in records for that guest
- **Primary Guest Deletion**: Removes all associated +N guests

### RESTRICT Operations
- **User Deletion**: Prevented if user has organized events or performed check-ins
- **Tier Deletion**: Prevented if tier has assigned guests

### SET NULL Operations
- **User Deletion**: Check-in records preserve history with null user reference
- **Default Tier Deletion**: Event continues without default tier reference

## Self-Referencing Relationship: Guest +N System

```typescript
// Primary guest can have multiple additional guests
primary_guest?: Guest;           // Many-to-One (nullable)
additional_guests: Guest[];      // One-to-Many
```

**Implementation Details:**
- Primary guests have `primary_guest_id = null`
- +N guests reference their primary guest via `primary_guest_id`
- Business logic enforces +N limits based on tier and overrides
- Cascade deletion ensures +N guests are removed with primary guest

## Many-to-Many Relationships (via Junction Table)

### Events ↔ Users (via EventStaff)
```typescript
// Implemented through EventStaff entity
// Allows multiple staff roles per user per event
// Tracks assignment metadata (role, permissions, assigned_by)
```

**Key Features:**
- Role-based assignments (organizer, check_in_staff, viewer)
- Permission granularity via JSONB field
- Audit trail with assigned_by_user_id and assigned_at
- Unique constraint prevents duplicate assignments

## Relationship Query Patterns

### Loading Related Data

```typescript
// Load event with all relationships
const event = await eventRepository.find({
  relations: [
    'organizer',
    'tiers',
    'guests',
    'guests.tier',
    'guests.primary_guest',
    'guests.additional_guests',
    'checkin_records',
    'staff_assignments',
    'staff_assignments.user'
  ]
});

// Load user with organized events
const user = await userRepository.find({
  relations: ['organized_events', 'staff_assignments']
});

// Load guest with +N guests
const primaryGuest = await guestRepository.find({
  where: { is_primary: true },
  relations: ['additional_guests', 'tier']
});
```

### Efficient Queries

```typescript
// Count guests by event
const guestCount = await guestRepository
  .createQueryBuilder('guest')
  .where('guest.event_id = :eventId', { eventId })
  .getCount();

// Get check-in statistics
const checkinStats = await guestRepository
  .createQueryBuilder('guest')
  .select('guest.checkin_status, COUNT(*) as count')
  .where('guest.event_id = :eventId', { eventId })
  .groupBy('guest.checkin_status')
  .getRawMany();
```

## Relationship Validation

### Business Rules Enforced by Relationships
1. **Event Integrity**: All guests, tiers, and check-ins belong to valid events
2. **User Permissions**: Only assigned staff can check in guests for specific events
3. **Guest Hierarchy**: +N guests properly reference primary guests within same event
4. **Tier Consistency**: Guests are assigned to tiers within their event
5. **Audit Trail**: All check-ins and staff assignments tracked to specific users

### Data Consistency
- Foreign key constraints ensure referential integrity
- Cascade deletes maintain consistency during cleanup operations
- Unique constraints prevent duplicate relationships
- Check constraints validate business logic at database level

This relationship mapping provides a robust foundation for the Daawa event management system, ensuring data integrity while supporting complex queries and business logic. 