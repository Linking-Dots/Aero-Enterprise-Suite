# Daily Works Objection System - Complete Flow Guide

**Document Purpose:** Complete guide showing where objections can be raised, how they flow through the system, and how they're utilized in daily works.

---

## 📍 Where Objections Can Be Raised

### Entry Point: Daily Works Table

Objections are raised from the **Daily Works page** for any RFI (Request for Inspection) entry.

**Navigation Path:**
```
Dashboard → Daily Works → View any RFI → Click "View Objections" button → Raise New Objection
```

**Who Can Raise Objections:**
1. **RFI Incharge** - The supervising engineer assigned to the RFI
2. **RFI Assigned User** - The inspector assigned to the RFI
3. **Administrators** - System admins and project managers
4. **Consultants** - External consultants with review permissions

**Permission Required:** `rfi-objections.create`

---

## 🔄 Complete Objection Flow (Step-by-Step)

### Phase 1: Raising an Objection

#### Step 1: Access the Objections Modal
```
User Action:
├─ Navigate to Daily Works page
├─ Find the RFI with an issue
├─ Click "View Objections" button on the RFI card
└─ ObjectionsModal opens
```

**Visual Indicator:**
- RFIs with active objections show an orange/warning badge with count
- Example: "🔴 2 active objections"

#### Step 2: Create New Objection
```
User Action:
├─ Click "Raise New Objection" button
├─ Fill in objection form:
│  ├─ Title: Brief description (e.g., "Foundation depth discrepancy")
│  ├─ Category: Select from dropdown
│  │  ├─ Design Conflict
│  │  ├─ Site Condition Mismatch
│  │  ├─ Material Change
│  │  ├─ Safety Concern
│  │  ├─ Specification Error
│  │  └─ Other
│  ├─ Description: Detailed explanation of the issue
│  ├─ Reason: Why this objection is being raised
│  └─ Files: Upload supporting documents (optional)
│     ├─ Photos of site conditions
│     ├─ PDF drawings
│     ├─ Excel calculations
│     └─ Word documents
└─ Choose action:
   ├─ "Save as Draft" - Save for later submission
   └─ "Submit" - Submit immediately for review
```

**Backend Processing:**
```php
// POST /daily-works/{dailyWorkId}/objections
RfiObjectionController::store()
├─ Validate input data
├─ Create objection record with status 'draft' or 'submitted'
├─ Set created_by = current user
├─ Create status log entry
├─ If submitted: Send notifications to stakeholders
└─ Return objection data to frontend
```

**What Happens:**
- Objection is saved to `rfi_objections` table
- Status log created in `rfi_objection_status_logs` table
- If submitted, email notifications sent to:
  - RFI incharge user
  - RFI assigned user
  - All administrators and managers
  - Project consultants

---

### Phase 2: Objection Workflow

#### Draft Status
```
Status: draft
├─ Creator can edit the objection
├─ Creator can add/remove files
├─ Creator can delete the objection
└─ Creator can submit for review
```

**Actions Available:**
- ✏️ Edit objection details
- 📎 Add more files
- 🗑️ Delete objection
- 📤 Submit for review

#### Submitted Status
```
Status: submitted
├─ Objection is locked (no more edits)
├─ Visible to all stakeholders
├─ Notifications sent to reviewers
└─ Waiting for reviewer action
```

**Notifications Sent To:**
- RFI Incharge
- RFI Assigned User
- Super Administrators
- Project Managers
- Consultants

**Actions Available:**
- 👁️ View details and files
- 🔍 Start review (by authorized reviewers)

#### Under Review Status
```
Status: under_review
├─ Reviewer is actively examining the objection
├─ Reviewer can view all details and files
├─ Reviewer prepares resolution or rejection
└─ Waiting for final decision
```

**Who Can Review:**
- Administrators
- Super Administrators
- Project Managers
- Consultants with review permission

**Permission Required:** `rfi-objections.review`

