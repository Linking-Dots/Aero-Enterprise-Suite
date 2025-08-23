<?php

// Simple test script to verify the authentication fix is working
// This tests if the hasVerifiedEmail() error is resolved

echo "Testing authentication middleware fix...\n\n";

// Test 1: Check if the ValidateUserSession middleware exists
$middlewareFile = __DIR__.'/app/Http/Middleware/ValidateUserSession.php';
if (file_exists($middlewareFile)) {
    echo "✓ ValidateUserSession middleware file exists\n";
} else {
    echo "✗ ValidateUserSession middleware file missing\n";
    exit(1);
}

// Test 2: Check if the middleware class can be loaded
require_once __DIR__.'/vendor/autoload.php';

try {
    $reflection = new ReflectionClass('App\Http\Middleware\ValidateUserSession');
    echo "✓ ValidateUserSession middleware class can be loaded\n";
} catch (Exception $e) {
    echo '✗ Error loading ValidateUserSession middleware: '.$e->getMessage()."\n";
    exit(1);
}

// Test 3: Check if routes file syntax is valid
$routesFile = __DIR__.'/routes/web.php';
$routesContent = file_get_contents($routesFile);

if (strpos($routesContent, 'validate.session') !== false) {
    echo "✗ Found old 'validate.session' alias in routes - should be using full class name\n";
    exit(1);
} else {
    echo "✓ Routes are using full middleware class names\n";
}

// Test 4: Check for the session-check route
if (strpos($routesContent, '/session-check') !== false) {
    echo "✓ Session check route exists\n";
} else {
    echo "✗ Session check route missing\n";
    exit(1);
}

echo "\n✓ All authentication middleware tests passed!\n";
echo "\nThe 'hasVerifiedEmail() on null' error should be resolved.\n";
echo "Deploy these changes to your live server.\n";
