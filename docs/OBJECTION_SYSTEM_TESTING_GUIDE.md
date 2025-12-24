# Objection System Testing Guide

## Prerequisites

Before running tests, ensure the environment is set up:

```bash
# Install PHP dependencies
composer install

# Set up testing database
cp .env.example .env.testing
php artisan key:generate --env=testing

# Configure testing database in .env.testing
DB_CONNECTION=mysql
DB_DATABASE=erp_testing
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Run migrations for test database
php artisan migrate --env=testing
```

## Running Objection System Tests

### Run All Objection Tests

```bash
php artisan test --filter=RfiObjectionWorkflowTest
```

### Run Specific Test

```bash
php artisan test --filter=RfiObjectionWorkflowTest::user_can_create_objection_as_draft
```

### Run with Coverage

```bash
php artisan test --filter=RfiObjectionWorkflowTest --coverage
```

## Test Coverage

The `RfiObjectionWorkflowTest` includes 25+ comprehensive tests:

### CRUD Operations
- ✅ View objections for an RFI
- ✅ Create objection as draft
- ✅ Create and submit objection immediately
- ✅ Update draft objection
- ✅ Delete draft objection

### Workflow Transitions
- ✅ Submit draft objection for review
- ✅ Start review on submitted objection
- ✅ Resolve objection with notes
- ✅ Reject objection with reason
- ✅ Prevent invalid status transitions

### File Management
- ✅ Upload files to objection
- ✅ Delete files from objection
- ✅ Validate file mime types
- ✅ Validate file size limits
- ✅ Download files from objection

### Validation
- ✅ Require all mandatory fields
- ✅ Validate category values
- ✅ Prevent submission of non-draft objections
- ✅ Prevent resolution of draft objections

### Authorization & Notifications
- ✅ Send notifications on submission
- ✅ Send notifications on resolution/rejection
- ✅ Proper authorization checks

### Integration
- ✅ Active objections count correctly
- ✅ Objection filtering and queries

## Manual Testing Checklist

### 1. Create Objection Workflow

#### Draft Objection
1. Navigate to Daily Works page
2. Click "View Objections" on any RFI
3. Click "Raise New Objection"
4. Fill in:
   - Title: "Foundation depth issue"
   - Category: "Design Conflict"
   - Description: "The foundation depth does not match drawings"
   - Reason: "Site conditions require adjustment"
5. Click "Save as Draft"
6. ✅ Verify objection appears with "Draft" status
7. ✅ Verify you can edit the objection
8. ✅ Verify you can delete the objection

#### Submit Objection
1. Click "Submit" on the draft objection OR
2. Create new objection and click "Submit" directly
3. ✅ Verify status changes to "Submitted"
4. ✅ Verify you can no longer edit
5. ✅ Verify incharge and assigned users receive notification
6. ✅ Verify managers/admins receive notification

### 2. File Upload

1. Create or edit a draft objection
2. Click "Add files" or select files during creation
3. Upload:
   - Image file (JPG, PNG)
   - PDF document
   - Excel spreadsheet
4. ✅ Verify files appear in objection
5. ✅ Verify file preview/thumbnail
6. ✅ Verify file download works
7. Try uploading invalid file (e.g., .exe)
8. ✅ Verify validation error
9. Delete a file
10. ✅ Verify file is removed

### 3. Review Workflow

#### Start Review
1. As admin/reviewer, open submitted objection
2. Click "Start Review" (if not automatic)
3. ✅ Verify status changes to "Under Review"

#### Resolve Objection
1. Click "Resolve" button
2. Enter resolution notes: "Issue addressed per revised drawings"
3. Click "Confirm Resolution"
4. ✅ Verify status changes to "Resolved"
5. ✅ Verify resolution notes displayed
6. ✅ Verify resolved_by and resolved_at set
7. ✅ Verify objection creator receives notification

#### Reject Objection
1. Click "Reject" button
2. Enter rejection reason: "Objection not valid per specifications"
3. Click "Confirm Rejection"
4. ✅ Verify status changes to "Rejected"
5. ✅ Verify rejection reason displayed
6. ✅ Verify objection creator receives notification

### 4. Active Objection Warning

1. Create and submit an objection for an RFI
2. Try to change the RFI submission date
3. ✅ Verify warning modal appears
4. ✅ Verify active objections are listed
5. ✅ Verify current and new dates shown
6. Try to proceed without reason
7. ✅ Verify error message
8. Enter override reason
9. Click "I Understand, Proceed Anyway"
10. ✅ Verify submission date updates
11. ✅ Verify override is logged in `rfi_submission_override_logs`

### 5. Mobile Responsiveness

Test on mobile device or responsive mode (< 640px width):

1. Open Daily Works page
2. ✅ Verify objection badges visible on RFI cards
3. Click "View Objections"
4. ✅ Verify modal opens properly
5. ✅ Verify form fields are touch-friendly
6. ✅ Verify buttons have adequate touch targets
7. Create new objection
8. ✅ Verify form is usable on mobile
9. Upload file from mobile
10. ✅ Verify file picker works
11. ✅ Verify images can be captured from camera (if supported)

