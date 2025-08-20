#!/bin/bash

# Cache Optimization Verification Script
# This script helps verify that the cache optimization changes are working correctly

echo "🔍 VERIFYING CACHE OPTIMIZATION CHANGES"
echo "========================================"

# Check PHP configuration
echo ""
echo "📋 1. Checking Laravel Configuration..."

# Check cache config
CACHE_DEFAULT=$(php artisan config:show cache.default 2>/dev/null || echo "Unable to read cache config")
echo "   • Cache Store: $CACHE_DEFAULT"

# Check session config
SESSION_LIFETIME=$(php artisan config:show session.lifetime 2>/dev/null || echo "Unable to read session config")
SESSION_EXPIRE=$(php artisan config:show session.expire_on_close 2>/dev/null || echo "Unable to read session config")
echo "   • Session Lifetime: $SESSION_LIFETIME minutes"
echo "   • Expire on Close: $SESSION_EXPIRE"

# Check if caches are clear
echo ""
echo "🧹 2. Checking Cache Status..."

# Check for cache files
if [ -d "bootstrap/cache" ]; then
    CACHE_FILES=$(find bootstrap/cache -name "*.php" | wc -l)
    echo "   • Bootstrap cache files: $CACHE_FILES"
else
    echo "   • Bootstrap cache directory not found"
fi

if [ -d "storage/framework/cache" ]; then
    APP_CACHE_FILES=$(find storage/framework/cache -name "*" -type f | wc -l)
    echo "   • Application cache files: $APP_CACHE_FILES"
else
    echo "   • Application cache directory not found"
fi

# Check if build files exist
echo ""
echo "🏗️  3. Checking Build Status..."

if [ -f "public/build/manifest.json" ]; then
    echo "   ✅ Frontend build completed"
    
    # Check if App.js exists in build
    if ls public/build/assets/js/App-*.js 1> /dev/null 2>&1; then
        echo "   ✅ App component built successfully"
    else
        echo "   ❌ App component build not found"
    fi
else
    echo "   ❌ Frontend build not found - run 'npm run build'"
fi

# Verify file modifications
echo ""
echo "📝 4. Verifying Code Changes..."

# Check App.jsx for React.memo removal
if grep -q "export default React.memo(App)" resources/js/Layouts/App.jsx; then
    echo "   ❌ App.jsx still has React.memo wrapper"
elif grep -q "export default App" resources/js/Layouts/App.jsx; then
    echo "   ✅ App.jsx React.memo removed correctly"
else
    echo "   ⚠️  App.jsx export pattern unclear"
fi

# Check cache config
if grep -q "env('CACHE_STORE', 'array')" config/cache.php; then
    echo "   ✅ Cache config set to array (non-persistent)"
elif grep -q "env('CACHE_STORE', 'database')" config/cache.php; then
    echo "   ❌ Cache config still set to database"
else
    echo "   ⚠️  Cache config pattern unclear"
fi

# Check session config  
if grep -q "env('SESSION_LIFETIME', 60)" config/session.php; then
    echo "   ✅ Session lifetime reduced to 60 minutes"
elif grep -q "env('SESSION_LIFETIME', 120)" config/session.php; then
    echo "   ❌ Session lifetime still 120 minutes"
else
    echo "   ⚠️  Session lifetime config unclear"
fi

# Provide user instructions
echo ""
echo "👤 5. User Instructions for Testing"
echo "==================================="
echo ""
echo "To verify the fixes are working:"
echo "1. 🌐 Open the application in your browser"
echo "2. 🔄 Hard refresh (Ctrl+F5 or Cmd+Shift+R)"
echo "3. 🔐 Log in to the system"
echo "4. ⏰ Check the punch status card shows correct current day hours"
echo "5. ✅ Perform a check-in/out action"
echo "6. 👀 Verify the UI updates immediately"
echo "7. 🔄 Navigate between pages and check for fresh data"
echo ""
echo "Expected Results:"
echo "• Punch status card shows accurate current day totals"
echo "• UI updates immediately after attendance actions"
echo "• No stale data from previous days"
echo "• Session expires appropriately (60 min or browser close)"
echo ""

# Recommendations
echo "🔧 6. Additional Recommendations"
echo "================================"
echo ""
echo "If issues persist:"
echo "• Clear browser cache and hard refresh"
echo "• Check browser developer tools for JavaScript errors"
echo "• Verify database has current day attendance records"
echo "• Restart PHP-FPM/Apache if using persistent processes"
echo ""

echo "✅ Verification completed!"
echo ""
