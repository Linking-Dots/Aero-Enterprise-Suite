# Daily Works API Documentation

## Overview
The Daily Works module provides RESTful API endpoints for managing construction daily work entries, including RFI (Request for Inspection) tracking, work assignments, and inspection results.

## Base URL
All endpoints are prefixed with the application's base URL.

## Authentication
All endpoints require authentication via Laravel Sanctum or session-based authentication.

## Permissions
- `daily-works.view` - View daily works
- `daily-works.create` - Create new daily works
- `daily-works.update` - Update existing daily works
- `daily-works.delete` - Delete daily works
- `daily-works.import` - Import daily works from Excel
- `daily-works.export` - Export daily works to Excel/PDF

---

## Endpoints

### 1. Get Daily Works Page
**GET** `/daily-works`

Returns the main Daily Works page with initial data.

**Permissions:** `daily-works.view`

**Response:**
```json
{
  "title": "Daily Works",
  "allInCharges": [...],
  "juniors": [...],
  "reports": [...],
  "jurisdictions": [...],
  "users": [...]
}
```

---

### 2. Get Paginated Daily Works
**GET** `/daily-works-paginate`

Fetches paginated daily works data with filtering and sorting.

**Permissions:** `daily-works.view`

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `perPage` (integer, optional) - Items per page (default: 15)
- `search` (string, optional) - Search term
- `status` (string, optional) - Filter by status (new, in-progress, completed, rejected, resubmission, pending)
- `type` (string, optional) - Filter by type (Embankment, Structure, Pavement)
- `incharge` (integer, optional) - Filter by incharge user ID
- `assigned` (integer, optional) - Filter by assigned user ID
- `date_from` (date, optional) - Filter by start date
- `date_to` (date, optional) - Filter by end date

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-11-26",
      "number": "S2025-1126-001",
      "status": "new",
      "inspection_result": null,
      "type": "Structure",
      "description": "Bridge foundation work",
      "location": "K05+560-K05+660",
      "side": "Both",
      "qty_layer": "100 MT",
      "planned_time": "2025-11-26 08:00:00",
      "incharge": 5,
      "assigned": 12,
      "completion_time": null,
      "inspection_details": null,
      "resubmission_count": 0,
      "resubmission_date": null,
      "rfi_submission_date": "2025-11-26",
      "created_at": "2025-11-26T10:00:00.000000Z",
      "updated_at": "2025-11-26T10:00:00.000000Z",
      "deleted_at": null,
      "inchargeUser": {...},
      "assignedUser": {...},
      "reports": [...]
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
  }
}
```

---

### 3. Get All Daily Works
**GET** `/daily-works-all`

Fetches all daily works without pagination (for exports/reports).

**Permissions:** `daily-works.view`

**Query Parameters:** Same as paginated endpoint

---

### 4. Create Daily Work
**POST** `/add-daily-work`

Creates a new daily work entry.

**Permissions:** `daily-works.create`

**Request Body:**
```json
{
  "date": "2025-11-26",
  "number": "S2025-1126-001",
  "time": "08:00",
  "status": "new",
  "inspection_result": null,
  "type": "Structure",
  "description": "Bridge foundation work",
  "location": "K05+560-K05+660",
  "side": "Both",
  "qty_layer": "100 MT",
  "completion_time": null,
  "inspection_details": null
}
```

**Validation Rules:**
- `date` - required, date
- `number` - required, string, must be unique
- `time` - required, string
- `status` - required, one of: new, in-progress, completed, rejected, resubmission, pending
- `inspection_result` - required when status is "completed", one of: pass, fail, conditional, pending, approved, rejected
- `type` - required, string
- `description` - required, string
- `location` - required, string, must start with 'K' and be in range K0-K48
- `side` - required, string
- `qty_layer` - required when type is "Embankment"
- `completion_time` - required when status is "completed"
- `inspection_details` - optional, string

**Response:**
```json
{
  "message": "Daily work added successfully",
  "dailyWork": {...}
}
```

---

### 5. Update Daily Work
**POST** `/update-daily-work`

Updates an existing daily work entry.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "date": "2025-11-26",
  "number": "S2025-1126-001",
  "planned_time": "08:00",
  "status": "completed",
  "inspection_result": "pass",
  "type": "Structure",
  "description": "Bridge foundation work - Updated",
  "location": "K05+560-K05+660",
  "side": "Both",
  "qty_layer": "100 MT",
  "completion_time": "2025-11-26 16:00:00",
  "inspection_details": "All checks passed"
}
```

