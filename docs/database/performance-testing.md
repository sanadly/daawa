# Database Performance Testing Guide

This document outlines the performance testing strategy and benchmarks for the Daawa database schema.

## Performance Testing Overview

The Daawa database is designed to handle high-concurrency event management operations efficiently. Our performance testing focuses on the most critical user paths and ensures scalability for large events.

## Testing Environment Setup

### Prerequisites
- PostgreSQL 14+ with `pg_stat_statements` extension enabled
- Sufficient test data (minimum 1000 guests per event for meaningful tests)
- Performance monitoring tools configured

### Enable Performance Monitoring
```sql
-- Enable query statistics collection
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configure PostgreSQL for performance testing
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Restart PostgreSQL after making these changes
```

## Performance Benchmarks

### Critical Path Operations

| Operation | Target Time | Index Used | Notes |
|-----------|-------------|------------|-------|
| User Authentication | < 1ms | `IDX_users_email` | Most frequent operation |
| Event Dashboard Load | < 50ms | `IDX_events_organizer_id` | User's event overview |
| Guest List (1000 guests) | < 100ms | `IDX_guests_event_id` | Event management view |
| Check-in Operation | < 10ms | Multiple indexes | Real-time operation |
| RSVP Status Summary | < 25ms | `IDX_guests_event_rsvp` | Dashboard widget |
| Staff Permission Check | < 5ms | `IDX_event_staff_user_event` | Authorization check |
| Guest Search | < 200ms | Text search indexes | Search functionality |

### Scalability Targets

| Scale | Guests per Event | Concurrent Users | Expected Response Time |
|-------|------------------|------------------|------------------------|
| Small | 1-100 | 5-10 | < 50ms |
| Medium | 100-1,000 | 10-25 | < 100ms |
| Large | 1,000-5,000 | 25-50 | < 200ms |
| Enterprise | 5,000-15,000 | 50-100 | < 500ms |

## Test Categories

### 1. Authentication & Authorization Tests

```sql
-- User login performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, email, password_hash, role, is_active 
FROM users 
WHERE email = ? AND is_active = true;

-- Staff permission verification
EXPLAIN (ANALYZE, BUFFERS)
SELECT role, permissions, is_active
FROM event_staff 
WHERE event_id = ? AND user_id = ? AND is_active = true;
```

**Expected Results:**
- Index Scan on `users(email)`
- Unique index scan on `event_staff(user_id, event_id)`
- Sub-millisecond response times

### 2. Event Management Tests

```sql
-- Organizer's event dashboard
EXPLAIN (ANALYZE, BUFFERS)
SELECT e.id, e.name, e.status, e.start_datetime,
       COUNT(g.id) as guest_count,
       COUNT(CASE WHEN g.checkin_status = 'checked_in' THEN 1 END) as checked_in_count
FROM events e
LEFT JOIN guests g ON e.id = g.event_id
WHERE e.organizer_id = ?
GROUP BY e.id, e.name, e.status, e.start_datetime
ORDER BY e.start_datetime DESC;
```

**Expected Results:**
- Index Scan on `events(organizer_id)`
- Hash Join with `guests(event_id)`
- Response time < 50ms for typical organizer (10-20 events)

### 3. Guest Management Tests

```sql
-- Guest list with tier information
EXPLAIN (ANALYZE, BUFFERS)
SELECT g.id, g.name, g.email, g.rsvp_status, g.checkin_status,
       t.name as tier_name, t.price
FROM guests g
JOIN tiers t ON g.tier_id = t.id
WHERE g.event_id = ?
ORDER BY g.created_at;
```

**Expected Results:**
- Index Scan on `guests(event_id)`
- Nested Loop Join with `tiers`
- Response time < 100ms for 1000 guests

### 4. Check-in Performance Tests

```sql
-- Real-time check-in operation
BEGIN;
UPDATE guests 
SET checkin_status = 'checked_in',
    checkin_timestamp = NOW(),
    checked_in_by_user_id = ?
WHERE id = ? AND checkin_status = 'not_checked_in';

INSERT INTO checkin_records (
  guest_id, event_id, checked_in_by_user_id,
  checkin_method, location
) VALUES (?, ?, ?, 'qr_code', 'Main Entrance');
COMMIT;
```

**Expected Results:**
- Primary key lookup for guest update
- Fast insertion with constraint checking
- Total transaction time < 10ms

### 5. Reporting & Analytics Tests

