# Daawa Database Schema Design

## Overview
This document outlines the relational database schema for the Daawa event management system. The schema supports user management, event creation, tiered pricing, guest management, and check-in functionality.

## Core Entities

### 1. Users
**Purpose**: Manages system users (event organizers, staff)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| name | VARCHAR(255) | NOT NULL | User's full name |
| role | ENUM | NOT NULL | User role (admin, organizer, staff) |
| preferred_language | VARCHAR(5) | DEFAULT 'en' | ISO language code |
| phone | VARCHAR(20) | | Contact phone number |
| avatar_url | VARCHAR(500) | | Profile picture URL |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| last_login_at | TIMESTAMP | | Last login timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Record update timestamp |

### 2. Events
**Purpose**: Core event information and configuration

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique event identifier |
| organizer_id | UUID | FOREIGN KEY (users.id) | Event organizer reference |
| name | VARCHAR(255) | NOT NULL | Event name |
| description | TEXT | | Event description |
| status | ENUM | DEFAULT 'draft' | Event status (draft, published, active, completed, cancelled) |
| tier_id | UUID | FOREIGN KEY (tiers.id) | Default tier for pricing |
| capacity_limit | INTEGER | | Maximum event capacity |
| primary_language | VARCHAR(5) | DEFAULT 'en' | Primary event language |
| default_plus_n | INTEGER | DEFAULT 0 | Default +N guest allowance |
| venue_name | VARCHAR(255) | | Event venue name |
| venue_address | TEXT | | Event venue address |
| start_datetime | TIMESTAMP | NOT NULL | Event start date and time |
| end_datetime | TIMESTAMP | NOT NULL | Event end date and time |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | Event timezone |
| design_config | JSONB | | Custom design settings |
| form_config | JSONB | | Custom form fields configuration |
| event_details | JSONB | | Additional event metadata |
| check_in_enabled | BOOLEAN | DEFAULT TRUE | Enable/disable check-in functionality |
| check_in_starts_at | TIMESTAMP | | Check-in start time |
| check_in_ends_at | TIMESTAMP | | Check-in end time |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Record update timestamp |

### 3. Tiers
**Purpose**: Event pricing tiers and guest limits

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique tier identifier |
| event_id | UUID | FOREIGN KEY (events.id) | Associated event |
| name | VARCHAR(100) | NOT NULL | Tier name (e.g., "VIP", "Standard") |
| description | TEXT | | Tier description |
| guest_limit | INTEGER | | Maximum guests per tier |
| price | DECIMAL(10,2) | DEFAULT 0.00 | Tier price |
| currency | VARCHAR(3) | DEFAULT 'USD' | ISO currency code |
| max_plus_n | INTEGER | DEFAULT 0 | Maximum +N guests allowed for this tier |
| is_active | BOOLEAN | DEFAULT TRUE | Tier availability |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Record update timestamp |

### 4. Guests
**Purpose**: Guest information and RSVP management

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique guest identifier |
| event_id | UUID | FOREIGN KEY (events.id) | Associated event |
| primary_guest_id | UUID | FOREIGN KEY (guests.id) | Reference to primary guest (for +N guests) |
| tier_id | UUID | FOREIGN KEY (tiers.id) | Guest's tier assignment |
| name | VARCHAR(255) | NOT NULL | Guest's full name |
| email | VARCHAR(255) | | Guest's email address |
| phone | VARCHAR(20) | | Guest's phone number |
| invite_status | ENUM | DEFAULT 'pending' | Invitation status (pending, sent, delivered, failed) |
| rsvp_status | ENUM | DEFAULT 'pending' | RSVP status (pending, accepted, declined, tentative) |
| checkin_status | ENUM | DEFAULT 'not_checked_in' | Check-in status (not_checked_in, checked_in, checked_out) |
| checkin_timestamp | TIMESTAMP | | Check-in timestamp |
| checked_in_by_user_id | UUID | FOREIGN KEY (users.id) | Staff member who checked in guest |
| allowed_plus_n_override | INTEGER | | Custom +N allowance override |
| custom_field_answers | JSONB | | Answers to custom form fields |
| is_primary | BOOLEAN | DEFAULT TRUE | Whether this is a primary guest |
| notes | TEXT | | Additional notes about the guest |
| dietary_restrictions | TEXT | | Dietary restrictions or preferences |
| accessibility_needs | TEXT | | Accessibility requirements |
| invite_sent_at | TIMESTAMP | | Invitation sent timestamp |
| rsvp_responded_at | TIMESTAMP | | RSVP response timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Record update timestamp |

