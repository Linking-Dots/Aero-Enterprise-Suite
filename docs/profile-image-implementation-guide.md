# Profile Image Implementation Guide

## Overview

This guide outlines the standardized approach for handling profile images throughout the Aero Enterprise Suite application, ensuring consistency between backend and frontend implementations.

## Backend Implementation

### 1. User Model (`app/Models/User.php`)

The User model implements robust profile image handling using the Spatie MediaLibrary package:

```php
/**
 * Get the profile image URL.
 * Uses MediaLibrary standard methods with proper exception handling.
 */
public function getProfileImageUrlAttribute(): ?string
{
    try {
        // First, check if user has media in the profile_images collection
        $url = $this->getFirstMediaUrl('profile_images');
        if (!empty($url)) {
            return $url;
        }

        // Fallback: check if user has media in old 'profile_image' collection
        $url = $this->getFirstMediaUrl('profile_image');
        if (!empty($url)) {
            return $url;
        }

        // Handle legacy data - convert any external URLs to local storage URLs
        if (!empty($this->attributes['profile_image'])) {
            $profileImage = $this->attributes['profile_image'];
            
            // Check if it's an external storage URL
            if (str_contains($profileImage, '/storage/')) {
                // Extract just the file path after /storage/
                $pathParts = explode('/storage/', $profileImage);
                if (count($pathParts) > 1) {
                    $filePath = end($pathParts);
                    return asset('storage/' . $filePath);
                }
            }
            
            // If it's already a local URL starting with http, return as is
            if (str_starts_with($profileImage, 'http')) {
                return $profileImage;
            }
            
            // If it's a relative path, make it absolute
            return asset('storage/' . $profileImage);
        }

        return null;
    } catch (\Exception $e) {
        // Log the error and return null
        Log::warning('Failed to get profile image URL for user ' . $this->id . ': ' . $e->getMessage());
        return null;
    }
}
```

**Key Features:**
- ✅ Uses MediaLibrary for consistent file management
- ✅ Proper fallback handling for legacy data
- ✅ Error handling and logging
- ✅ Automatic URL generation

### 2. ProfileMediaService (`app/Services/Profile/ProfileMediaService.php`)

Handles secure image upload and management:

```php
/**
 * Handle profile image upload and update
 */
public function handleProfileImageUpload(User $user, Request $request): array
{
    // Enhanced security validation
    $this->validateImageSecurity($newProfileImage);
    
    // Remove old profile image if exists
    if ($user->hasMedia('profile_images')) {
        $user->clearMediaCollection('profile_images');
    }
    
    // Add new profile image using MediaLibrary
    $media = $user->addMediaFromRequest('profile_image')
        ->toMediaCollection('profile_images');
    
    return $messages;
}
```

**Security Validations:**
- File size limit (2MB)
- Allowed formats (JPEG, PNG, WebP)
- Dimension validation (100x100 to 2000x2000)
- Security content scanning

### 3. API Response Format

All API endpoints should return profile images using the standardized format:

```php
// In Employee Controller
return [
    'id' => $employee->id,
    'name' => $employee->name,
    'email' => $employee->email,
    'profile_image' => $employee->profile_image_url, // For backward compatibility
    'profile_image_url' => $employee->profile_image_url, // Explicit field
    // ... other fields
];
```

## Frontend Implementation

### 1. ProfileAvatar Component (Recommended)

**Use this component everywhere for consistency:**

```jsx
import ProfileAvatar from '@/Components/ProfileAvatar';

// Usage
<ProfileAvatar
    src={user.profile_image_url || user.profile_image}
    name={user.name}
    size="md"
    onClick={handleClick} // Optional
    showBorder={true} // Optional
    isDisabled={false} // Optional
/>
```

**Features:**
- ✅ Automatic fallback to initials with consistent colors
- ✅ Image validation and error handling
- ✅ Loading states
- ✅ Accessibility compliance
- ✅ Consistent sizing and styling

### 2. Fallback Strategy

Always use this pattern for profile image sources:

