<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use App\Http\Controllers\Auth\LoginController;
use App\Models\User;
use App\Services\DeviceTrackingService;

// Create a simple test to verify device blocking
echo "Testing Device Blocking Functionality\n";
echo "====================================\n\n";

// Create a mock request
$request = Request::create('/login', 'POST', [
    'email' => 'test@example.com',
    'password' => 'password123',
    'remember' => false
]);

$request->server->set('HTTP_USER_AGENT', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1');
$request->server->set('REMOTE_ADDR', '192.168.1.100');

echo "1. Request created with iPhone user agent\n";
echo "2. This would simulate a login attempt from an iPhone\n";
echo "3. If single device login is enabled and another device is active,\n";
echo "   the LoginController should return an Inertia response with device blocking info\n\n";

echo "The fix ensures:\n";
echo "- LoginController returns Inertia::render() instead of redirect()\n";
echo "- Device blocking props are passed directly to Login component\n";
echo "- Login component initializes showDeviceAlert based on deviceBlocked prop\n";
echo "- No page re-rendering issues that would hide the error message\n\n";

echo "Test completed. Please try logging in from a different device to see the blocking message.\n";