### 5. CheckinRecords
**Purpose**: Detailed check-in history and audit trail

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique check-in record identifier |
| guest_id | UUID | FOREIGN KEY (guests.id) | Guest being checked in |
| event_id | UUID | FOREIGN KEY (events.id) | Associated event |
| checked_in_by_user_id | UUID | FOREIGN KEY (users.id) | Staff member performing check-in |
| checkin_timestamp | TIMESTAMP | DEFAULT NOW() | Check-in timestamp |
| checkout_timestamp | TIMESTAMP | | Check-out timestamp (if applicable) |
| present_additional_guest_ids | UUID[] | | Array of +N guest IDs present at check-in |
| checkin_method | ENUM | DEFAULT 'manual' | Check-in method (manual, qr_code, nfc, mobile) |
| location | VARCHAR(100) | | Check-in location/station |
| device_info | JSONB | | Device information used for check-in |
| notes | TEXT | | Check-in notes or comments |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

### 6. EventStaff
**Purpose**: Staff assignments to events with role-based permissions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique assignment identifier |
| event_id | UUID | FOREIGN KEY (events.id) | Associated event |
| user_id | UUID | FOREIGN KEY (users.id) | Staff member |
| role | ENUM | NOT NULL | Staff role (organizer, check_in_staff, viewer) |
| permissions | JSONB | | Specific permissions for this assignment |
| is_active | BOOLEAN | DEFAULT TRUE | Assignment status |
| assigned_at | TIMESTAMP | DEFAULT NOW() | Assignment timestamp |
| assigned_by_user_id | UUID | FOREIGN KEY (users.id) | User who made the assignment |

### 7. EventTemplates
**Purpose**: Reusable event templates for common configurations

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique template identifier |
| created_by_user_id | UUID | FOREIGN KEY (users.id) | Template creator |
| name | VARCHAR(255) | NOT NULL | Template name |
| description | TEXT | | Template description |
| template_config | JSONB | NOT NULL | Template configuration (tiers, forms, design) |
| is_public | BOOLEAN | DEFAULT FALSE | Whether template is publicly available |
| usage_count | INTEGER | DEFAULT 0 | Number of times template was used |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Record update timestamp |

## Relationships

### One-to-Many Relationships
- **Users → Events**: One user can organize multiple events
- **Events → Guests**: One event can have multiple guests
- - **Events → Tiers**: One event can have multiple pricing tiers
- **Users → CheckinRecords**: One user can perform multiple check-ins
- **Events → CheckinRecords**: One event can have multiple check-in records
- **Guests → CheckinRecords**: One guest can have multiple check-in records (for re-entry)
- **Events → EventStaff**: One event can have multiple staff assignments
- **Users → EventStaff**: One user can be assigned to multiple events
- **Users → EventTemplates**: One user can create multiple templates

### Self-Referencing Relationships
- **Guests → Guests**: Primary guest to +N guests relationship

### Many-to-Many Relationships
- **Events ↔ Users**: Through EventStaff table (many staff can work many events)

## Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'staff');

-- Event status
CREATE TYPE event_status AS ENUM ('draft', 'published', 'active', 'completed', 'cancelled');

-- Invitation status
CREATE TYPE invite_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- RSVP status
CREATE TYPE rsvp_status AS ENUM ('pending', 'accepted', 'declined', 'tentative');

-- Check-in status
CREATE TYPE checkin_status AS ENUM ('not_checked_in', 'checked_in', 'checked_out');

-- Check-in method
CREATE TYPE checkin_method AS ENUM ('manual', 'qr_code', 'nfc', 'mobile');