**Actions Available:**
- ✅ Resolve with notes
- ❌ Reject with reason

#### Resolved Status
```
Status: resolved
├─ Objection is addressed
├─ Resolution notes documented
├─ Resolver and timestamp recorded
├─ Notification sent to objection creator
└─ Objection becomes inactive (no longer blocks)
```

**Backend Processing:**
```php
// POST /daily-works/{dailyWorkId}/objections/{objectionId}/resolve
RfiObjectionController::resolve()
├─ Validate resolution notes provided
├─ Update objection:
│  ├─ status = 'resolved'
│  ├─ resolution_notes = provided notes
│  ├─ resolved_by = current user ID
│  └─ resolved_at = current timestamp
├─ Create status log entry
├─ Send notification to objection creator
└─ Return updated objection
```

**Notification Sent To:**
- Objection creator (person who raised it)

#### Rejected Status
```
Status: rejected
├─ Objection deemed invalid
├─ Rejection reason documented
├─ Resolver and timestamp recorded
├─ Notification sent to objection creator
└─ Objection becomes inactive (no longer blocks)
```

---

## 🎯 How Objections Are Utilized in Daily Works

### 1. Visual Indicators

#### On Daily Works Table
```
RFI Card Display:
├─ Badge: "🔴 2 active" (if objections exist)
├─ Color: Warning/Orange border
├─ Icon: Exclamation triangle
└─ Tooltip: "2 active objections - click to view"
```

**Code Location:**
- Frontend: `resources/js/Tables/DailyWorksTable.jsx`
- Line ~400-450: Objection badge rendering

**Purpose:**
- Quick visual scan of which RFIs have issues
- Immediate awareness of blocking conditions
- Click to open objections modal for details

---

### 2. Submission Date Protection

#### Blocking Mechanism
```
User tries to change RFI submission date
         ↓
System checks: active_objections_count > 0?
         ↓
    YES: Show Warning Modal
    NO: Allow direct update
```

**Warning Modal Flow:**
```
ObjectionWarningModal opens
├─ Display warning message:
│  "This RFI has 2 active objections"
├─ Show impacts:
│  ├─ May affect approval timelines
│  ├─ May impact official records
│  ├─ May cause discrepancies in claims
│  └─ May affect regulatory compliance
├─ List all active objections with details
├─ Show date change comparison:
│  Old date: 2025-12-01
│  New date: 2025-12-15
├─ Require override reason (mandatory text field)
└─ User must click "I Understand, Proceed Anyway"
```

**Backend Processing:**
```php
// When user provides override reason and confirms:
DailyWorkController::updateSubmissionDate()
├─ Validate override reason provided
├─ Create override log:
│  ├─ daily_work_id = RFI ID
│  ├─ old_submission_date = previous date
│  ├─ new_submission_date = new date
│  ├─ active_objections_count = current count
│  ├─ override_reason = user-provided reason
│  ├─ user_acknowledged = true
│  ├─ overridden_by = current user ID
│  └─ created_at = timestamp
├─ Log to rfi_submission_override_logs table
├─ Update RFI submission date
└─ Return success
```

**Code Location:**
- Frontend: `resources/js/Components/DailyWork/ObjectionWarningModal.jsx`
- Backend: `app/Http/Controllers/DailyWorkController.php` (submission date update method)
- Database: `rfi_submission_override_logs` table

**Purpose:**
- Prevent accidental date changes when issues are pending
- Maintain data integrity and compliance
- Create audit trail for all overrides
- Ensure management is aware of risks

---

### 3. Approval Workflow Impact

#### Active Objections Block Approval
```
RFI Approval Check:
├─ Count active objections (draft, submitted, under_review)
├─ If count > 0:
│  ├─ Show warning on approval screen
│  ├─ Require acknowledgment
│  └─ Log override if approved anyway
└─ If count = 0:
   └─ Normal approval process
```

**Business Logic:**
- Objections represent unresolved issues
- Active objections = blocking conditions
- Resolved/Rejected objections = non-blocking
- System prevents approvals without acknowledgment

