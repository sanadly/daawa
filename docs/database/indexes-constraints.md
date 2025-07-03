# Database Indexes and Constraints

This document details all indexes and constraints implemented in the Daawa database schema for optimal performance and data integrity.

## Performance Indexes

### Users Table
```sql
CREATE INDEX "IDX_users_email" ON "users" ("email");
CREATE INDEX "IDX_users_role" ON "users" ("role");
CREATE INDEX "IDX_users_is_active" ON "users" ("is_active");
```

**Purpose**: 
- Email lookup for authentication and user searches
- Role-based filtering for admin operations
- Active user filtering for security and user management

### Events Table
```sql
CREATE INDEX "IDX_events_organizer_id" ON "events" ("organizer_id");
CREATE INDEX "IDX_events_status" ON "events" ("status");
CREATE INDEX "IDX_events_start_datetime" ON "events" ("start_datetime");
CREATE INDEX "IDX_events_tier_id" ON "events" ("tier_id");
```

**Purpose**: 
- Fast lookup of events by organizer
- Status-based filtering (draft, published, active, etc.)
- Chronological event ordering and date range queries
- Default tier reference lookup

### Tiers Table
```sql
CREATE INDEX "IDX_tiers_event_id" ON "tiers" ("event_id");
CREATE INDEX "IDX_tiers_is_active" ON "tiers" ("is_active");
```

**Purpose**: 
- Fast retrieval of all tiers for an event
- Active tier filtering for pricing displays

### Guests Table
```sql
CREATE INDEX "IDX_guests_event_id" ON "guests" ("event_id");
CREATE INDEX "IDX_guests_primary_guest_id" ON "guests" ("primary_guest_id");
CREATE INDEX "IDX_guests_email" ON "guests" ("email");
CREATE INDEX "IDX_guests_rsvp_status" ON "guests" ("rsvp_status");
CREATE INDEX "IDX_guests_checkin_status" ON "guests" ("checkin_status");
CREATE INDEX "IDX_guests_tier_id" ON "guests" ("tier_id");
```

**Purpose**: 
- Event guest list retrieval
- +N guest relationship queries
- Guest lookup by email
- RSVP status filtering and reporting
- Check-in status tracking and reports
- Tier-based guest categorization

### Check-in Records Table
```sql
CREATE INDEX "IDX_checkin_records_guest_id" ON "checkin_records" ("guest_id");
CREATE INDEX "IDX_checkin_records_event_id" ON "checkin_records" ("event_id");
CREATE INDEX "IDX_checkin_records_timestamp" ON "checkin_records" ("checkin_timestamp");
CREATE INDEX "IDX_checkin_records_user_id" ON "checkin_records" ("checked_in_by_user_id");
```

**Purpose**: 
- Guest check-in history lookup
- Event check-in activity reports
- Chronological check-in analysis
- Staff performance tracking

### Event Staff Table
```sql
CREATE INDEX "IDX_event_staff_event_id" ON "event_staff" ("event_id");
CREATE INDEX "IDX_event_staff_user_id" ON "event_staff" ("user_id");
CREATE INDEX "IDX_event_staff_role" ON "event_staff" ("role");
```

**Purpose**: 
- Event staff assignment lookup
- User's event assignments
- Role-based permission queries

### Event Templates Table
```sql
CREATE INDEX "IDX_event_templates_created_by" ON "event_templates" ("created_by_user_id");
CREATE INDEX "IDX_event_templates_is_public" ON "event_templates" ("is_public");
```

**Purpose**: 
- User's template management
- Public template discovery

## Composite Indexes

### Unique Constraints
```sql
CREATE UNIQUE INDEX "IDX_guests_event_email" ON "guests" ("event_id", "email") WHERE "email" IS NOT NULL;
CREATE UNIQUE INDEX "IDX_event_staff_user_event" ON "event_staff" ("user_id", "event_id");
CREATE UNIQUE INDEX "IDX_tiers_event_name" ON "tiers" ("event_id", "name");
```

**Purpose**: 
- Prevent duplicate guest emails within an event
- Ensure one staff assignment per user per event
- Unique tier names within each event

### Performance Composite Indexes
```sql
CREATE INDEX "IDX_guests_event_checkin" ON "guests" ("event_id", "checkin_status");
CREATE INDEX "IDX_guests_event_rsvp" ON "guests" ("event_id", "rsvp_status");
CREATE INDEX "IDX_checkin_records_event_timestamp" ON "checkin_records" ("event_id", "checkin_timestamp");
```