**Response:**
```json
{
  "message": "Daily work updated successfully",
  "dailyWork": {...}
}
```

---

### 6. Delete Daily Work
**DELETE** `/delete-daily-work`

Soft deletes a daily work entry.

**Permissions:** `daily-works.delete`

**Request Body:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "message": "Daily work 'S2025-1126-001' deleted successfully",
  "deletedDailyWork": {
    "id": 1,
    "number": "S2025-1126-001",
    "description": "Bridge foundation work"
  }
}
```

---

### 7. Update Status
**POST** `/daily-works/status`

Updates the status of a daily work.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "status": "completed"
}
```

---

### 8. Update Completion Time
**POST** `/daily-works/completion-time`

Updates the completion time of a daily work.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "completion_time": "2025-11-26 16:00:00"
}
```

---

### 9. Update RFI Submission Time
**POST** `/daily-works/submission-time`

Updates the RFI submission date.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "rfi_submission_date": "2025-11-26"
}
```

---

### 10. Update Inspection Details
**POST** `/daily-works/inspection-details`

Updates inspection details and result.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "inspection_details": "All structural elements verified",
  "inspection_result": "pass"
}
```

---

### 11. Update Incharge
**POST** `/daily-works/incharge`

Updates the incharge (supervisor) for a daily work.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "incharge": 5
}
```

---

### 12. Update Assigned User
**POST** `/daily-works/assigned`

Updates the assigned user for a daily work.

**Permissions:** `daily-works.update`

**Request Body:**
```json
{
  "id": 1,
  "assigned": 12
}
```

---

### 13. Import Daily Works
**POST** `/import-daily-works`

Imports daily works from an Excel file.

**Permissions:** `daily-works.import`

**Request Body (multipart/form-data):**
- `file` - Excel file (.xlsx, .csv)

**Excel Format:**
| Column | Field | Example | Required |
|--------|-------|---------|----------|
| A | Date | 2025-11-26 | Yes |
| B | RFI Number | S2025-1126-001 | Yes |
| C | Work Type | Structure | Yes |
| D | Description | Bridge foundation work | Yes |
| E | Location/Chainage | K05+560-K05+660 | Yes |
| F | Quantity/Layer | 100 MT | No |

**Response:**
```json
{
  "message": "Import completed successfully",
  "results": {
    "total": 50,
    "success": 48,
    "failed": 2,
    "errors": [...]
  }
}
```

---

### 14. Download Import Template
**GET** `/download-daily-works-template`

Downloads an Excel template for importing daily works.

**Permissions:** `daily-works.import`

**Response:** Excel file download

---

### 15. Export Daily Works
**POST** `/daily-works/export`

Exports daily works to Excel or PDF.

**Permissions:** `daily-works.export`

**Request Body:**
```json
{
  "format": "xlsx",
  "filters": {
    "date_from": "2025-11-01",
    "date_to": "2025-11-30",
    "status": "completed",
    "type": "Structure"
  }
}
```

**Response:** File download (Excel or PDF)

---

### 16. Get Statistics
**GET** `/daily-works/statistics`

Fetches statistical data for daily works.

**Permissions:** `daily-works.view`

**Response:**
```json
{
  "total": 150,
  "by_status": {
    "new": 20,
    "in-progress": 35,
    "completed": 80,
    "resubmission": 10,
    "rejected": 5
  },
  "by_type": {
    "Structure": 50,
    "Embankment": 60,
    "Pavement": 40
  },
  "completion_rate": 53.33,
  "average_completion_time": 8.5,
  "resubmission_rate": 6.67
}
```

---

