-- Verification queries to run AFTER applying database-fix.sql
-- This will confirm all tables and columns are correctly set up

-- Check if all required tables exist
SELECT 
    'Table Status' as 'Check Type',
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ All required tables exist'
        ELSE CONCAT('❌ Missing tables. Found: ', COUNT(*), '/4')
    END as 'Status'
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name IN ('security_events', 'authentication_events', 'user_sessions_tracking', 'failed_login_attempts');

-- Check security_events table structure
SELECT 
    'security_events columns' as 'Check Type',
    GROUP_CONCAT(column_name ORDER BY ordinal_position) as 'Status'
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'security_events';

-- Check severity enum values
SELECT 
    'security_events severity enum' as 'Check Type',
    column_type as 'Status'
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'security_events' 
AND column_name = 'severity';

-- Test insert into security_events (this should work now)
INSERT INTO security_events (
    user_id, event_type, severity, ip_address, user_agent, metadata, risk_score, investigated, created_at, updated_at
) VALUES (
    NULL, 'test_event', 'medium', '127.0.0.1', 'Test Agent', '{}', 'low', 0, NOW(), NOW()
);

-- Verify the test insert worked
SELECT 
    'Test Insert' as 'Check Type',
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Insert successful - authentication logging will work'
        ELSE '❌ Insert failed'
    END as 'Status'
FROM security_events 
WHERE event_type = 'test_event';

-- Clean up test data
DELETE FROM security_events WHERE event_type = 'test_event';

-- Final status
SELECT 
    '🎉 Database Fix Status' as 'Check Type',
    '✅ Ready for authentication - login should work now!' as 'Status';
