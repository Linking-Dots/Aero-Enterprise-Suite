@echo off
REM Deployment script for Single Device Login feature (Windows)
REM Run this script on your live server after uploading the new files

echo 🚀 Deploying Single Device Login feature...

REM 1. Install/update dependencies
echo 📦 Installing dependencies...
composer install --no-dev --optimize-autoloader

REM 2. Run migrations
echo 🗄️ Running database migrations...
php artisan migrate --force

REM 3. Clear all caches
echo 🧹 Clearing caches...
php artisan optimize:clear

REM 4. Generate optimized files for production
echo ⚡ Optimizing for production...
php artisan optimize

REM 5. Restart queue workers (if applicable)
echo 🔄 Restarting queue workers...
php artisan queue:restart

echo ✅ Single Device Login feature deployed successfully!
echo 📋 Features added:
echo    - Single device login enforcement
echo    - Device tracking and management
echo    - Admin controls for per-user device restrictions
echo    - Device session management

echo 🔧 Admin can now:
echo    - Enable/disable single device login per user
echo    - View user device history
echo    - Reset user devices
echo    - Monitor device statistics

pause