## Status Values
- `new` - Newly created work
- `in-progress` - Work in progress
- `completed` - Work completed
- `rejected` - Work rejected
- `resubmission` - Work resubmitted after rejection
- `pending` - Work pending review

## Inspection Result Values
- `pass` - Inspection passed
- `fail` - Inspection failed
- `conditional` - Conditional pass
- `pending` - Inspection pending
- `approved` - Inspection approved
- `rejected` - Inspection rejected

## Work Types
- `Structure` - Structural work (bridges, culverts, etc.)
- `Embankment` - Earthwork/embankment
- `Pavement` - Road surface work

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "message": "This action is unauthorized."
}
```

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "number": ["A daily work with the same RFI number already exists."],
    "status": ["Status must be one of: new, in-progress, completed, rejected, resubmission, pending."]
  }
}
```

### 500 Server Error
```json
{
  "message": "An error occurred while processing your request.",
  "error": "Error details..."
}
```

---

## Activity Logging

All create, update, and delete operations are automatically logged using Spatie ActivityLog. Activity logs include:
- User who performed the action
- Timestamp
- Old and new values for updates
- IP address and user agent

Activity logs can be retrieved via the activity log API (separate documentation).

---

## Notes

1. **Unique RFI Numbers**: Each daily work must have a unique RFI number to prevent duplicates.

2. **Automatic Incharge Assignment**: When creating a daily work, the incharge is automatically assigned based on the location/chainage using the jurisdiction system.

3. **Soft Deletes**: Deleted daily works are soft-deleted and can be restored if needed.

4. **File Attachments**: Daily works support file attachments (RFI documents, photos) via Spatie MediaLibrary.

5. **Relationships**: Daily works can be linked to reports via the `daily_work_has_report` pivot table.

6. **Pagination**: Default pagination is 15 items per page. Maximum is 100 items per page.

7. **Date Format**: All dates should be in `Y-m-d` format (2025-11-26).

8. **DateTime Format**: All datetime fields should be in ISO 8601 format (2025-11-26T16:00:00Z).

---

## RFI Objections API

### Overview
The objection system allows stakeholders to raise, track, and resolve objections on RFI submissions. Objections follow a workflow: draft → submitted → under review → resolved/rejected.

### Permissions Required
- `rfi-objections.view` - View objections
- `rfi-objections.create` - Create new objections
- `rfi-objections.update` - Update objections
- `rfi-objections.delete` - Delete objections
- `rfi-objections.review` - Review and resolve objections

---

### 1. Get Objections for an RFI
**GET** `/daily-works/{dailyWorkId}/objections`

Returns all objections for a specific RFI.

**Permissions:** `rfi-objections.view`

**Response:**
```json
{
  "objections": [
    {
      "id": 1,
      "daily_work_id": 123,
      "title": "Foundation depth discrepancy",
      "category": "design_conflict",
      "category_label": "Design Conflict",
      "description": "The foundation depth shown on site does not match drawings",
      "reason": "Survey data shows rock layer at different elevation",
      "status": "submitted",
      "status_label": "Submitted",
      "resolution_notes": null,
      "resolved_by": null,
      "resolved_at": null,
      "created_by": {
        "id": 5,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "files_count": 3,
      "is_active": true,
      "created_at": "2025-12-18T10:00:00.000000Z",
      "updated_at": "2025-12-18T10:00:00.000000Z"
    }
  ],
  "total": 5,
  "active_count": 2
}
```

---

### 2. Get Specific Objection
**GET** `/daily-works/{dailyWorkId}/objections/{objectionId}`

Get detailed information about a specific objection including status logs.

**Permissions:** `rfi-objections.view`

**Response:**
```json
{
  "objection": {
    "id": 1,
    "title": "Foundation depth discrepancy",
    "category": "design_conflict",
    "description": "...",
    "reason": "...",
    "status": "under_review",
    "files": [
      {
        "id": 1,
        "name": "site_photo.jpg",
        "url": "https://example.com/storage/...",
        "thumb_url": "https://example.com/storage/.../thumb.jpg",
        "mime_type": "image/jpeg",
        "size": 245678,
        "human_size": "240 KB",
        "is_image": true,
        "is_pdf": false,
        "created_at": "2025-12-18T10:00:00.000000Z"
      }
    ],
    "status_logs": [
      {
        "id": 1,
        "from_status": "submitted",
        "to_status": "under_review",
        "notes": "Review started",
        "changed_by": {
          "id": 3,
          "name": "Admin User"
        },
        "changed_at": "2025-12-18T11:00:00.000000Z"
      }
    ]
  }
}
```