---

### 4. Reporting & Documentation

#### Objection Data in Reports
```
Daily Work Reports Include:
├─ Total objections raised
├─ Active objections count
├─ Resolved objections count
├─ Objections by category
├─ Resolution time statistics
└─ Override log entries
```

**Data Sources:**
- `rfi_objections` table
- `rfi_objection_status_logs` table
- `rfi_submission_override_logs` table

**Purpose:**
- Quality control metrics
- Compliance documentation
- Performance analysis
- Trend identification

---

### 5. Notification System

#### Notification Flow Diagram
```
Objection Submitted
    ↓
Identify Stakeholders:
├─ RFI Incharge User
├─ RFI Assigned User
├─ Super Administrators
├─ Project Managers
└─ Consultants
    ↓
Send Email Notifications:
├─ Subject: "New Objection: [Title]"
├─ Body: Objection details
├─ Link: Direct link to view objection
└─ Attachments: None (links to files)
    ↓
Recipients receive notifications
    ↓
Recipients can click to view and take action
```

**Notification Events:**
1. **Objection Submitted** → Notify reviewers
2. **Objection Resolved** → Notify creator
3. **Objection Rejected** → Notify creator

**Code Location:**
- `app/Notifications/RfiObjectionNotification.php`
- `app/Http/Controllers/RfiObjectionController.php` (notifyStakeholders method)

---

## 📊 Real-World Usage Examples

### Example 1: Foundation Depth Issue

```
Scenario:
Inspector notices foundation depth doesn't match drawings

Step 1: Raise Objection
├─ Navigate to RFI "S2025-1201-001" in Daily Works
├─ Click "View Objections"
├─ Click "Raise New Objection"
├─ Title: "Foundation depth discrepancy"
├─ Category: "Design Conflict"
├─ Description: "Excavation shows rock layer at 2.5m depth, 
│   but drawings specify 2.0m foundation depth"
├─ Reason: "Site conditions require deeper foundation 
│   to reach stable rock layer"
├─ Upload 3 photos of excavation
└─ Click "Submit"

Step 2: Notification
├─ Email sent to:
│  ├─ Supervising Engineer (incharge)
│  ├─ QC Inspector (assigned)
│  ├─ Project Manager
│  └─ Structural Consultant
└─ Subject: "New Objection: Foundation depth discrepancy"

Step 3: Review
├─ Structural Consultant reviews objection
├─ Clicks "Start Review"
├─ Reviews photos and description
├─ Consults with design team
└─ Prepares resolution

Step 4: Resolution
├─ Consultant clicks "Resolve"
├─ Resolution notes: "Design team issued revised 
│   drawings (Rev B) dated 2025-12-18. Foundation 
│   depth increased to 2.8m to accommodate rock layer."
├─ Click "Confirm Resolution"
└─ Email sent to inspector who raised objection

Step 5: Utilization
├─ Objection marked as resolved (no longer blocks)
├─ RFI can proceed with approval
├─ Resolution documented in system
├─ Override log if submission date changed
└─ Objection appears in monthly reports
```

---

### Example 2: Material Unavailability

```
Scenario:
Specified concrete grade not available from suppliers

Step 1: Raise Objection (as Draft)
├─ Navigate to RFI "P2025-1202-015"
├─ Click "View Objections"
├─ Click "Raise New Objection"
├─ Title: "M30 concrete not available"
├─ Category: "Material Change"
├─ Description: "Specified M30 grade concrete not 
│   available from any supplier within 100km radius"
├─ Reason: "Need approval to use M35 grade as 
│   alternative (higher strength acceptable)"
├─ Upload supplier quotes (3 PDFs)
└─ Click "Save as Draft" (not ready to submit yet)

Step 2: Add More Information
├─ Review with procurement team
├─ Edit objection
├─ Add technical data sheet for M35 concrete
├─ Add cost comparison Excel sheet
└─ Update description with procurement findings

Step 3: Submit
├─ Click "Submit" on draft objection
└─ Notifications sent to reviewers

Step 4: Review and Approval
├─ Material Engineer reviews
├─ Clicks "Resolve"
├─ Resolution: "M35 grade approved as substitute. 
│   Mix design reviewed and accepted. Update RFI 
│   to reflect M35 grade."
└─ Objection resolved, work can proceed

Step 5: Daily Works Utilization
├─ RFI updated with new material specification
├─ Objection resolution referenced in RFI notes
├─ Cost impact (if any) documented
├─ Material change tracked for future reference
└─ Quality control updated to test M35 instead of M30
```

