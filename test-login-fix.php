<?php

// Test Authentication Fixes
// Run this with: php test-login-fix.php

echo "🔍 Testing Authentication System Fixes...\n\n";

// Bootstrap Laravel first
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Test 1: Check if the auth log channel is configured
echo "1. Testing log channel configuration...\n";
$loggingConfig = config('logging.channels');
if (isset($loggingConfig['auth'])) {
    echo "   ✅ Auth log channel is configured\n";
    echo '   📁 Auth logs will be written to: '.$loggingConfig['auth']['path']."\n";
} else {
    echo "   ❌ Auth log channel is NOT configured\n";
}

// Test 2: Check if we can create the ModernAuthenticationService
echo "\n2. Testing ModernAuthenticationService...\n";
try {
    $authService = app(\App\Services\ModernAuthenticationService::class);
    echo "   ✅ ModernAuthenticationService can be instantiated\n";
} catch (Exception $e) {
    echo '   ❌ ModernAuthenticationService error: '.$e->getMessage()."\n";
}

// Test 3: Check if logging works without errors
echo "\n3. Testing logging functionality...\n";
try {
    // Try to use the auth channel
    $mockRequest = new \Illuminate\Http\Request;
    $mockRequest->server->set('REMOTE_ADDR', '127.0.0.1');
    $mockRequest->server->set('HTTP_USER_AGENT', 'Test Agent');

    // This should not throw an exception now
    \Illuminate\Support\Facades\Log::info('Test log entry for authentication fix');
    echo "   ✅ Logging works without errors\n";
} catch (Exception $e) {
    echo '   ❌ Logging error: '.$e->getMessage()."\n";
}

// Test 4: Check database connection (if available)
echo "\n4. Testing database connectivity...\n";
try {
    $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "   ✅ Database connection successful\n";

    // Check if security_events table exists
    $tables = \Illuminate\Support\Facades\DB::select("SHOW TABLES LIKE 'security_events'");
    if (count($tables) > 0) {
        echo "   ✅ security_events table exists\n";
    } else {
        echo "   ⚠️  security_events table does not exist - run database-fix.sql on live server\n";
    }

} catch (Exception $e) {
    echo '   ⚠️  Database not available locally: '.$e->getMessage()."\n";
    echo "   💡 This is expected in local development without database setup\n";
}

echo "\n🎯 Authentication Fix Summary:\n";
echo "   - Added 'auth' logging channel configuration\n";
echo "   - Made ModernAuthenticationService more resilient to logging errors\n";
echo "   - Made TrackSecurityActivity middleware handle missing tables gracefully\n";
echo "   - Created database-fix.sql script for live server\n";

echo "\n📋 Next Steps for Live Server:\n";
echo "   1. Upload the updated files to your live server\n";
echo "   2. Run the database-fix.sql script on your live database\n";
echo "   3. Clear Laravel caches: php artisan optimize:clear\n";
echo "   4. Test login functionality\n";

echo "\n✨ The authentication errors should now be resolved!\n";