-- Staff roles
CREATE TYPE staff_role AS ENUM ('organizer', 'check_in_staff', 'viewer');
```

## Indexes

### Performance Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Events
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_events_tier_id ON events(tier_id);

-- Guests
CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_primary_guest_id ON guests(primary_guest_id);
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX idx_guests_checkin_status ON guests(checkin_status);
CREATE INDEX idx_guests_tier_id ON guests(tier_id);

-- Check-in Records
CREATE INDEX idx_checkin_records_guest_id ON checkin_records(guest_id);
CREATE INDEX idx_checkin_records_event_id ON checkin_records(event_id);
CREATE INDEX idx_checkin_records_timestamp ON checkin_records(checkin_timestamp);
CREATE INDEX idx_checkin_records_user_id ON checkin_records(checked_in_by_user_id);

-- Tiers
CREATE INDEX idx_tiers_event_id ON tiers(event_id);
CREATE INDEX idx_tiers_is_active ON tiers(is_active);

-- Event Staff
CREATE INDEX idx_event_staff_event_id ON event_staff(event_id);
CREATE INDEX idx_event_staff_user_id ON event_staff(user_id);
CREATE INDEX idx_event_staff_role ON event_staff(role);

-- Event Templates
CREATE INDEX idx_event_templates_created_by ON event_templates(created_by_user_id);
CREATE INDEX idx_event_templates_is_public ON event_templates(is_public);
```

### Composite Indexes
```sql
-- Unique constraints
CREATE UNIQUE INDEX idx_guests_event_email ON guests(event_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_event_staff_user_event ON event_staff(user_id, event_id);
CREATE UNIQUE INDEX idx_tiers_event_name ON tiers(event_id, name);

-- Performance composite indexes
CREATE INDEX idx_guests_event_checkin ON guests(event_id, checkin_status);
CREATE INDEX idx_guests_event_rsvp ON guests(event_id, rsvp_status);
CREATE INDEX idx_checkin_records_event_timestamp ON checkin_records(event_id, checkin_timestamp);
```

## Data Integrity Constraints

### Check Constraints
```sql
-- Events
ALTER TABLE events ADD CONSTRAINT chk_events_dates 
CHECK (end_datetime > start_datetime);

ALTER TABLE events ADD CONSTRAINT chk_events_capacity 
CHECK (capacity_limit > 0);

ALTER TABLE events ADD CONSTRAINT chk_events_plus_n 
CHECK (default_plus_n >= 0);

-- Tiers
ALTER TABLE tiers ADD CONSTRAINT chk_tiers_price 
CHECK (price >= 0);

ALTER TABLE tiers ADD CONSTRAINT chk_tiers_guest_limit 
CHECK (guest_limit > 0);

-- Guests
ALTER TABLE guests ADD CONSTRAINT chk_guests_plus_n_override 
CHECK (allowed_plus_n_override >= 0);

-- Check-in Records
ALTER TABLE checkin_records ADD CONSTRAINT chk_checkin_checkout_order 
CHECK (checkout_timestamp IS NULL OR checkout_timestamp > checkin_timestamp);
```

### Business Rules
1. **Primary Guest Validation**: A guest can only reference another guest in the same event as primary_guest_id
2. **+N Guest Limits**: Total +N guests for a primary guest cannot exceed tier limits or custom override
3. **Check-in Logic**: Guests can only be checked in during event check-in window
4. **Staff Permissions**: Event staff can only check in guests for events they're assigned to
5. **RSVP Logic**: Guests must RSVP before check-in (configurable per event)
6. **Tier Capacity**: Total guests per tier cannot exceed tier guest_limit

## Scaling Considerations

### Partitioning Strategy
- **CheckinRecords**: Partition by event_id or checkin_timestamp for large events
- **Guests**: Consider partitioning by event_id for events with 10,000+ guests

### Archive Strategy
- Archive completed events older than 2 years to separate tables
- Maintain audit trail for compliance requirements

### Read Replicas
- Use read replicas for reporting and analytics queries
- Separate check-in traffic from administrative operations

This schema design supports the core Daawa functionality while maintaining data integrity, performance, and scalability. 