```sql
-- RSVP status distribution
EXPLAIN (ANALYZE, BUFFERS)
SELECT rsvp_status, COUNT(*) as count
FROM guests
WHERE event_id = ?
GROUP BY rsvp_status;

-- Check-in timeline analysis
EXPLAIN (ANALYZE, BUFFERS)
SELECT DATE_TRUNC('hour', checkin_timestamp) as hour_bucket,
       COUNT(*) as checkins_per_hour
FROM checkin_records
WHERE event_id = ? AND checkin_timestamp >= CURRENT_DATE
GROUP BY DATE_TRUNC('hour', checkin_timestamp)
ORDER BY hour_bucket;
```

**Expected Results:**
- Index usage on composite keys
- Efficient aggregation operations
- Response time < 200ms for complex analytics

## Performance Monitoring

### Key Metrics to Monitor

1. **Query Performance**
   ```sql
   SELECT query, calls, total_time, mean_time, rows
   FROM pg_stat_statements
   WHERE query LIKE '%events%' OR query LIKE '%guests%'
   ORDER BY mean_time DESC;
   ```

2. **Index Usage**
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
   FROM pg_stat_user_indexes
   WHERE schemaname = 'public'
   ORDER BY idx_scan DESC;
   ```

3. **Table Growth**
   ```sql
   SELECT tablename,
          pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
   FROM pg_tables 
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(tablename::regclass) DESC;
   ```

### Performance Alerts

Set up monitoring for these conditions:

- **Slow Queries**: Any query taking > 1 second
- **Index Misses**: Queries doing sequential scans on large tables
- **Lock Contention**: Blocked queries during check-in operations
- **Connection Pooling**: High connection count during peak usage
- **Storage Growth**: Rapid table size increases

## Load Testing Scenarios

### Scenario 1: Event Launch Day
- **Profile**: 500 concurrent guests RSVPing
- **Duration**: 30 minutes peak load
- **Expected**: < 200ms response time for RSVP operations

### Scenario 2: Check-in Rush
- **Profile**: 100 concurrent check-ins for large event
- **Duration**: 45 minutes before event start
- **Expected**: < 10ms per check-in operation

### Scenario 3: Dashboard Usage
- **Profile**: 50 organizers viewing dashboards simultaneously
- **Duration**: Normal business hours
- **Expected**: < 100ms dashboard load times

### Scenario 4: Search & Filter Operations
- **Profile**: Staff searching guest lists during event
- **Duration**: Event duration (4-6 hours)
- **Expected**: < 300ms for complex searches

## Optimization Guidelines

### Query Optimization
1. **Always use appropriate indexes** for WHERE clauses
2. **Limit result sets** with proper pagination
3. **Use prepared statements** for repeated queries
4. **Avoid N+1 queries** with proper JOIN strategies
5. **Consider partial indexes** for filtered datasets

### Index Maintenance
1. **Monitor index usage** and remove unused indexes
2. **Reindex periodically** during maintenance windows
3. **Update table statistics** after bulk operations
4. **Consider covering indexes** for frequent query patterns

### Application-Level Optimizations
1. **Implement proper connection pooling**
2. **Use database transactions appropriately**
3. **Cache frequently accessed data**
4. **Implement read replicas** for reporting queries
5. **Batch operations** where possible

## Troubleshooting Common Performance Issues

### Slow Authentication Queries
- **Symptom**: Login taking > 100ms
- **Diagnosis**: Check `IDX_users_email` usage
- **Solution**: Ensure email index is being used, consider reindexing

### Event Dashboard Timeouts
- **Symptom**: Dashboard taking > 5 seconds
- **Diagnosis**: Large number of events or guests
- **Solution**: Implement pagination, optimize aggregation queries

### Check-in Bottlenecks
- **Symptom**: Check-in operations failing or slow
- **Diagnosis**: Database lock contention
- **Solution**: Optimize transaction scope, implement queue system

### Search Performance Issues
- **Symptom**: Guest search taking > 1 second
- **Diagnosis**: Full table scans on guest names/emails
- **Solution**: Implement full-text search indexes, consider Elasticsearch

## Performance Testing Automation

### Continuous Performance Testing
```bash
# Run performance test suite
npm run test:performance

# Generate performance report
npm run perf:report

# Run load tests
npm run test:load
```

### CI/CD Integration
- **Performance regression tests** on every deployment
- **Load testing** for major releases
- **Database migration performance** validation
- **Index effectiveness** monitoring

This performance testing strategy ensures the Daawa system can handle real-world event management scenarios efficiently and scale with growing user demands. 