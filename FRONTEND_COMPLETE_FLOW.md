# Complete Frontend Flow Documentation - For Flutter Development

This document describes the **entire frontend user journey** from subscription to document creation and signing. Use this guide to implement the complete flow in your Flutter application.

## Table of Contents

1. [Overview](#overview)
2. [Complete User Journey](#complete-user-journey)
3. [Subscription Flow](#subscription-flow)
4. [Document Creation Flow](#document-creation-flow)
5. [Signature Field Assignment](#signature-field-assignment)
6. [Package Review & Settings](#package-review--settings)
7. [Package Submission](#package-submission)
8. [State Management](#state-management)
9. [Key Components Breakdown](#key-components-breakdown)
10. [API Integration Points](#api-integration-points)
11. [Flutter Implementation Guidelines](#flutter-implementation-guidelines)

---

## Overview

### Architecture
- **Framework**: React with TypeScript
- **State Management**: Redux Toolkit
- **Payment Processing**: Stripe.js
- **PDF Rendering**: PDF.js
- **Routing**: React Router with protected routes

### Key Concepts
1. **Subscription Requirement**: Users MUST have an active subscription to create documents
2. **Document Credits**: Each document uses credits based on unique signers (1 credit = up to 2 signers)
3. **Package Status**: Draft → Sent → In Progress → Completed
4. **Field Assignment**: Fields can have Signers, Form Fillers, or Approvers
5. **Signature Methods**: Email OTP, SMS OTP, or both

---

## Complete User Journey

```
1. Registration & Email Verification
   ↓
2. Login & Authentication
   ↓
3. Subscribe to a Plan (with Trial option)
   ↓
4. Add Payment Method
   ↓
5. Create Document Package
   ├─ Step 1: Upload PDF or Select Template
   ├─ Step 2: Add Fields & Assign Participants
   └─ Step 3: Review & Configure Settings
   ↓
6. Send Package (Status: Draft → Sent)
   ↓
7. Participants Sign Documents
   ↓
8. Track Package Status
```

---

## Subscription Flow

### 1. Subscription Status Check

**Route Protection**: `/add-document` route uses `SubscriptionRequiredRoute` with `requiresPackageCreation={true}`

**Status Check Logic**:
```typescript
// The system checks:
- hasActiveSubscription: boolean
- canCreatePackages: boolean (checks document limits)
- documentLimit: number
- documentsUsed: number
```

**API Endpoint**: `GET /api/subscriptions/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "hasActiveSubscription": true,
    "canCreatePackages": true,
    "status": "ACTIVE",
    "documentsUsed": 5,
    "documentLimit": 50,
    "reason": null
  }
}
```

### 2. Plan Selection

**Component**: `PlanSelection.tsx`

**Flow**:
1. Fetch available plans: `GET /api/plans`
2. Display plans with monthly/yearly toggle
3. User selects a plan
4. Open `PurchaseModal`

**Plan Structure**:
```typescript
interface Plan {
  _id: string;
  name: string; // "Starter", "Professional", "Enterprise"
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string; // Stripe Price ID
  yearlyPriceId: string; // Stripe Price ID
  features: string[];
  documentLimit: number;
}
```

### 3. Payment Method Selection/Addition

**Component**: `PurchaseModal.tsx`

**Flow**:
1. Check existing payment methods: `GET /api/payment-methods`
2. If no payment methods → Show card form
3. If payment methods exist → Show selection list
4. User can:
   - Select existing payment method
   - Add new card (Stripe Elements form)

**Adding New Payment Method**:
```typescript
// 1. Create payment method with Stripe
const { paymentMethod } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement
});

// 2. Attach to user account
POST /api/payment-methods/attach
{
  "paymentMethodId": "pm_xxxxx"
}
```

### 4. Subscription Purchase

**Two Options**:

**Option A: Start Free Trial** (if user hasn't had trial before)
```typescript
POST /api/subscriptions/trial
{
  "priceId": "price_monthly_professional",
  "paymentMethodId": "pm_xxxxx"
}
```

**Option B: Purchase Subscription**
```typescript
POST /api/subscriptions/create
{
  "priceId": "price_monthly_professional",
  "paymentMethodId": "pm_xxxxx"
}
```

**Response**: Returns Stripe subscription object with payment intent for 3D Secure if needed

**After Purchase**:
1. Invalidate subscription status cache
2. Refresh subscription details
3. Redirect to dashboard
4. User can now create documents

---

## Document Creation Flow

### Step 1: Document Selection

**Component**: `Step1_DocumentSelection.tsx`
**Route**: `/add-document`

#### A. Upload New PDF

**Flow**:
1. User drags & drops or selects PDF file
2. Validate: File must be PDF, max size (check backend)
3. Upload to backend: `POST /api/packages/upload`
4. Response contains:
   ```json
   {
     "attachment_uuid": "uuid-here",
     "fileUrl": "/public/path/to/file.pdf",
     "s3Key": "s3-key-here"
   }
   ```
5. Store in Redux: `startPackageCreation()`
6. Load PDF for preview using PDF.js

**Key State**:
```typescript
interface DocumentPackage {
  _id?: string; // MongoDB ID if draft exists, or temp ID
  name: string; // Package title
  attachment_uuid: string;
  fileUrl: string;
  s3Key: string; // REQUIRED for new packages
  downloadUrl?: string;
  fileData?: ArrayBuffer; // For preview
  templateId?: string;
  fields: PackageField[];
  receivers: Receiver[];
  options: PackageOptions;
  customMessage: string;
  status: 'Draft' | 'Sent' | 'In Progress' | 'Completed';
}
```

#### B. Select Existing Template

**Flow**:
1. Fetch templates: `GET /api/templates`
2. User selects template from dropdown
3. Fetch template details: `GET /api/templates/:id`
4. Download template PDF from `downloadUrl`
5. Create package from template with pre-configured fields
6. Store in Redux with template's fields (reset `assignedUsers` to empty arrays)

**Package Title**: User can edit the title (required, min 3 chars)

**Validation**: Cannot proceed to Step 2 without:
- Package title (min 3 characters)
- Document uploaded or template selected
- `attachment_uuid` present

---

### Step 2: Field Assignment

**Component**: `Step2_FieldAssignment.tsx`

#### A. PDF Rendering

**Flow**:
1. Load PDF from `fileData`, `downloadUrl`, or `fileUrl`
2. Use PDF.js to render all pages to canvas
3. Maintain page dimensions and scale for field positioning
4. Display all pages in scrollable view

#### B. Adding Fields to Document

**Available Field Types**:
- `signature` - Digital signature field (requires Signer)
- `text` - Text input field
- `textarea` - Multi-line text input
- `checkbox` - Checkbox field
- `radio` - Radio button (requires groupId)
- `date` - Date picker field
- `dropdown` - Dropdown selection

**How Fields are Added**:
1. User selects field type from toolbar (`EditorToolbar`)
2. Drag field type onto PDF page
3. Field is dropped at mouse position (snapped to grid)
4. Default dimensions based on field type:
   ```typescript
   signature: { width: 150, height: 50 }
   text: { width: 180, height: 35 }
   textarea: { width: 200, height: 80 }
   checkbox/radio: { width: 25, height: 25 }
   date: { width: 120, height: 35 }
   dropdown: { width: 150, height: 35 }
   ```
5. Field stored with:
   ```typescript
   {
     id: string; // Generated ID
     type: FieldType;
     page: number; // Page number (1-indexed)
     x: number; // Position X
     y: number; // Position Y
     width: number;
     height: number;
     label: string;
     required: boolean; // signature fields are required by default
     placeholder?: string; // For text/textarea
     options?: Option[]; // For radio/dropdown
     groupId?: string; // For radio buttons
     assignedUsers: AssignedUser[];
   }
   ```

#### C. Field Properties & User Assignment

**Component**: `PackageFieldPropertiesPanel.tsx`

**Properties Panel Opens When**:
- User clicks on a field in the document
- Shows field-specific properties

**Field Properties**:
1. **Label**: Display name (signature fields cannot change label)
2. **Placeholder**: For text/textarea fields
3. **Required**: Checkbox to mark field as required
4. **Options**: For radio/dropdown (comma-separated)
5. **Group ID**: For radio buttons (all radio buttons with same groupId act as one choice)

**User Assignment**:
1. Select contact from dropdown (searches existing contacts)
2. Select role:
   - **Signer**: Only for signature fields (1 signer max per signature field)
   - **FormFiller**: For text/textarea/checkbox/radio/date/dropdown fields
   - **Approver**: For any field type (for approval workflow)

3. **For Signers Only**: Select signature methods:
   - ☑️ Email OTP (required, at least one method)
   - ☑️ SMS OTP

4. Click "Add Assignment"
5. User appears in "Assigned Users" list
6. Can remove assignment by clicking X

**Assigned User Structure**:
```typescript
interface AssignedUser {
  id: string; // Assignment ID
  contactId: string; // Contact ID
  contactName: string; // Full name
  contactEmail: string;
  role: 'Signer' | 'FormFiller' | 'Approver';
  signatureMethods?: ('Email OTP' | 'SMS OTP')[]; // Only for Signers
}
```

**Contact Selection**:
- Searchable dropdown with existing contacts
- Option to "Add New Contact" opens modal
- New contact automatically selected after creation

**Validation**:
- Signature fields: Maximum 1 Signer
- Required fields: Must have at least one assigned user before sending
- Signature methods: At least one method required for Signers

---

### Step 3: Review & Settings

**Component**: `Step3_PackageReview.tsx`

#### A. Document Preview

- Shows all pages with field overlays
- Fields colored by status:
  - 🔴 Red: Required field without assignment
  - 🟢 Green: Field with assignment
  - 🟡 Yellow: Optional field without assignment
- View modes: "Fit Width" or "Actual Size"
- Shows assigned users below each field

#### B. Summary Tab

**Shows**:
- Package title
- Optional message for participants (included in email)
- **Statistics**:
  - Total fields count
  - Unique recipients count
  - Page count
- **Document Credit Usage**:
  - Calculates: `Math.ceil(uniqueSigners / 2)`
  - Shows credits needed (1 credit = up to 2 signers)
  - Example: 3 signers = 2 credits, 5 signers = 3 credits
- **Assignment Progress**: Progress bar showing completion %
- **Warning**: If required fields are unassigned

#### C. Recipients Tab

**Two Types of Recipients**:

1. **Assigned Participants** (from fields):
   - Lists all users assigned to fields
   - Shows their role (Signer/FormFiller/Approver)
   - Automatically calculated

2. **Notification-Only Receivers**:
   - Users who receive email notifications but don't sign
   - Add via contact dropdown
   - Can remove from list

#### D. Settings Tab

**Package Expiration**:
- Set expiration date/time (datetime-local input)
- Cannot be in the past
- Optional

**Expiration Reminders**:
- Checkbox: "Send Expiration Reminders"
- Select reminder timing:
  - 1 Hour Before
  - 2 Hours Before
  - 24 Hours Before
  - 48 Hours Before
- Only available if expiration date is set
- Only shows options valid for expiration date

**Automatic Reminders**:
- Checkbox: "Enable Automatic Reminders"
- First reminder: N days before expiration (number input, max = days until expiry)
- Follow-up reminders: Repeat every N days (max = first reminder days)
- Only available if expiration date is set and expiry is > 1 day away

**Permissions**:
- ☑️ "Allow download before signing is complete"
- ☑️ "Allow participants to reassign their role"

**Package Options Structure**:
```typescript
interface PackageOptions {
  expiresAt: string | null; // ISO date string
  sendExpirationReminders: boolean;
  reminderPeriod: string | null; // e.g., "1_day_before"
  sendAutomaticReminders: boolean;
  firstReminderDays: number | null;
  repeatReminderDays: number | null;
  allowDownloadUnsigned: boolean;
  allowReassign: boolean;
}
```

---

## Package Submission

### Save as Draft

**Flow**:
1. User clicks "Save as Draft" button
2. Validate package has document and title
3. Call API:

**If editing existing draft** (has MongoDB ID):
```
PATCH /api/packages/:packageId
{
  "name": "...",
  "fields": [...],
  "status": "Draft",
  ...
}
```

**If new package**:
```
POST /api/packages
{
  "name": "...",
  "s3Key": "...", // REQUIRED
  "attachment_uuid": "...",
  "fields": [...],
  "status": "Draft",
  ...
}
```

4. Success → Clear Redux state, redirect to dashboard

### Save as Template

**Flow**:
1. User clicks "Save as Template"
2. Same API call but with `saveAsTemplate: true` flag
3. Creates a reusable template with fields
4. Success → Clear state, redirect to dashboard

### Confirm & Send Package

**Validation Checks**:
1. Package title exists and is valid
2. Document is uploaded/selected
3. **All required fields have assigned users**
4. At least one field exists

**Flow**:
1. Validate all requirements
2. Calculate document credits needed
3. Check user has sufficient credits
4. Call API:

```
POST /api/packages (or PATCH if editing)
{
  "name": "...",
  "s3Key": "...",
  "attachment_uuid": "...",
  "fields": [...],
  "receivers": [...],
  "options": {...},
  "customMessage": "...",
  "templateId": "...", // Optional
  "status": "Sent"
}
```

**Response**: Returns complete package object with MongoDB `_id`

**After Sending**:
1. Show success toast
2. Clear Redux package state
3. Redirect to dashboard
4. Participants receive email notifications

---

## State Management

### Redux Store Structure

```typescript
// Packages State
{
  packages: {
    packages: DocumentPackage[]; // All packages list
    currentPackage: DocumentPackage | null; // Current package being created/edited
    selectedFieldId: string | null;
    loading: boolean;
    error: string | null;
    isCreatingOrEditingPackage: boolean;
    activeStep: number; // 0, 1, or 2
  }
}

// Subscription State
{
  subscription: {
    subscription: Subscription | null;
    subscriptionStatus: SubscriptionStatus | null;
    loading: boolean;
    error: string | null;
  }
}

// Contacts State
{
  contacts: {
    contacts: Contact[];
    loading: boolean;
    error: string | null;
  }
}

// Plans State
{
  plans: {
    plans: Plan[];
    loading: boolean;
    error: string | null;
  }
}

// Payment Methods State
{
  paymentMethods: {
    paymentMethods: PaymentMethod[];
    loading: boolean;
    error: string | null;
  }
}
```

### Key Redux Actions

**Package Actions**:
- `startPackageCreation()` - Initialize new package
- `setCurrentPackage()` - Set current package (for editing)
- `setPackageTitle()` - Update package name
- `addFieldToCurrentPackage()` - Add field to document
- `updateFieldInCurrentPackage()` - Update field properties
- `deleteFieldFromCurrentPackage()` - Remove field
- `assignUserToField()` - Assign contact to field
- `removeUserFromField()` - Remove contact from field
- `addReceiverToPackage()` - Add notification-only receiver
- `updatePackageOptions()` - Update package settings
- `setPackageActiveStep()` - Change stepper step
- `clearPackageState()` - Reset package state

**Subscription Actions**:
- `fetchSubscription()` - Get subscription details
- `fetchSubscriptionStatus()` - Get status (can create packages?)
- `createSubscription()` - Purchase subscription
- `createTrialSubscription()` - Start trial

---

## Key Components Breakdown

### 1. PackageCreationStepper

**Purpose**: Main stepper component that orchestrates the 3-step flow

**Features**:
- Progress indicator (3 steps)
- Navigation buttons (Previous/Next) on left side
- Step validation before allowing next
- Action buttons on final step (Save Draft, Save Template, Confirm & Send)

**Steps**:
- Step 0: Document Selection
- Step 1: Field Assignment
- Step 2: Review & Settings

### 2. EditorToolbar

**Purpose**: Toolbar with draggable field types

**Field Types Available**:
- Signature
- Text
- Textarea
- Checkbox
- Radio
- Date
- Dropdown

**How It Works**:
- Fields are draggable
- On drop on PDF page, creates field at drop position
- Uses HTML5 drag & drop API

### 3. PackageFieldRenderer

**Purpose**: Renders individual fields on PDF pages

**Features**:
- Shows field boundaries
- Highlights selected field
- Shows assigned users below field
- Allows dragging to reposition
- Allows resizing
- Shows validation state (red for required unassigned)

### 4. SearchableContactDropdown

**Purpose**: Search and select contacts for field assignment

**Features**:
- Search contacts by name/email
- Create new contact option
- Shows contact details (name, email)
- Returns selected contact object

### 5. SubscriptionRequiredRoute

**Purpose**: Route guard that checks subscription before allowing access

**Checks**:
- `requiresActiveSubscription`: User must have active subscription
- `requiresPackageCreation`: User must be able to create packages (checks limits)

**On Failure**: Redirects to `/subscription-required` with reason

---

## API Integration Points

### Authentication Required

All API calls (except public routes) require JWT token in header:
```
Authorization: Bearer <token>
```

### Subscription APIs

```
GET  /api/subscriptions/status     - Check subscription status
GET  /api/subscriptions             - Get subscription details
POST /api/subscriptions/create      - Create subscription
POST /api/subscriptions/trial      - Start trial
GET  /api/plans                     - Get available plans
GET  /api/payment-methods           - Get user's payment methods
POST /api/payment-methods/attach    - Add payment method
```

### Package APIs

```
POST   /api/packages/upload         - Upload PDF file (returns attachment_uuid, fileUrl, s3Key)
GET    /api/packages                - Get all packages
GET    /api/packages/:id            - Get package by ID
POST   /api/packages                - Create new package
PATCH  /api/packages/:id            - Update package
DELETE /api/packages/:id           - Delete package
```

### Contact APIs

```
GET    /api/contacts                - Get all contacts (with search)
GET    /api/contacts/:id            - Get contact by ID
POST   /api/contacts                - Create contact
PATCH  /api/contacts/:id            - Update contact
DELETE /api/contacts/:id           - Delete contact
```

### Template APIs

```
GET    /api/templates               - Get all templates
GET    /api/templates/:id          - Get template by ID
POST   /api/templates               - Create template from package
```

---

## Flutter Implementation Guidelines

### 1. Navigation Structure

**Implement Similar Route Guards**:
```dart
// Check subscription before allowing access
Future<bool> canCreatePackages() async {
  final status = await api.get('/api/subscriptions/status');
  return status['canCreatePackages'] == true;
}

// Protect routes
if (!await canCreatePackages()) {
  Navigator.pushNamed(context, '/subscription-required');
  return;
}
```

### 2. State Management

**Recommended**: Use Provider, Riverpod, or Bloc

**State Structure**:
```dart
class PackageState {
  DocumentPackage? currentPackage;
  int activeStep = 0;
  List<PackageField> fields = [];
  bool isLoading = false;
}
```

### 3. PDF Rendering

**Recommended Packages**:
- `syncfusion_flutter_pdfviewer` or
- `flutter_pdfview` or
- `pdfx`

**Key Requirements**:
- Render PDF pages
- Allow field positioning on PDF
- Maintain page dimensions for coordinates
- Show field overlays

### 4. Field Position System

**Coordinate System**:
- PDF pages have absolute dimensions (width x height pixels)
- Fields positioned using (x, y) coordinates relative to page top-left
- Store positions in original PDF dimensions
- Scale coordinates when displaying on screen

**Field Rendering**:
```dart
// Example: Render field on PDF
Positioned(
  left: field.x * scaleFactor,
  top: field.y * scaleFactor,
  width: field.width * scaleFactor,
  height: field.height * scaleFactor,
  child: FieldWidget(field: field),
)
```

### 5. Drag & Drop Implementation

**Option 1**: Use `Draggable` and `DragTarget` widgets
**Option 2**: Use gesture detector for touch drag

```dart
// Example structure
Draggable<String>(
  data: 'signature', // Field type
  child: FieldTypeButton('Signature'),
  feedback: DraggingWidget(),
)

DragTarget<String>(
  onAccept: (fieldType) {
    // Get drop position from gesture
    // Create field at position
    addField(fieldType, position);
  },
  child: PdfPageWidget(),
)
```

### 6. Stepper Implementation

**Flutter Stepper Widget**:
```dart
Stepper(
  currentStep: activeStep,
  onStepContinue: () {
    if (validateStep()) {
      setState(() => activeStep++);
    }
  },
  onStepCancel: () {
    setState(() => activeStep--);
  },
  steps: [
    Step(title: Text('Document Selection'), content: Step1Widget()),
    Step(title: Text('Field Assignment'), content: Step2Widget()),
    Step(title: Text('Review & Settings'), content: Step3Widget()),
  ],
)
```

### 7. Stripe Integration

**Package**: `flutter_stripe`

```dart
// Initialize Stripe
await Stripe.publishableKey = stripePublishableKey;

// Create payment method
final paymentMethod = await Stripe.instance.createPaymentMethod(
  PaymentMethodParams.card(paymentMethodParams: ...)
);

// Use payment method ID for subscription
await api.post('/api/subscriptions/create', {
  'priceId': selectedPlan.priceId,
  'paymentMethodId': paymentMethod.id,
});
```

### 8. File Upload

**Use `http` or `dio` for multipart upload**:
```dart
final formData = FormData.fromMap({
  'file': MultipartFile.fromFileSync(
    pdfPath,
    filename: 'document.pdf',
  ),
});

final response = await dio.post(
  '/api/packages/upload',
  data: formData,
);
```

### 9. Contact Search

**Implement Searchable List**:
```dart
TextField(
  onChanged: (query) {
    // Filter contacts
    filteredContacts = contacts.where((contact) {
      return contact.name.toLowerCase().contains(query.toLowerCase());
    }).toList();
  },
  decoration: InputDecoration(
    hintText: 'Search contacts...',
    prefixIcon: Icon(Icons.search),
  ),
)
```

### 10. Form Validation

**Use `flutter_form_builder` or custom validation**:

```dart
// Package title validation
if (packageName.length < 3) {
  showError('Package title must be at least 3 characters');
  return false;
}

// Required field validation
final unassignedFields = fields.where((field) {
  return field.required && 
         (field.assignedUsers == null || field.assignedUsers.isEmpty);
}).toList();

if (unassignedFields.isNotEmpty) {
  showError('Please assign users to required fields');
  return false;
}
```

### 11. Error Handling

**Implement Error States**:
```dart
try {
  await savePackage();
} catch (e) {
  if (e is SubscriptionError) {
    // Show subscription required message
    Navigator.pushNamed(context, '/subscription-required');
  } else if (e is ValidationError) {
    // Show validation error
    showSnackBar(e.message);
  } else {
    // Generic error
    showSnackBar('An error occurred. Please try again.');
  }
}
```

### 12. Loading States

**Show Loading Indicators**:
```dart
// Upload state
if (isUploading) {
  return CircularProgressIndicator();
}

// Saving state
ElevatedButton(
  onPressed: isSaving ? null : () => savePackage(),
  child: isSaving 
    ? CircularProgressIndicator() 
    : Text('Save Package'),
)
```

---

## Important Notes for Flutter Development

### 1. Subscription Checks Are Critical

- **ALWAYS** check subscription status before allowing document creation
- Use the status endpoint to determine if user can create packages
- Show appropriate UI when limits are reached

### 2. Document Credits Calculation

```dart
int calculateCredits(List<PackageField> fields) {
  final uniqueSigners = <String>{};
  
  fields.forEach((field) {
    if (field.type == 'signature') {
      field.assignedUsers?.forEach((user) {
        if (user.role == 'Signer') {
          uniqueSigners.add(user.contactId);
        }
      });
    }
  });
  
  // 1 credit per 2 signers (rounded up)
  return uniqueSigners.length > 0 
    ? ((uniqueSigners.length + 1) ~/ 2) 
    : 1;
}
```

### 3. Field Position Persistence

- Store absolute coordinates in original PDF dimensions
- Scale coordinates when displaying on different screen sizes
- Maintain aspect ratio when scaling

### 4. Required Field Validation

- Signature fields are required by default
- Cannot send package if required fields are unassigned
- Show clear visual indicators (red borders) for invalid fields

### 5. Signature Method Selection

- Signers must have at least one method (Email OTP or SMS OTP)
- Both methods can be selected
- Only applies to users with role "Signer"

### 6. Package Status Flow

```
Draft → Sent → In Progress → Completed
  ↑        ↓
  └────────┘ (can edit draft)
```

- Drafts can be edited
- Once Sent, cannot edit fields
- Status updates automatically as participants sign

### 7. Template vs Package

- Templates are reusable document layouts with pre-configured fields
- Packages are instances created from templates or uploaded PDFs
- Templates don't have assigned users (users assigned when creating package from template)

### 8. File Storage

- Upload returns `attachment_uuid`, `fileUrl`, and `s3Key`
- **`s3Key` is REQUIRED** when creating new packages
- Use `downloadUrl` for previewing templates
- Use `fileUrl` for existing packages

### 9. Payment Processing

- Stripe integration required
- Handle 3D Secure authentication
- Show appropriate loading states during payment
- Invalidate cache after successful purchase

### 10. Real-time Updates

Consider implementing WebSocket connection for:
- Package status updates
- Signature completion notifications
- Subscription status changes

---

## Testing Checklist

### Subscription Flow
- [ ] User can view available plans
- [ ] User can select monthly/yearly billing
- [ ] User can add payment method
- [ ] User can start free trial (if eligible)
- [ ] User can purchase subscription
- [ ] Subscription status updates after purchase
- [ ] User can create documents after subscription

### Document Creation Flow
- [ ] User can upload PDF file
- [ ] User can select template
- [ ] PDF preview renders correctly
- [ ] Fields can be added to document
- [ ] Fields can be positioned and resized
- [ ] Contacts can be assigned to fields
- [ ] Signature methods can be selected for signers
- [ ] Package settings can be configured
- [ ] Package can be saved as draft
- [ ] Package can be saved as template
- [ ] Package can be sent (with validation)

### Validation
- [ ] Required field validation works
- [ ] Package title validation works
- [ ] Document credit calculation is correct
- [ ] Cannot send without required fields assigned
- [ ] Signature field can only have one signer

---

## Summary

This documentation covers the complete flow from subscription to document creation:

1. **Subscription is mandatory** - Users must subscribe before creating documents
2. **3-Step Creation Process** - Document Selection → Field Assignment → Review & Settings
3. **Field Assignment** - Drag fields onto PDF, assign contacts with roles, configure properties
4. **Credit System** - Documents consume credits based on unique signers (1 credit = 2 signers)
5. **State Management** - Redux manages all package, subscription, and contact state
6. **API Integration** - RESTful APIs for all operations with JWT authentication
7. **Stripe Payment** - Integrated payment processing for subscriptions

Use this guide to implement a feature-complete Flutter application that matches the React frontend functionality.