---

### Example 3: Safety Concern

```
Scenario:
Safety barriers insufficient at work zone

Step 1: Immediate Objection
├─ Navigate to RFI "S2025-1203-008"
├─ Click "View Objections"
├─ Click "Raise New Objection"
├─ Title: "Inadequate safety barriers"
├─ Category: "Safety Concern"
├─ Description: "Current safety barriers don't meet 
│   OSHA standards for elevated work area"
├─ Reason: "Risk of worker injury, potential liability"
├─ Upload 5 photos showing current setup
└─ Click "Submit" (urgent - no draft)

Step 2: Urgent Notification
├─ Email sent immediately to:
│  ├─ Site Safety Officer
│  ├─ Project Manager
│  ├─ Construction Manager
│  └─ HSE Consultant
└─ Subject: "URGENT: Safety Objection Raised"

Step 3: Immediate Action
├─ Safety Officer reviews objection
├─ Work STOPPED at site pending resolution
├─ Additional barriers procured
├─ Barriers installed same day
└─ Safety Officer clicks "Resolve"

Step 4: Resolution Documentation
├─ Resolution notes: "Additional safety barriers 
│   installed per OSHA requirements. Site inspection 
│   completed and approved. Work can resume."
├─ Upload 3 photos of corrected setup
└─ Objection resolved (same day)

Step 5: System Impact
├─ RFI submission date NOT changed (work stopped)
├─ Safety objection tracked in incident reports
├─ Resolution time: <8 hours (urgent)
├─ Used as training example for future work
└─ Added to monthly safety meeting discussion
```

---

## 🔐 Permission-Based Access

### View Objections
```
Who can view:
├─ RFI Incharge
├─ RFI Assigned User
├─ Administrators
├─ Managers
└─ Consultants

Permission: rfi-objections.view
```

### Create Objections
```
Who can create:
├─ RFI Incharge
├─ RFI Assigned User
├─ Administrators
└─ Managers

Permission: rfi-objections.create
```

### Edit/Delete Objections
```
Who can edit/delete:
├─ Objection creator (drafts only)
└─ Administrators (all objections)

Permission: rfi-objections.update, rfi-objections.delete
```

### Review/Resolve Objections
```
Who can review:
├─ Administrators
├─ Super Administrators
├─ Project Managers
└─ Consultants

Permission: rfi-objections.review
```

---

## 📈 Data Flow Summary

```
Daily Works Page
    ↓
User clicks "View Objections"
    ↓
Frontend: ObjectionsModal opens
    ↓
API Call: GET /daily-works/{id}/objections
    ↓
Backend: RfiObjectionController::index()
    ↓
Database: Query rfi_objections table
    ↓
Response: Return objections with files
    ↓
Frontend: Display objections list
    ↓
User clicks "Raise New Objection"
    ↓
Frontend: Show objection form
    ↓
User fills form and uploads files
    ↓
User clicks "Submit"
    ↓
API Call: POST /daily-works/{id}/objections
    ↓
Backend: RfiObjectionController::store()
    ↓
Database: Insert into rfi_objections
    ↓
Database: Insert into rfi_objection_status_logs
    ↓
Backend: Upload files to storage
    ↓
Backend: Send email notifications
    ↓
Response: Return created objection
    ↓
Frontend: Update objections list
    ↓
Frontend: Update RFI badge count
    ↓
Parent component refreshes
    ↓
Daily Works Table shows updated badge
```