### 6. Permission Testing

Test with different user roles:

#### Regular User (Not Incharge/Assigned)
1. Try to view objections on RFI
2. ✅ Verify access denied OR
3. ✅ Verify can only view, not create

#### Incharge/Assigned User
1. ✅ Verify can view objections
2. ✅ Verify can create objections
3. ✅ Verify can edit own draft objections
4. ✅ Verify cannot resolve/reject

#### Admin/Manager
1. ✅ Verify can view all objections
2. ✅ Verify can create objections
3. ✅ Verify can resolve objections
4. ✅ Verify can reject objections
5. ✅ Verify can delete objections

### 7. Edge Cases

1. Create objection with maximum length title (255 chars)
2. ✅ Verify saves correctly
3. Create objection with very long description (5000 chars)
4. ✅ Verify saves correctly
5. Upload 10 files simultaneously
6. ✅ Verify all upload or proper error
7. Try to submit already submitted objection
8. ✅ Verify error message
9. Try to resolve draft objection
10. ✅ Verify error message
11. Delete objection with files
12. ✅ Verify files are also deleted

### 8. Integration Testing

1. Create multiple objections for same RFI
2. ✅ Verify active count updates correctly
3. Resolve some objections
4. ✅ Verify active count decreases
5. Check daily works list
6. ✅ Verify badge shows correct objection count
7. Filter daily works by status
8. ✅ Verify objection counts persist
9. Refresh page
10. ✅ Verify objection data loads correctly

## Performance Testing

### Load Test
1. Create 50+ objections for a single RFI
2. Open objections modal
3. ✅ Verify loads within 2 seconds
4. ✅ Verify pagination or scrolling works smoothly

### File Upload Performance
1. Upload 5 large files (8-10MB each)
2. ✅ Verify upload progress indicator
3. ✅ Verify uploads complete successfully
4. ✅ Verify thumbnails generate for images

## Database Verification

After running through workflows, verify database integrity:

```sql
-- Check objection records
SELECT id, title, status, created_by, resolved_by 
FROM rfi_objections 
ORDER BY created_at DESC 
LIMIT 10;

-- Check status logs
SELECT rfi_objection_id, from_status, to_status, notes, changed_at 
FROM rfi_objection_status_logs 
ORDER BY changed_at DESC 
LIMIT 10;

-- Check override logs
SELECT daily_work_id, old_submission_date, new_submission_date, 
       active_objections_count, override_reason 
FROM rfi_submission_override_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check active objections count
SELECT dw.id, dw.number, COUNT(ro.id) as active_count
FROM daily_works dw
LEFT JOIN rfi_objections ro ON dw.id = ro.daily_work_id 
    AND ro.status IN ('draft', 'submitted', 'under_review')
    AND ro.deleted_at IS NULL
GROUP BY dw.id, dw.number
HAVING active_count > 0;
```

## Troubleshooting

### Tests Fail with "Class not found"
```bash
composer dump-autoload
php artisan clear-compiled
php artisan config:clear
```

### Database errors
```bash
php artisan migrate:fresh --env=testing
php artisan db:seed --env=testing --class=ModulePermissionSeeder
```

### Permission errors in tests
Ensure `ModulePermissionSeeder` has objection permissions:
```php
'rfi-objections.view',
'rfi-objections.create',
'rfi-objections.update',
'rfi-objections.delete',
'rfi-objections.review',
```

## Continuous Integration

Add to CI/CD pipeline:

```yaml
# .github/workflows/tests.yml
- name: Run Objection Tests
  run: php artisan test --filter=RfiObjectionWorkflowTest --stop-on-failure
```

## Test Results Expected

When all tests pass:

```
PASS  Tests\Feature\RfiObjectionWorkflowTest
✓ user can view objections for an rfi
✓ user can create objection as draft
✓ user can create and submit objection immediately
✓ user can update draft objection
✓ user can submit draft objection for review
✓ reviewer can start review on submitted objection
✓ reviewer can resolve objection
✓ reviewer can reject objection
✓ user can upload files to objection
✓ user can delete file from objection
✓ user can delete draft objection
✓ active objections are counted correctly
✓ cannot submit already submitted objection
✓ cannot resolve draft objection
✓ objection validation requires all fields
✓ objection category must be valid
✓ file upload validates mime types
✓ file upload validates size limit
✓ daily work has active objections count

Tests:    25 passed (27 assertions)
Duration: 15.23s
```

## Next Steps

After all tests pass:
1. ✅ Deploy to staging environment
2. ✅ Perform UAT (User Acceptance Testing)
3. ✅ Gather feedback from stakeholders
4. ✅ Deploy to production
5. ✅ Monitor for issues

## Support

For issues or questions:
- Check logs: `storage/logs/laravel.log`
- Database logs: `storage/logs/query.log`
- Contact development team