---

### 3. Create Objection
**POST** `/daily-works/{dailyWorkId}/objections`

Create a new objection for an RFI.

**Permissions:** `rfi-objections.create`

**Request Body:**
```json
{
  "title": "Foundation depth discrepancy",
  "category": "design_conflict",
  "description": "The foundation depth shown on site does not match the approved drawings",
  "reason": "Survey data shows rock layer at different elevation than design assumptions",
  "status": "draft"
}
```

**Validation Rules:**
- `title` - required, string, max 255
- `category` - nullable, one of: design_conflict, site_mismatch, material_change, safety_concern, specification_error, other
- `description` - required, string, max 5000
- `reason` - required, string, max 5000
- `status` - nullable, one of: draft, submitted (default: draft)

**Response:**
```json
{
  "message": "Objection created successfully.",
  "objection": { ... }
}
```

---

### 4. Update Objection
**PUT** `/daily-works/{dailyWorkId}/objections/{objectionId}`

Update an existing objection (only draft objections can be updated).

**Permissions:** `rfi-objections.update`

**Request Body:**
```json
{
  "title": "Updated title",
  "category": "safety_concern",
  "description": "Updated description",
  "reason": "Updated reason"
}
```

---

### 5. Submit Objection for Review
**POST** `/daily-works/{dailyWorkId}/objections/{objectionId}/submit`

Submit a draft objection for review. This transitions the status from "draft" to "submitted" and sends notifications.

**Permissions:** `rfi-objections.create`

**Response:**
```json
{
  "message": "Objection submitted for review.",
  "objection": { ... }
}
```

---

### 6. Start Reviewing Objection
**POST** `/daily-works/{dailyWorkId}/objections/{objectionId}/review`

Start reviewing a submitted objection. Transitions status from "submitted" to "under_review".

**Permissions:** `rfi-objections.review`

**Response:**
```json
{
  "message": "Objection is now under review.",
  "objection": { ... }
}
```

---

### 7. Resolve Objection
**POST** `/daily-works/{dailyWorkId}/objections/{objectionId}/resolve`

Resolve an objection with resolution notes.

**Permissions:** `rfi-objections.review`

**Request Body:**
```json
{
  "resolution_notes": "Issue has been addressed per revised drawings dated 2025-12-18. Foundation depth adjusted to actual site conditions."
}
```

**Response:**
```json
{
  "message": "Objection resolved successfully.",
  "objection": { ... }
}
```

---

### 8. Reject Objection
**POST** `/daily-works/{dailyWorkId}/objections/{objectionId}/reject`

Reject an objection with rejection reason.

**Permissions:** `rfi-objections.review`

**Request Body:**
```json
{
  "rejection_reason": "Objection is not valid. The foundation depth matches the specification requirements for this soil type."
}
```

---

### 9. Upload Files to Objection
**POST** `/daily-works/{dailyWorkId}/objections/{objectionId}/files`

Upload supporting documents (photos, PDFs, drawings) to an objection.

**Permissions:** `rfi-objections.create` or `rfi-objections.update`

**Request Body (multipart/form-data):**
- `files[]` - Array of files (max 10 files)
- Supported formats: jpeg, jpg, png, webp, gif, pdf, doc, docx, xls, xlsx
- Max size per file: 10MB

**Response:**
```json
{
  "message": "3 file(s) uploaded successfully.",
  "files": [
    {
      "id": 1,
      "name": "site_photo_1.jpg",
      "url": "https://...",
      "thumb_url": "https://...",
      "mime_type": "image/jpeg",
      "size": 245678,
      "is_image": true,
      "is_pdf": false
    }
  ],
  "errors": [],
  "total_files": 5
}
```

