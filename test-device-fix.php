<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\UserDevice;

echo "Testing UserDevice model with last_activity column...\n";

try {
    // Test if we can query user devices with last_activity
    $userDevices = UserDevice::orderBy('last_activity', 'desc')->limit(5)->get();
    echo "✅ Successfully queried user_devices with last_activity column\n";
    echo 'Found '.$userDevices->count()." devices\n";

    // Test user relationship
    $user = User::find(16);
    if ($user) {
        $devices = $user->devices()->orderBy('last_activity', 'desc')->get();
        echo "✅ Successfully queried user devices relationship\n";
        echo "User {$user->name} has ".$devices->count()." devices\n";
    }

} catch (Exception $e) {
    echo '❌ Error: '.$e->getMessage()."\n";
}

echo "Test completed!\n";
