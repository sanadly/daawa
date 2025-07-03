-- Daawa Database Performance Testing Script
-- This script tests query performance for common operations

-- Enable timing and explain analyze
\timing on

-- Test 1: User Authentication Query (most frequent)
-- Expected: Index scan on email, sub-millisecond response
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, email, password_hash, role, is_active 
FROM users 
WHERE email = 'test@example.com' AND is_active = true;

-- Test 2: Event List for Organizer (dashboard view)
-- Expected: Index scan on organizer_id, fast response
EXPLAIN (ANALYZE, BUFFERS)
SELECT e.id, e.name, e.status, e.start_datetime, 
       COUNT(g.id) as guest_count,
       COUNT(CASE WHEN g.checkin_status = 'checked_in' THEN 1 END) as checked_in_count
FROM events e
LEFT JOIN guests g ON e.id = g.event_id
WHERE e.organizer_id = 'test-uuid'
GROUP BY e.id, e.name, e.status, e.start_datetime
ORDER BY e.start_datetime DESC;

-- Test 3: Guest List for Event (event management)
-- Expected: Index scan on event_id, efficient join
EXPLAIN (ANALYZE, BUFFERS)
SELECT g.id, g.name, g.email, g.rsvp_status, g.checkin_status,
       t.name as tier_name, t.price,
       pg.name as primary_guest_name
FROM guests g
JOIN tiers t ON g.tier_id = t.id
LEFT JOIN guests pg ON g.primary_guest_id = pg.id
WHERE g.event_id = 'test-event-uuid'
ORDER BY g.created_at;

-- Test 4: Check-in Statistics (reporting)
-- Expected: Composite index usage, fast aggregation
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  DATE_TRUNC('hour', cr.checkin_timestamp) as hour_bucket,
  COUNT(*) as checkins_per_hour,
  COUNT(DISTINCT cr.checked_in_by_user_id) as unique_staff
FROM checkin_records cr
WHERE cr.event_id = 'test-event-uuid'
  AND cr.checkin_timestamp >= CURRENT_DATE
GROUP BY DATE_TRUNC('hour', cr.checkin_timestamp)
ORDER BY hour_bucket;

-- Test 5: RSVP Status Summary (dashboard widget)
-- Expected: Composite index on event_id + rsvp_status
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  rsvp_status,
  COUNT(*) as count,
  SUM(CASE WHEN checkin_status = 'checked_in' THEN 1 ELSE 0 END) as checked_in
FROM guests
WHERE event_id = 'test-event-uuid'
GROUP BY rsvp_status;

-- Test 6: Staff Permissions Check (authorization)
-- Expected: Fast lookup via composite unique index
EXPLAIN (ANALYZE, BUFFERS)
SELECT es.role, es.permissions, es.is_active
FROM event_staff es
WHERE es.event_id = 'test-event-uuid' 
  AND es.user_id = 'test-user-uuid'
  AND es.is_active = true;

-- Test 7: Plus-N Guest Relationships (complex query)
-- Expected: Self-join performance with proper indexing
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  pg.id as primary_id,
  pg.name as primary_name,
  pg.email as primary_email,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', ag.id,
      'name', ag.name,
      'checkin_status', ag.checkin_status
    )
  ) as additional_guests
FROM guests pg
LEFT JOIN guests ag ON pg.id = ag.primary_guest_id
WHERE pg.event_id = 'test-event-uuid' 
  AND pg.is_primary = true
GROUP BY pg.id, pg.name, pg.email
ORDER BY pg.created_at;

-- Test 8: Event Timeline Analysis (analytics)
-- Expected: Efficient date range queries with proper indexing
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  DATE_TRUNC('day', start_datetime) as event_date,
  COUNT(*) as events_count,
  SUM(capacity_limit) as total_capacity,
  string_agg(name, ', ') as event_names
FROM events
WHERE start_datetime >= CURRENT_DATE - INTERVAL '30 days'
  AND start_datetime <= CURRENT_DATE + INTERVAL '90 days'
  AND status IN ('published', 'active')
GROUP BY DATE_TRUNC('day', start_datetime)
ORDER BY event_date;

-- Test 9: Large Event Guest Search (scalability test)
-- Expected: Efficient text search with proper indexing
EXPLAIN (ANALYZE, BUFFERS)
SELECT g.id, g.name, g.email, t.name as tier_name
FROM guests g
JOIN tiers t ON g.tier_id = t.id
WHERE g.event_id = 'large-event-uuid'
  AND (
    g.name ILIKE '%john%' 
    OR g.email ILIKE '%john%'
  )
ORDER BY g.name
LIMIT 20;

-- Test 10: Check-in Performance Simulation
-- Expected: Fast insertion with proper constraint checking
EXPLAIN (ANALYZE, BUFFERS)
INSERT INTO checkin_records (
  guest_id, 
  event_id, 
  checked_in_by_user_id,
  checkin_method,
  location
) VALUES (
  'test-guest-uuid',
  'test-event-uuid', 
  'test-staff-uuid',
  'qr_code',
  'Main Entrance'
) ON CONFLICT DO NOTHING;

-- Performance Benchmark Queries
-- These should complete in under specified times

-- Benchmark 1: User login (< 1ms)
SELECT 'User Login Benchmark' as test_name;
SELECT id, role FROM users WHERE email = 'organizer@test.com' AND is_active = true;

-- Benchmark 2: Event dashboard (< 50ms)
SELECT 'Event Dashboard Benchmark' as test_name;
SELECT 
  e.name,
  COUNT(g.id) as total_guests,
  COUNT(CASE WHEN g.rsvp_status = 'accepted' THEN 1 END) as accepted,
  COUNT(CASE WHEN g.checkin_status = 'checked_in' THEN 1 END) as checked_in
FROM events e
LEFT JOIN guests g ON e.id = g.event_id
WHERE e.organizer_id = 'test-organizer-uuid'
GROUP BY e.id, e.name;

-- Benchmark 3: Guest list (< 100ms for 1000 guests)
SELECT 'Guest List Benchmark' as test_name;
SELECT COUNT(*) FROM guests WHERE event_id = 'test-event-uuid';

-- Benchmark 4: Check-in operation (< 10ms)
SELECT 'Check-in Benchmark' as test_name;
UPDATE guests 
SET checkin_status = 'checked_in', 
    checkin_timestamp = NOW(),
    checked_in_by_user_id = 'test-staff-uuid'
WHERE id = 'test-guest-uuid' 
  AND checkin_status = 'not_checked_in';

-- Index Usage Analysis
-- Check if our indexes are being used effectively

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Table Size Analysis
-- Monitor table growth patterns

SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
  pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
  pg_size_pretty(pg_indexes_size(tablename::regclass)) as indexes_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Slow Query Identification
-- Find queries that need optimization

SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%events%' OR query LIKE '%guests%'
ORDER BY mean_time DESC
LIMIT 10;

\echo 'Performance testing complete!'
\echo 'Review EXPLAIN ANALYZE output for index usage and timing'
\echo 'Expected performance targets:'
\echo '  - User authentication: < 1ms'
\echo '  - Event dashboard: < 50ms'
\echo '  - Guest lists (1000 guests): < 100ms'
\echo '  - Check-in operations: < 10ms'
\echo '  - Search queries: < 200ms' 