---

## 🗄️ Database Integration

### Tables Used:

#### 1. rfi_objections (Main Storage)
```sql
Stores:
├─ Objection details (title, category, description, reason)
├─ Status (draft, submitted, under_review, resolved, rejected)
├─ Resolution data (notes, resolver, timestamp)
├─ Override data (reason, overridden_by, timestamp)
├─ Audit fields (created_by, updated_by, timestamps)
└─ Soft delete support (deleted_at)
```

#### 2. rfi_objection_status_logs (Audit Trail)
```sql
Stores:
├─ Status transitions (from_status, to_status)
├─ Change details (notes)
├─ User who made change (changed_by)
└─ Timestamp (changed_at)
```

#### 3. rfi_submission_override_logs (Compliance)
```sql
Stores:
├─ RFI being modified (daily_work_id)
├─ Date changes (old_submission_date, new_submission_date)
├─ Objection context (active_objections_count)
├─ Override justification (override_reason)
├─ User acknowledgment (user_acknowledged)
├─ User who overrode (overridden_by)
└─ Timestamp (created_at)
```

#### 4. media (File Storage - Spatie)
```sql
Stores:
├─ Uploaded files metadata
├─ File associations (model_type, model_id)
├─ Collection (objection_files)
├─ File paths and URLs
└─ MIME types and sizes
```

---

## 📱 Mobile Experience

### Mobile Flow
```
Mobile User opens Daily Works
    ↓
Tap RFI card with objection badge
    ↓
Tap "View Objections" button
    ↓
ObjectionsModal opens (responsive)
    ↓
Scroll through objections list
    ↓
Tap "Raise New Objection"
    ↓
Form displayed (vertical layout)
    ↓
Fill fields (touch-optimized inputs)
    ↓
Tap "Add files"
    ↓
Mobile file picker / camera opens
    ↓
Select photos or take new photos
    ↓
Files added to objection
    ↓
Tap "Submit"
    ↓
Success message displayed
    ↓
Modal closes
    ↓
RFI badge updates automatically
```

---

## 🎯 Key Takeaways

### Where Objections Are Raised:
1. **Daily Works Page** - Primary entry point
2. **Any RFI Entry** - Click "View Objections" button
3. **By Authorized Users** - Incharge, assigned, admins, consultants

### How Objections Flow:
1. **Draft** → Save and refine
2. **Submitted** → Notify reviewers
3. **Under Review** → Reviewer examines
4. **Resolved/Rejected** → Final decision with notes

### How They're Utilized:
1. **Visual Indicators** - Badges showing active count
2. **Blocking Mechanism** - Prevent date changes without override
3. **Approval Control** - Flag issues during approval process
4. **Reporting** - Track quality metrics and trends
5. **Notifications** - Keep stakeholders informed
6. **Audit Trail** - Complete history for compliance
7. **Documentation** - Reference for future work

### Business Value:
- **Quality Control** - Formal process for raising concerns
- **Risk Mitigation** - Prevent approvals with open issues
- **Compliance** - Audit trail for ISO 9001
- **Communication** - Automated stakeholder notifications
- **Documentation** - Permanent record of issues and resolutions
- **Accountability** - Track who raised and resolved issues

---

## 📞 Support & Questions

For detailed technical documentation:
- [`OBJECTION_SYSTEM_COMPREHENSIVE_REVIEW.md`](OBJECTION_SYSTEM_COMPREHENSIVE_REVIEW.md)

For testing procedures:
- [`OBJECTION_SYSTEM_TESTING_GUIDE.md`](OBJECTION_SYSTEM_TESTING_GUIDE.md)

For API integration:
- [`API_DAILY_WORKS.md`](API_DAILY_WORKS.md)

---

**Document Version:** 1.0  
**Last Updated:** December 18, 2025  
**Status:** Complete Flow Documentation