**Purpose**: 
- Fast event check-in status queries
- Efficient RSVP reporting by event
- Optimized event check-in timeline analysis

## Data Integrity Constraints

### Check Constraints

#### Events Table
```sql
CONSTRAINT "chk_events_dates" CHECK ("end_datetime" > "start_datetime")
CONSTRAINT "chk_events_capacity" CHECK ("capacity_limit" > 0)
CONSTRAINT "chk_events_plus_n" CHECK ("default_plus_n" >= 0)
```

**Purpose**: 
- Ensure logical event time ordering
- Prevent invalid capacity limits
- Validate +N guest allowances

#### Tiers Table
```sql
CONSTRAINT "chk_tiers_price" CHECK ("price" >= 0)
CONSTRAINT "chk_tiers_guest_limit" CHECK ("guest_limit" > 0)
```

**Purpose**: 
- Prevent negative pricing
- Ensure meaningful guest limits

#### Guests Table
```sql
CONSTRAINT "chk_guests_plus_n_override" CHECK ("allowed_plus_n_override" >= 0)
```

**Purpose**: 
- Validate custom +N allowances

#### Check-in Records Table
```sql
CONSTRAINT "chk_checkin_checkout_order" CHECK ("checkout_timestamp" IS NULL OR "checkout_timestamp" > "checkin_timestamp")
```

**Purpose**: 
- Ensure logical check-in/check-out timing

### Foreign Key Constraints

#### Cascading Deletes
- **Tier → Event**: `ON DELETE CASCADE` - When event is deleted, remove all tiers
- **Guest → Event**: `ON DELETE CASCADE` - When event is deleted, remove all guests
- **Guest → Guest** (Primary): `ON DELETE CASCADE` - When primary guest is deleted, remove +N guests
- **CheckinRecord → Event/Guest**: `ON DELETE CASCADE` - Clean up check-in records
- **EventStaff → Event**: `ON DELETE CASCADE` - Remove staff assignments when event deleted

#### Restricted Deletes
- **Event → User** (Organizer): `ON DELETE RESTRICT` - Cannot delete user who organized events
- **Guest → Tier**: `ON DELETE RESTRICT` - Cannot delete tier with assigned guests
- **CheckinRecord → User**: `ON DELETE RESTRICT` - Cannot delete user who performed check-ins

#### Null on Delete
- **Guest → User** (Checked in by): `ON DELETE SET NULL` - Preserve check-in record if staff user deleted
- **Event → Tier** (Default tier): `ON DELETE SET NULL` - Allow tier deletion without affecting event

## Index Usage Patterns

### High-Frequency Queries
1. **Guest List by Event**: `IDX_guests_event_id`
2. **User Authentication**: `IDX_users_email`
3. **Event Check-in Status**: `IDX_guests_event_checkin`
4. **RSVP Reporting**: `IDX_guests_event_rsvp`
5. **Staff Permissions**: `IDX_event_staff_event_id` + `IDX_event_staff_role`

### Analytics Queries
1. **Check-in Timeline**: `IDX_checkin_records_event_timestamp`
2. **Event Performance**: `IDX_events_start_datetime` + `IDX_events_status`
3. **Tier Analysis**: `IDX_tiers_event_id` + `IDX_guests_tier_id`

### Administrative Queries
1. **User Management**: `IDX_users_role` + `IDX_users_is_active`
2. **Event Management**: `IDX_events_organizer_id` + `IDX_events_status`
3. **Template Management**: `IDX_event_templates_created_by` + `IDX_event_templates_is_public`

## Performance Monitoring

### Query Optimization
- Monitor slow queries using PostgreSQL's `pg_stat_statements`
- Use `EXPLAIN ANALYZE` for query plan analysis
- Consider additional partial indexes for specific query patterns

### Index Maintenance
- Regular `REINDEX` operations during maintenance windows
- Monitor index bloat using `pgstattuple`
- Update table statistics with `ANALYZE` after bulk operations

### Scaling Considerations
- Partition large tables (guests, checkin_records) by event_id for events with 10,000+ guests
- Consider read replicas for reporting queries
- Archive old events to maintain performance

This indexing strategy balances query performance with storage overhead, optimizing for the most common access patterns in the Daawa event management system. 