---

### 10. Get Files for Objection
**GET** `/daily-works/{dailyWorkId}/objections/{objectionId}/files`

Get all files attached to an objection.

**Permissions:** `rfi-objections.view`

**Response:**
```json
{
  "files": [ ... ],
  "total": 5
}
```

---

### 11. Delete File from Objection
**DELETE** `/daily-works/{dailyWorkId}/objections/{objectionId}/files/{mediaId}`

Delete a specific file from an objection.

**Permissions:** `rfi-objections.delete`

**Response:**
```json
{
  "message": "File deleted successfully.",
  "total_files": 4
}
```

---

### 12. Download File from Objection
**GET** `/daily-works/{dailyWorkId}/objections/{objectionId}/files/{mediaId}/download`

Download a specific file.

**Permissions:** `rfi-objections.view`

**Response:** File download

---

### 13. Delete Objection
**DELETE** `/daily-works/{dailyWorkId}/objections/{objectionId}`

Soft delete an objection (only draft objections can be deleted by creator).

**Permissions:** `rfi-objections.delete`

**Response:**
```json
{
  "message": "Objection deleted successfully."
}
```

---

### 14. Get Objection Metadata
**GET** `/daily-works/objections/metadata`

Get available categories and statuses for dropdowns.

**Response:**
```json
{
  "categories": [
    {
      "value": "design_conflict",
      "label": "Design Conflict"
    },
    {
      "value": "site_mismatch",
      "label": "Site Condition Mismatch"
    }
  ],
  "statuses": [
    {
      "value": "draft",
      "label": "Draft"
    },
    {
      "value": "submitted",
      "label": "Submitted"
    }
  ],
  "active_statuses": ["draft", "submitted", "under_review"]
}
```

---

## Objection Status Workflow

```
Draft → Submitted → Under Review → Resolved/Rejected
  ↓         ↓              ↓
Edit      Cannot         Cannot
          Edit           Edit
```

**Status Descriptions:**
- **draft** - Objection is being prepared, can be edited or deleted
- **submitted** - Objection submitted for review, notifications sent
- **under_review** - Objection is being reviewed by authorized personnel
- **resolved** - Objection has been addressed and resolved
- **rejected** - Objection determined to be invalid

**Active Statuses:** draft, submitted, under_review (blocks RFI submission date changes)

---

## Objection Categories

1. **design_conflict** - Design discrepancies or conflicts
2. **site_mismatch** - Site conditions don't match assumptions
3. **material_change** - Material substitution or unavailability
4. **safety_concern** - Safety issues or hazards
5. **specification_error** - Errors or ambiguities in specifications
6. **other** - Other objections requiring clarification

---

## RFI Submission Date Override

When changing an RFI submission date while active objections exist:

1. Backend checks for active objections
2. Returns warning response with objection list
3. Frontend shows ObjectionWarningModal
4. User must provide override reason
5. Backend logs override in `rfi_submission_override_logs` table
6. Change is allowed with full audit trail

**Override Log Fields:**
- `daily_work_id` - RFI being modified
- `old_submission_date` - Previous date
- `new_submission_date` - New date
- `active_objections_count` - Number of active objections at time of override
- `override_reason` - Reason provided by user
- `user_acknowledged` - User confirmed they understand the impact
- `overridden_by` - User who made the override
- `created_at` - Timestamp of override

---

## Notifications

Objection notifications are sent automatically:

**On Submission:**
- Sent to: RFI incharge, assigned user, managers, admins
- Event: objection_submitted

**On Resolution:**
- Sent to: Objection creator
- Event: objection_resolved

**On Rejection:**
- Sent to: Objection creator
- Event: objection_rejected

Notifications include:
- Objection details
- RFI information
- Link to view objection
- Timestamp and actor

---

## Authorization

Objection access is controlled by policies:

- **View:** Anyone involved in the RFI or with review permissions
- **Create:** RFI incharge, assigned user, or authorized roles
- **Update:** Objection creator (draft only)
- **Delete:** Objection creator (draft only) or admins
- **Review/Resolve:** Admins, managers, consultants

---