```jsx
// ✅ CORRECT - Use profile_image_url first, fallback to profile_image
src={user.profile_image_url || user.profile_image}

// ❌ INCORRECT - Don't use profile_image directly
src={user.profile_image}
```

### 3. Profile Image Upload

Use the ProfilePictureModal component for image uploads:

```jsx
import ProfilePictureModal from '@/Components/ProfilePictureModal';

<ProfilePictureModal
    isOpen={profilePictureModal.isOpen}
    onClose={handleProfilePictureClose}
    employee={profilePictureModal.employee}
    onImageUpdate={handleImageUpdate}
/>
```

## Standardized Implementation Examples

### 1. Header Component

```jsx
import ProfileAvatar from '@/Components/ProfileAvatar';

<ProfileAvatar
    size="md"
    src={auth.user.profile_image_url || auth.user.profile_image}
    name={auth.user.name}
    className="ring-2 ring-white/20"
/>
```

### 2. Employee List/Table

```jsx
<ProfileAvatar
    src={user?.profile_image_url || user?.profile_image}
    name={user?.name}
    size="md"
    onClick={() => handleProfilePictureClick(user)}
/>
```

### 3. Employee Cards

```jsx
<div className="flex items-center gap-3">
    <ProfileAvatar
        src={employee.profile_image_url || employee.profile_image}
        name={employee.name}
        size="sm"
    />
    <div>
        <p className="font-semibold">{employee.name}</p>
        <p className="text-sm text-gray-500">ID: {employee.employee_id}</p>
    </div>
</div>
```

## Migration Guidelines

### For Existing Components

1. **Replace direct Avatar usage:**
   ```jsx
   // ❌ OLD
   <Avatar
       src={user.profile_image}
       fallback={<div>...</div>}
   />
   
   // ✅ NEW
   <ProfileAvatar
       src={user.profile_image_url || user.profile_image}
       name={user.name}
   />
   ```

2. **Update image source references:**
   ```jsx
   // ❌ OLD
   src: data.profile_image
   
   // ✅ NEW
   src: data.profile_image_url || data.profile_image
   ```

3. **Add ProfileAvatar import:**
   ```jsx
   import ProfileAvatar from '@/Components/ProfileAvatar';
   ```

### For New Components

1. Always use `ProfileAvatar` component
2. Always use the fallback pattern: `user.profile_image_url || user.profile_image`
3. Always provide the user's name for initials fallback
4. Use appropriate sizing (`sm`, `md`, `lg`)

## Testing Checklist

- [ ] Profile images display correctly in all components
- [ ] Fallback initials work when no image is present
- [ ] Image upload functionality works
- [ ] Image removal functionality works
- [ ] Error handling works for broken/invalid images
- [ ] Consistent styling across all components
- [ ] Accessibility features work (alt text, keyboard navigation)

## Security Considerations

1. **File Validation:** All uploaded images are validated for:
   - File type (JPEG, PNG, WebP only)
   - File size (max 2MB)
   - Image dimensions (100x100 to 2000x2000)
   - Security content scanning

2. **URL Generation:** All profile image URLs are generated server-side using the accessor to prevent direct file access

3. **Storage:** Images are stored using MediaLibrary with proper file organization and security

## Performance Optimization

1. **Lazy Loading:** ProfileAvatar component includes built-in image validation
2. **Caching:** MediaLibrary handles file caching automatically
3. **Error Handling:** Graceful fallback to initials prevents broken image displays
4. **Consistent Colors:** Deterministic color generation based on user name

## Best Practices

1. **Always use ProfileAvatar component** instead of direct Avatar usage
2. **Always provide fallback** using the pattern: `profile_image_url || profile_image`
3. **Always include user name** for initials generation
4. **Use consistent sizing** across similar UI components
5. **Handle loading states** for better user experience
6. **Include accessibility features** (alt text, ARIA labels)

## Support

For questions or issues related to profile image implementation, refer to:

- ProfileAvatar component: `resources/js/Components/ProfileAvatar.jsx`
- ProfilePictureModal component: `resources/js/Components/ProfilePictureModal.jsx`
- ProfileMediaService: `app/Services/Profile/ProfileMediaService.php`
- User model accessor: `app/Models/User.php::getProfileImageUrlAttribute()`

