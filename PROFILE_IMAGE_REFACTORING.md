# Profile Image System Refactoring

## Overview
This refactoring completely overhauls the profile image system to use only Spatie MediaLibrary for storing and managing user profile images. The legacy `profile_image` field has been removed in favor of a clean, MediaLibrary-only approach.

## What Changed

### 1. New ProfileImageController
- **File**: `app/Http/Controllers/ProfileImageController.php`
- **Purpose**: Dedicated controller for profile image upload/removal operations
- **Features**:
  - Enforces single image per user policy
  - Comprehensive validation (file type, size, dimensions)
  - Role-based permissions
  - Clean JSON API responses

### 2. Simplified User Model
- **File**: `app/Models/User.php`
- **Changes**: `getProfileImageUrlAttribute()` now only checks MediaLibrary 'profile_images' collection
- **Removed**: Legacy fallback logic for old profile_image field and collection names

### 3. Updated Routes
- **File**: `routes/web.php`
- **New Routes**:
  - `POST /profile/image/upload` - Upload profile image
  - `DELETE /profile/image/remove` - Remove profile image

### 4. Clean ProfileController
- **File**: `app/Http/Controllers/ProfileController.php`
- **Changes**: Removed all profile image handling logic (now delegated to ProfileImageController)
- **Note**: ProfileMediaService dependency removed

### 5. Updated ProfilePictureModal
- **File**: `resources/js/Components/ProfilePictureModal.jsx`
- **Changes**: Now uses dedicated profile image endpoints instead of generic profile update
- **Improvements**: Better error handling and response parsing

### 6. Database Migration
- **File**: `database/migrations/2025_08_18_175157_remove_legacy_profile_image_from_users_table.php`
- **Purpose**: Removes the legacy `profile_image` column from users table

### 7. Updated Controllers
- **Files**: 
  - `app/Http/Controllers/UserController.php`
  - `app/Http/Controllers/EmployeeController.php`
  - `app/Http/Controllers/AttendanceController.php`
- **Changes**: Removed references to legacy `profile_image` field, only return `profile_image_url`

### 8. Updated Frontend Components
- **File**: `resources/js/Tables/EmployeeTable.jsx`
- **Changes**: `handleImageUpdate` now only updates `profile_image_url` field

## API Changes

### Upload Profile Image
```http
POST /profile/image/upload
Content-Type: multipart/form-data

{
    "user_id": 123,
    "profile_image": <file>
}
```

**Response:**
```json
{
    "success": true,
    "message": "Profile image uploaded successfully",
    "user": {
        "id": 123,
        "name": "John Doe",
        "profile_image_url": "http://domain.com/storage/1/profile.jpg"
    },
    "profile_image_url": "http://domain.com/storage/1/profile.jpg",
    "media_id": 456
}
```

### Remove Profile Image
```http
DELETE /profile/image/remove
Content-Type: multipart/form-data

{
    "user_id": 123
}
```

**Response:**
```json
{
    "success": true,
    "message": "Profile image removed successfully",
    "user": {
        "id": 123,
        "name": "John Doe",
        "profile_image_url": null
    },
    "profile_image_url": null
}
```

## Validation Rules

### File Upload Validation
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 2MB
- **Min Dimensions**: 100x100 pixels
- **Max Dimensions**: 2000x2000 pixels

### Permission Requirements
- Users can update their own profile images
- Super Administrators and Administrators can update any user's profile image
- HR Managers can update employee profile images

## Benefits

1. **Consistency**: All profile images managed through MediaLibrary
2. **Single Image Policy**: Automatic cleanup ensures one image per user
3. **Better Organization**: Dedicated controller for profile image operations
4. **Cleaner Code**: Simplified User model accessor without legacy fallbacks
5. **Improved Security**: Comprehensive validation and permission checks
6. **Better UX**: Dedicated endpoints provide clearer error messages

## Migration Steps

1. **Deploy Code**: Deploy all updated files
2. **Run Migration**: Execute the migration to remove legacy `profile_image` field
   ```bash
   php artisan migrate
   ```
3. **Verify**: Test profile image upload/removal functionality

## Backward Compatibility

- **Frontend**: Components using `user.profile_image_url` will continue to work
- **API**: Existing profile update endpoints remain functional for other profile data
- **Database**: Migration safely removes the legacy field

## Technical Notes

- MediaLibrary collection name: `profile_images`
- File naming pattern: `{timestamp}_profile.{extension}`
- Storage: Uses default MediaLibrary storage configuration
- URL Generation: Handled automatically by MediaLibrary

## Testing Checklist

- [ ] Upload profile image through ProfilePictureModal
- [ ] Remove profile image through ProfilePictureModal
- [ ] Verify immediate UI updates in EmployeeTable
- [ ] Test permission-based access (different user roles)
- [ ] Validate file type/size restrictions
- [ ] Check profile image display across all components
- [ ] Verify API response formats
- [ ] Test with users who have no profile image
- [ ] Test with users who had legacy profile images (after migration)