## Updated Components

The following components have been updated to follow this standardized approach:

✅ **Layout Components:**
- Header.jsx - Updated to use ProfileAvatar component with consistent fallback
- Sidebar.jsx - (No profile images used, only imports Avatar for other purposes)

✅ **Employee Management:**
- EmployeeList.jsx - Updated to use ProfileAvatar and consistent image sources
- EmployeeTable.jsx - Already using ProfileAvatar correctly
- EmployeeTableModern.jsx - Updated image source pattern
- EnhancedProfileCard.jsx - Already using ProfileAvatar correctly
- EmployeeFormModal.jsx - Updated image source pattern

✅ **User Management:**
- UsersList.jsx - Updated image source pattern
- UserProfile.jsx - Already using best practices

✅ **Tables & Data Display:**
- AttendanceAdminTable.jsx - Updated image source pattern
- DailyWorksTable.jsx - Updated image source pattern
- DailyWorksTableOld.jsx - Updated image source pattern
- TimeSheetTable.jsx - Updated image source pattern
- LeaveEmployeeTable.jsx - Updated image source pattern
- LettersTable.jsx - Updated image source pattern (includes profile_photo_url fallback)

✅ **Forms:**
- AddUserForm.jsx - Updated image source pattern
- AddEditUserForm.jsx - Updated image source pattern
- ProfileForm.jsx - Already using best practices
- PicnicParticipantForm.jsx - Updated image source pattern
- LeaveForm.jsx - Updated image source pattern

✅ **Components:**
- ProfileAvatar.jsx - The gold standard component (no changes needed)
- ProfilePictureModal.jsx - Already using best practices
- EnhancedProfileCard.jsx - Already using ProfileAvatar correctly
- DeleteEmployeeModal.jsx - Already using consistent pattern
- BulkLeaveModal.jsx - Updated image source pattern
- PunchStatusCard.jsx - Updated image source pattern
- AbsentUsersInlineCard.jsx - Updated image source pattern

✅ **Other Components:**
- ProjectManagement/BulkActionModal.jsx - Uses generic avatar field (not profile images)

❌ **Components that don't need updates:**
- Security/Dashboard.jsx - Uses Avatar only for icons, not user profile images
- HR/TimeOff/Dashboard.jsx - No profile image usage
- Administration/SystemMonitoringEnhanced.jsx - Uses Avatar only for icons
- DepartmentTable.jsx - Uses Avatar for department icons, not profile images

## Migration Summary

### Changes Applied:

1. **Image Source Standardization:**
   - Changed from: `src: user.profile_image`
   - Changed to: `src: user.profile_image_url || user.profile_image`

2. **Component Upgrades:**
   - Replaced direct `Avatar` usage with `ProfileAvatar` component where appropriate
   - Added `ProfileAvatar` imports to relevant components

3. **Backend Consistency:**
   - Updated `EmployeeController.php` to return both fields for backward compatibility
   - Ensured `profile_image_url` accessor is consistently used

### Total Files Updated: 19

**Layout Files (1):**
- Header.jsx

**Page Files (2):**
- UsersList.jsx
- EmployeeList.jsx

**Table Files (7):**
- EmployeeTable.jsx
- DailyWorksTableOld.jsx
- TimeSheetTable.jsx
- LeaveEmployeeTable.jsx
- LettersTable.jsx
- DailyWorksTable.jsx
- EmployeeTable.jsx

**Form Files (5):**
- AddUserForm.jsx
- AddEditUserForm.jsx
- PicnicParticipantForm.jsx
- LeaveForm.jsx
- EmployeeFormModal.jsx

**Component Files (4):**
- BulkLeaveModal.jsx
- PunchStatusCard.jsx
- AbsentUsersInlineCard.jsx
- UserLocationsCard.jsx

**Backend Files (1):**
- EmployeeController.php

Remember: Consistency is key to a professional and maintainable application!
