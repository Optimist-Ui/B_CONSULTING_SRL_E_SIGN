# Flutter Template Selection & Document Signing Guide

Complete documentation for implementing template selection, document signing, and template draft saving in Flutter. This guide covers all features used in the web application.

**Document Version:** 2.0  
**Last Updated:** 2024-01-15  
**Based on:** Latest codebase (post-pull)  
**For:** Flutter App Development

## Table of Contents

1. [Overview](#overview)
2. [Template Selection Flow](#template-selection-flow)
3. [Document Signing with Template](#document-signing-with-template)
4. [Template Draft Saving](#template-draft-saving)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Data Models](#data-models)
7. [Complete Implementation Flow](#complete-implementation-flow)
8. [Features to Include/Exclude](#features-to-includeexclude)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Important Notes](#important-notes)

---

## Overview

This system allows users to:
1. **Select Templates**: Choose from existing document templates or upload new PDFs
2. **Create Packages**: Create signing packages from templates or new documents
3. **Save Drafts**: Save work-in-progress packages as drafts
4. **Save as Template**: Convert packages into reusable templates
5. **Edit Templates**: Modify existing templates and save changes

### Key Concepts

- **Template**: A reusable document with predefined fields (signature, text, checkbox, etc.)
- **Package**: A document instance created from a template or new PDF, ready for signing
- **Draft**: An unsaved or saved package that hasn't been sent yet
- **Field**: A position on the PDF where data needs to be entered (signature, text, checkbox, etc.)

---

## Template Selection Flow

### Step 1: Fetch Available Templates

**API Endpoint:**
```
GET /api/templates
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "templateId123",
      "name": "Employment Contract",
      "attachment_uuid": "uuid-123-456",
      "fileUrl": "https://s3.../template.pdf",
      "s3Key": "templates/user123/uuid-123-456.pdf",
      "downloadUrl": "https://s3.../signed-url?expires=...",
      "fields": [
        {
          "id": "field1",
          "type": "signature",
          "page": 1,
          "x": 100,
          "y": 200,
          "width": 200,
          "height": 50,
          "required": true,
          "label": "Employee Signature",
          "placeholder": "",
          "options": []
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Implementation Steps:**
1. Call API to fetch templates
2. Display templates in a list/dropdown
3. Show template name and field count
4. Handle loading and error states

---

### Step 2: Select a Template

**User Action:** User selects a template from the list

**API Endpoint:**
```
GET /api/templates/{templateId}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "templateId123",
    "name": "Employment Contract",
    "attachment_uuid": "uuid-123-456",
    "fileUrl": "https://s3.../template.pdf",
    "s3Key": "templates/user123/uuid-123-456.pdf",
    "downloadUrl": "https://s3.../signed-url?expires=...",
    "fields": [
      {
        "id": "field1",
        "type": "signature",
        "page": 1,
        "x": 100,
        "y": 200,
        "width": 200,
        "height": 50,
        "required": true,
        "label": "Employee Signature",
        "placeholder": "",
        "options": []
      }
    ]
  }
}
```

**Implementation Steps:**
1. Fetch template details by ID
2. Download PDF from `downloadUrl` (signed URL, expires in 1 hour)
3. Store template data in local state:
   - `templateId`: Template ID
   - `attachment_uuid`: UUID from template
   - `fileUrl`: S3 file URL
   - `s3Key`: S3 key (required for saving)
   - `downloadUrl`: Signed URL for PDF download
   - `fields`: Array of field definitions
4. Display PDF preview
5. Initialize package creation with template data

**Important Notes:**
- `downloadUrl` is a temporary signed URL (expires in 1 hour)
- Always store `s3Key` - it's required when saving packages/templates
- Fields from template should be copied to package with `assignedUsers: []`

---

### Step 3: Upload New PDF (Alternative to Template)

If user chooses to upload a new PDF instead of selecting a template:

**API Endpoint:**
```
POST /api/packages/upload
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
FormData:
  file: [PDF File]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attachment_uuid": "uuid-789-012",
    "fileUrl": "https://s3.../package.pdf",
    "s3Key": "packages/user123/uuid-789-012.pdf"
  }
}
```

**Implementation Steps:**
1. User selects PDF file
2. Upload file to server
3. Receive `attachment_uuid`, `fileUrl`, and `s3Key`
4. Initialize package creation with uploaded document
5. Fields array starts empty (user will add fields later)

---

## Document Signing with Template

### Complete Flow Diagram

```
1. User selects template
   ↓
2. Template data loaded (PDF + fields)
   ↓
3. User can:
   - Edit package title
   - Add/modify fields
   - Assign participants to fields
   ↓
4. User saves package:
   - Save as Draft (status: "Draft")
   - Save as Template (creates new template)
   - Send Package (status: "Sent")
```

### Step 1: Initialize Package from Template

**Local State Structure:**
```dart
class Package {
  String? _id; // MongoDB ID (if editing existing draft)
  String name; // Package/document title
  String attachment_uuid; // From template
  String fileUrl; // S3 URL
  String s3Key; // S3 key (REQUIRED)
  String? downloadUrl; // Temporary signed URL
  String? templateId; // Template ID (if created from template)
  List<Field> fields; // Field definitions
  List<Receiver> receivers; // Assigned participants
  PackageOptions options; // Package options
  String? customMessage; // Custom message for participants
  String status; // "Draft" | "Sent" | "Completed"
}
```

**Field Structure:**
```dart
class Field {
  String id; // Client-generated ID (nanoid/uuid)
  String type; // "text" | "signature" | "checkbox" | "radio" | "textarea" | "date" | "dropdown"
  int page; // Page number (1-indexed)
  double x; // X coordinate
  double y; // Y coordinate
  double width; // Field width
  double height; // Field height
  bool required; // Is field required?
  String label; // Field label
  String placeholder; // Placeholder text
  List<Option> options; // For dropdown/radio
  String? groupId; // For grouped fields
  List<AssignedUser> assignedUsers; // Assigned participants (empty when from template)
}
```

**When Template is Selected:**
```dart
// 1. Fetch template
final template = await fetchTemplate(templateId);

// 2. Download PDF (optional, for preview)
final pdfBytes = await downloadPdf(template.downloadUrl);

// 3. Initialize package
final package = Package(
  name: template.name,
  attachment_uuid: template.attachment_uuid,
  fileUrl: template.fileUrl,
  s3Key: template.s3Key, // CRITICAL: Must include s3Key
  downloadUrl: template.downloadUrl,
  templateId: template._id,
  fields: template.fields.map((f) => Field(
    ...f,
    assignedUsers: [], // Clear assigned users
  )).toList(),
  receivers: [],
  status: 'Draft',
);
```

---

### Step 2: Edit Package (Add Fields, Assign Participants)

This step is handled in the package creation flow. Users can:
- Add new fields to the document
- Modify existing fields
- Assign participants to fields
- Set field properties (required, label, etc.)

**Note:** This is part of the package creation flow, not template-specific.

---

### Step 3: Save Package

Users can save packages in three ways:

#### Option A: Save as Draft

**API Endpoint:**
```
POST /api/packages
```
or
```
PATCH /api/packages/{packageId}  // If editing existing draft
```

**Request Body:**
```json
{
  "name": "Employment Contract - John Doe",
  "attachment_uuid": "uuid-123-456",
  "fileUrl": "https://s3.../template.pdf",
  "s3Key": "templates/user123/uuid-123-456.pdf",
  "fields": [
    {
      "id": "field1",
      "type": "signature",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 50,
      "required": true,
      "label": "Employee Signature",
      "placeholder": "",
      "options": [],
      "assignedUsers": [
        {
          "id": "participantId1",
          "contactId": "contactId1",
          "contactName": "John Doe",
          "contactEmail": "john@example.com",
          "role": "Signer",
          "signatureMethods": ["Email OTP", "SMS OTP"]
        }
      ]
    }
  ],
  "receivers": [
    {
      "id": "participantId1",
      "contactId": "contactId1",
      "contactName": "John Doe",
      "contactEmail": "john@example.com",
      "role": "Signer"
    }
  ],
  "options": {
    "requireAllSignatures": true,
    "allowRejection": false
  },
  "templateId": "templateId123",
  "customMessage": "Please review and sign this document",
  "status": "Draft"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "packageId123",
    "name": "Employment Contract - John Doe",
    "status": "Draft",
    // ... rest of package data
  }
}
```

**Implementation:**
```dart
// Check if editing existing draft
final isExistingDraft = package._id != null && 
    RegExp(r'^[a-f\d]{24}$', caseSensitive: false).hasMatch(package._id!);

if (isExistingDraft) {
  // Update existing package
  final response = await api.patch(
    '/api/packages/${package._id}',
    package.toJson(),
  );
} else {
  // Create new package
  // IMPORTANT: Must include s3Key for new packages
  if (package.s3Key == null || package.s3Key!.isEmpty) {
    throw Exception('S3 key is required for new packages');
  }
  
  final response = await api.post(
    '/api/packages',
    package.toJson(),
  );
}
```

**Key Points:**
- Include `s3Key` when creating new packages (required)
- Include `templateId` if package was created from template
- Status is `"Draft"` - package is not sent yet
- Can be edited later by fetching with package ID

---

#### Option B: Save as Template

**API Endpoint:**
```
POST /api/templates
```
or
```
PATCH /api/templates/{templateId}  // If updating existing template
```

**Request Body (New Template):**
```json
{
  "name": "Employment Contract Template",
  "attachment_uuid": "uuid-123-456",
  "fileUrl": "https://s3.../template.pdf",
  "s3Key": "templates/user123/uuid-123-456.pdf",
  "fields": [
    {
      "id": "field1",
      "type": "signature",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 50,
      "required": true,
      "label": "Employee Signature",
      "placeholder": "",
      "options": []
    }
  ]
}
```

**Request Body (Update Template):**
```json
{
  "name": "Updated Employment Contract Template",
  "fields": [
    // Updated fields (assignedUsers removed)
  ]
}
```

**Implementation:**
```dart
// Remove assignedUsers from fields (templates don't have participants)
final templateFields = package.fields.map((field) {
  final fieldJson = field.toJson();
  fieldJson.remove('assignedUsers');
  return fieldJson;
}).toList();

if (package.templateId != null) {
  // Update existing template
  final response = await api.patch(
    '/api/templates/${package.templateId}',
    {
      'name': package.name,
      'fields': templateFields,
    },
  );
} else {
  // Create new template
  // IMPORTANT: Must include s3Key for new templates
  if (package.s3Key == null || package.s3Key!.isEmpty) {
    throw Exception('S3 key is required to create a template');
  }
  
  final response = await api.post(
    '/api/templates',
    {
      'name': package.name,
      'attachment_uuid': package.attachment_uuid,
      'fileUrl': package.fileUrl,
      's3Key': package.s3Key, // REQUIRED
      'fields': templateFields,
    },
  );
}
```

**Key Points:**
- Remove `assignedUsers` from fields (templates don't have participants)
- Include `s3Key` when creating new templates (required)
- Can update existing template if `templateId` exists
- Templates are reusable - can be selected again later

---

#### Option C: Send Package

Same as "Save as Draft" but with `status: "Sent"`.

**Additional Validation:**
- All required fields must have assigned users
- Package must have at least one receiver
- File must be uploaded

**Request Body:**
```json
{
  // ... same as draft
  "status": "Sent"
}
```

---

## Template Draft Saving

### Overview

Templates can be edited and saved as drafts. This allows users to:
1. Upload a PDF and add fields
2. Save work-in-progress without completing all fields
3. Edit existing templates
4. Save changes to templates

### Flow: Create New Template

```
1. User uploads PDF
   ↓
2. PDF uploaded to S3, receives attachment_uuid, fileUrl, s3Key
   ↓
3. User adds fields to PDF
   ↓
4. User enters template name
   ↓
5. User saves template
   ↓
6. Template created with all fields
```

### Flow: Edit Existing Template

```
1. User selects template to edit
   ↓
2. Template data loaded (PDF + fields)
   ↓
3. User modifies fields (add, edit, delete)
   ↓
4. User saves template
   ↓
5. Template updated (only name and fields can be updated)
```

### API Endpoints for Template Management

#### 1. Upload Template PDF

**Endpoint:**
```
POST /api/templates/upload
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request:**
```
FormData:
  template: [PDF File]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attachment_uuid": "uuid-123-456",
    "originalFileName": "contract.pdf",
    "fileUrl": "https://s3.../template.pdf",
    "s3Key": "templates/user123/uuid-123-456.pdf"
  }
}
```

**Implementation:**
```dart
final formData = FormData.fromMap({
  'template': await MultipartFile.fromPath('template', pdfPath),
});

final response = await api.post(
  '/api/templates/upload',
  formData,
  options: Options(
    headers: {'Content-Type': 'multipart/form-data'},
  ),
);

final uploadData = response.data['data'];
// Store: attachment_uuid, fileUrl, s3Key
```

---

#### 2. Create Template

**Endpoint:**
```
POST /api/templates
```

**Request:**
```json
{
  "name": "Employment Contract Template",
  "attachment_uuid": "uuid-123-456",
  "fileUrl": "https://s3.../template.pdf",
  "s3Key": "templates/user123/uuid-123-456.pdf",
  "fields": [
    {
      "id": "field1",
      "type": "signature",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 50,
      "required": true,
      "label": "Employee Signature",
      "placeholder": "",
      "options": []
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "templateId123",
    "name": "Employment Contract Template",
    // ... full template object
  }
}
```

**Validation:**
- `name` is required and must be at least 3 characters
- `attachment_uuid` must be unique per user
- `s3Key` is required
- `fields` array is required (can be empty)

---

#### 3. Update Template

**Endpoint:**
```
PATCH /api/templates/{templateId}
```

**Request:**
```json
{
  "name": "Updated Template Name",
  "fields": [
    // Updated fields array
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "templateId123",
    "name": "Updated Template Name",
    // ... updated template object
  }
}
```

**Important Notes:**
- Only `name` and `fields` can be updated
- `attachment_uuid`, `fileUrl`, `s3Key` cannot be changed
- Template must belong to the authenticated user

---

#### 4. Delete Template

**Endpoint:**
```
DELETE /api/templates/{templateId}
```

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully."
}
```

**Note:** This also deletes the PDF file from S3.

---

### Local Draft Management

**Recommended Approach:**
1. Store template draft in local state while editing
2. Auto-save to local storage (optional)
3. Save to server when user clicks "Save Template"
4. Clear draft after successful save

**Draft State Structure:**
```dart
class TemplateDraft {
  String? _id; // Template ID (if editing existing)
  String? name; // Template name
  String? attachment_uuid; // From upload
  String? fileUrl; // S3 URL
  String? s3Key; // S3 key (REQUIRED for new templates)
  List<Field> fields; // Field definitions
  Uint8List? pdfBytes; // Local PDF data (for preview)
}
```

**Save Logic:**
```dart
Future<void> saveTemplateDraft(TemplateDraft draft) async {
  // Validate
  if (draft.name == null || draft.name!.trim().isEmpty) {
    throw Exception('Template title cannot be empty');
  }
  
  if (draft._id != null) {
    // Update existing template
    await api.patch(
      '/api/templates/${draft._id}',
      {
        'name': draft.name,
        'fields': draft.fields.map((f) => f.toJson()).toList(),
      },
    );
  } else {
    // Create new template
    if (draft.s3Key == null || draft.s3Key!.isEmpty) {
      throw Exception('S3 key is missing. Please re-upload the document.');
    }
    
    await api.post(
      '/api/templates',
      {
        'name': draft.name,
        'attachment_uuid': draft.attachment_uuid,
        'fileUrl': draft.fileUrl,
        's3Key': draft.s3Key, // REQUIRED
        'fields': draft.fields.map((f) => f.toJson()).toList(),
      },
    );
  }
}
```

---

## API Endpoints Reference

### Template Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/templates` | Get all user templates | Yes |
| GET | `/api/templates/{templateId}` | Get template by ID | Yes |
| POST | `/api/templates/upload` | Upload template PDF | Yes |
| POST | `/api/templates` | Create new template | Yes |
| PATCH | `/api/templates/{templateId}` | Update template | Yes |
| DELETE | `/api/templates/{templateId}` | Delete template | Yes |

### Package Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/packages` | Get all user packages | Yes |
| GET | `/api/packages/{packageId}` | Get package by ID | Yes |
| POST | `/api/packages/upload` | Upload package PDF | Yes |
| POST | `/api/packages` | Create new package | Yes |
| PATCH | `/api/packages/{packageId}` | Update package | Yes |
| DELETE | `/api/packages/{packageId}` | Delete package | Yes |

### Participant Endpoints (Public)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/packages/participant/{packageId}/{participantId}` | Get package for participant | No |
| POST | `/api/packages/participant/{packageId}/{participantId}/send-otp` | Send email OTP | No |
| POST | `/api/packages/participant/{packageId}/{participantId}/verify-otp` | Verify email OTP | No |
| POST | `/api/packages/participant/{packageId}/{participantId}/send-sms-otp` | Send SMS OTP | No |
| POST | `/api/packages/participant/{packageId}/{participantId}/verify-sms-otp` | Verify SMS OTP | No |

---

## Data Models

### Template Model

```dart
class Template {
  String? _id; // MongoDB ObjectId
  String docuTemplateId; // Same as attachment_uuid
  String attachment_uuid; // Unique UUID
  String name; // Template name
  String fileUrl; // S3 URL
  String s3Key; // S3 object key
  String? downloadUrl; // Temporary signed URL (1 hour expiry)
  List<Field> fields; // Field definitions
  DateTime createdAt;
  DateTime updatedAt;
}
```

### Package Model

```dart
class Package {
  String? _id; // MongoDB ObjectId
  String name; // Package/document title
  String attachment_uuid; // Unique UUID
  String fileUrl; // S3 URL
  String? s3Key; // S3 object key (required for new packages)
  String? downloadUrl; // Temporary signed URL
  String? templateId; // Template ID (if created from template)
  List<Field> fields; // Field definitions with assignedUsers
  List<Receiver> receivers; // Assigned participants
  PackageOptions options; // Package options
  String? customMessage; // Custom message
  String status; // "Draft" | "Sent" | "Completed" | "Rejected" | "Revoked" | "Expired"
  DateTime createdAt;
  DateTime updatedAt;
}
```

### Field Model

```dart
class Field {
  String id; // Client-generated ID (nanoid/uuid)
  String type; // "text" | "signature" | "checkbox" | "radio" | "textarea" | "date" | "dropdown"
  int page; // Page number (1-indexed)
  double x; // X coordinate (top-left)
  double y; // Y coordinate (top-left)
  double width; // Field width
  double height; // Field height
  bool required; // Is field required?
  String label; // Field label
  String placeholder; // Placeholder text
  List<Option> options; // For dropdown/radio fields
  String? groupId; // For grouped fields
  List<AssignedUser>? assignedUsers; // Only in packages, not templates
  dynamic value; // Field value (null, string, bool, or signature object)
}

class Option {
  String value; // Option value
  String label; // Option label
}

class AssignedUser {
  String id; // Participant ID
  String contactId; // Contact ID
  String contactName; // Contact name
  String contactEmail; // Contact email
  String? contactPhone; // Contact phone
  String role; // "Signer" | "FormFiller" | "Approver"
  List<String> signatureMethods; // ["Email OTP", "SMS OTP"]
  bool signed; // Has signed?
  DateTime? signedAt; // Signing timestamp
  String? signedMethod; // Signing method used
  String? signedIP; // IP address
}
```

---

## Complete Implementation Flow

### Scenario 1: Create Package from Template

```
1. User opens "Create Package" screen
   ↓
2. Fetch templates: GET /api/templates
   ↓
3. Display template list
   ↓
4. User selects template
   ↓
5. Fetch template details: GET /api/templates/{templateId}
   ↓
6. Download PDF from downloadUrl (for preview)
   ↓
7. Initialize package state:
   - name: template.name
   - attachment_uuid: template.attachment_uuid
   - fileUrl: template.fileUrl
   - s3Key: template.s3Key (CRITICAL)
   - templateId: template._id
   - fields: template.fields (with assignedUsers: [])
   ↓
8. User edits package:
   - Modify title
   - Add/edit fields
   - Assign participants
   ↓
9. User saves:
   Option A: Save as Draft
     → POST /api/packages (status: "Draft")
   
   Option B: Save as Template
     → POST /api/templates (if new)
     → PATCH /api/templates/{templateId} (if updating)
   
   Option C: Send Package
     → POST /api/packages (status: "Sent")
```

### Scenario 2: Create Template from Scratch

```
1. User opens "Templates" screen
   ↓
2. User clicks "Create New Template"
   ↓
3. User uploads PDF: POST /api/templates/upload
   ↓
4. Receive: attachment_uuid, fileUrl, s3Key
   ↓
5. Display PDF preview
   ↓
6. User adds fields to PDF:
   - Click on PDF to add field
   - Set field properties (type, label, required, etc.)
   ↓
7. User enters template name
   ↓
8. User saves template: POST /api/templates
   - Include: name, attachment_uuid, fileUrl, s3Key, fields
   ↓
9. Template created successfully
```

### Scenario 3: Edit Existing Template

```
1. User opens "Templates" screen
   ↓
2. Fetch templates: GET /api/templates
   ↓
3. User selects template to edit
   ↓
4. Fetch template: GET /api/templates/{templateId}
   ↓
5. Download PDF from downloadUrl
   ↓
6. Display template editor:
   - Show PDF with existing fields
   - Allow field editing (add, modify, delete)
   ↓
7. User modifies fields
   ↓
8. User saves: PATCH /api/templates/{templateId}
   - Include: name, fields (only these can be updated)
   ↓
9. Template updated successfully
```

### Scenario 4: Edit Draft Package

```
1. User opens "Packages" screen
   ↓
2. Fetch packages: GET /api/packages
   ↓
3. User selects draft package (status: "Draft")
   ↓
4. Fetch package: GET /api/packages/{packageId}
   ↓
5. Load package data:
   - If templateId exists, it was created from template
   - Download PDF from downloadUrl
   - Display fields with assignments
   ↓
6. User edits package
   ↓
7. User saves: PATCH /api/packages/{packageId}
   ↓
8. Package updated
```

---

## Features to Include/Exclude

### ✅ Features to INCLUDE (Used in Web)

1. **Template Selection**
   - ✅ Fetch all templates
   - ✅ Display template list
   - ✅ Select template to create package
   - ✅ Fetch template details
   - ✅ Download PDF from signed URL

2. **Package Creation from Template**
   - ✅ Initialize package with template data
   - ✅ Copy fields from template (without assignedUsers)
   - ✅ Store templateId reference
   - ✅ Include s3Key in package

3. **Template Management**
   - ✅ Upload PDF for new template
   - ✅ Create new template
   - ✅ Edit existing template (name and fields)
   - ✅ Delete template
   - ✅ Fetch template by ID

4. **Draft Saving**
   - ✅ Save package as draft
   - ✅ Edit existing draft
   - ✅ Save package as template
   - ✅ Send package (status: "Sent")

5. **Field Management**
   - ✅ Add fields to document
   - ✅ Edit field properties
   - ✅ Delete fields
   - ✅ Assign participants to fields

### ❌ Features to EXCLUDE (Not Used in Web)

1. **Template Sharing**
   - ❌ Share templates with other users
   - ❌ Public template library
   - ❌ Template versioning

2. **Advanced Template Features**
   - ❌ Template categories/tags
   - ❌ Template search/filtering (beyond basic list)
   - ❌ Template duplication
   - ❌ Template export/import

3. **Package Features Not Related to Templates**
   - ❌ Package templates (different from document templates)
   - ❌ Bulk package creation
   - ❌ Package scheduling

4. **Advanced Field Features**
   - ❌ Field validation rules (beyond required)
   - ❌ Conditional fields
   - ❌ Field calculations

### ⚠️ Features to SIMPLIFY

1. **Template List Display**
   - Web shows: Name, Attachment UUID, Field Count, Actions
   - Flutter can simplify to: Name, Field Count, Actions

2. **Template Editor**
   - Web has full PDF editor with drag-and-drop
   - Flutter can use simpler field placement (tap to add)

3. **Package Creation Flow**
   - Web has 3-step stepper
   - Flutter can use simpler single-screen or 2-step flow

---

## Error Handling

### Common Errors

#### 1. Template Not Found
```json
{
  "success": false,
  "error": "Template not found or you do not have permission to view it.",
  "statusCode": 404
}
```
**Handling:** Show error message, redirect to template list

#### 2. Missing S3 Key
```json
{
  "success": false,
  "error": "S3 key is required to create a template.",
  "statusCode": 400
}
```
**Handling:** Ensure s3Key is included when creating templates/packages

#### 3. Duplicate Attachment UUID
```json
{
  "success": false,
  "error": "A template with this attachment UUID already exists.",
  "statusCode": 400
}
```
**Handling:** Each template must have unique attachment_uuid per user

#### 4. Invalid Template Update
```json
{
  "success": false,
  "error": "Template not found or you do not have permission to edit it.",
  "statusCode": 404
}
```
**Handling:** Verify template belongs to user and exists

#### 5. Missing Required Fields
```json
{
  "success": false,
  "error": "Template title cannot be empty.",
  "statusCode": 400
}
```
**Handling:** Validate template name before saving

### Error Handling Best Practices

1. **Validate Before API Call**
   ```dart
   if (template.name == null || template.name!.trim().isEmpty) {
     throw Exception('Template title cannot be empty');
   }
   
   if (template.s3Key == null || template.s3Key!.isEmpty) {
     throw Exception('S3 key is required');
   }
   ```

2. **Handle Network Errors**
   ```dart
   try {
     final response = await api.post('/api/templates', data);
   } on DioException catch (e) {
     if (e.response != null) {
       final error = e.response!.data['error'];
       showError(error ?? 'Failed to save template');
     } else {
       showError('Network error. Please check your connection.');
     }
   }
   ```

3. **Show User-Friendly Messages**
   ```dart
   String getErrorMessage(String? apiError) {
     switch (apiError) {
       case 'S3 key is required':
         return 'Please re-upload the document.';
       case 'Template title cannot be empty':
         return 'Please enter a template name.';
       default:
         return apiError ?? 'An error occurred.';
     }
   }
   ```

---

## Best Practices

### 1. Always Include s3Key

**Critical:** Always store and include `s3Key` when:
- Creating new templates
- Creating new packages
- Saving packages as templates

```dart
// ✅ CORRECT
final package = Package(
  s3Key: template.s3Key, // Include s3Key
  // ... other fields
);

// ❌ WRONG
final package = Package(
  // Missing s3Key - will fail when saving
  // ... other fields
);
```

### 2. Remove assignedUsers from Template Fields

Templates don't have participants. When saving package as template:

```dart
// ✅ CORRECT
final templateFields = package.fields.map((field) {
  final json = field.toJson();
  json.remove('assignedUsers'); // Remove assignedUsers
  return json;
}).toList();

// ❌ WRONG
final templateFields = package.fields.map((f) => f.toJson()).toList();
// assignedUsers will cause validation error
```

### 3. Handle Signed URL Expiration

`downloadUrl` expires in 1 hour. Implement:

```dart
class Template {
  String? downloadUrl;
  DateTime? downloadUrlExpires;
  
  bool get isDownloadUrlValid {
    if (downloadUrlExpires == null) return false;
    return DateTime.now().isBefore(downloadUrlExpires!);
  }
  
  Future<String> getValidDownloadUrl() async {
    if (isDownloadUrlValid && downloadUrl != null) {
      return downloadUrl!;
    }
    // Fetch template again to get new signed URL
    final template = await fetchTemplate(_id!);
    return template.downloadUrl!;
  }
}
```

### 4. Validate Before Saving

```dart
Future<void> saveTemplate(Template template) async {
  // Validate name
  if (template.name.trim().isEmpty) {
    throw Exception('Template title cannot be empty');
  }
  
  // Validate s3Key for new templates
  if (template._id == null && (template.s3Key == null || template.s3Key!.isEmpty)) {
    throw Exception('S3 key is required to create a template');
  }
  
  // Validate fields structure
  for (final field in template.fields) {
    if (field.type == 'dropdown' || field.type == 'radio') {
      if (field.options.isEmpty) {
        throw Exception('${field.label} must have at least one option');
      }
    }
  }
  
  // Proceed with save
  await api.post('/api/templates', template.toJson());
}
```

### 5. State Management

**Recommended:** Use state management (Provider, Riverpod, Bloc, etc.)

```dart
class TemplateProvider extends ChangeNotifier {
  List<Template> _templates = [];
  Template? _currentTemplate;
  bool _loading = false;
  String? _error;
  
  Future<void> fetchTemplates() async {
    _loading = true;
    _error = null;
    notifyListeners();
    
    try {
      _templates = await templateService.getTemplates();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
  
  Future<void> selectTemplate(String templateId) async {
    _loading = true;
    notifyListeners();
    
    try {
      _currentTemplate = await templateService.getTemplateById(templateId);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
```

### 6. PDF Handling

**Recommended Libraries:**
- `syncfusion_flutter_pdfviewer` - PDF viewer
- `pdf` - PDF manipulation
- `printing` - PDF printing

**Example:**
```dart
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

SfPdfViewer.network(
  template.downloadUrl!,
  onDocumentLoadFailed: (error) {
    // Handle error
  },
)
```

### 7. Field Coordinate System

**Important:** Coordinates are in PDF points (1/72 inch).

```dart
// Convert PDF coordinates to screen coordinates
double pdfToScreenX(double pdfX, double pdfScale) {
  return pdfX * pdfScale;
}

double pdfToScreenY(double pdfY, double pdfScale) {
  return pdfY * pdfScale;
}

// Field overlay positioning
Positioned(
  left: pdfToScreenX(field.x, scale),
  top: pdfToScreenY(field.y, scale),
  width: pdfToScreenX(field.width, scale),
  height: pdfToScreenY(field.height, scale),
  child: FieldWidget(field: field),
)
```

---

## Summary

### Key Takeaways

1. **Template Selection:**
   - Fetch templates with `GET /api/templates`
   - Select template to initialize package
   - Always store `s3Key` from template

2. **Package Creation:**
   - Initialize package with template data
   - Copy fields without `assignedUsers`
   - Include `templateId` reference

3. **Template Management:**
   - Upload PDF first to get `s3Key`
   - Create template with `s3Key` (required)
   - Update only `name` and `fields`

4. **Draft Saving:**
   - Save package as draft (status: "Draft")
   - Save package as template (remove `assignedUsers`)
   - Send package (status: "Sent")

5. **Critical Requirements:**
   - ✅ Always include `s3Key` for new templates/packages
   - ✅ Remove `assignedUsers` when saving as template
   - ✅ Handle signed URL expiration (1 hour)
   - ✅ Validate before API calls

### Implementation Checklist

- [ ] Implement template list fetching
- [ ] Implement template selection
- [ ] Implement package initialization from template
- [ ] Implement template creation (upload + save)
- [ ] Implement template editing
- [ ] Implement template deletion
- [ ] Implement draft package saving
- [ ] Implement "save as template" functionality
- [ ] Handle s3Key in all operations
- [ ] Handle signed URL expiration
- [ ] Implement error handling
- [ ] Implement PDF preview/rendering
- [ ] Implement field management UI

---

## Support

For questions or issues:
1. Check API responses for error messages
2. Verify `s3Key` is included in requests
3. Ensure `assignedUsers` is removed when saving as template
4. Check signed URL expiration
5. Validate all required fields before API calls

---

## Important Notes

### Code Changes in Latest Version

The latest codebase includes the following updates (verified post-pull):

1. **Internationalization (i18n)**: The web application now uses translation keys for all UI text. This is a **frontend-only change** and does not affect:
   - API endpoints
   - Request/response formats
   - Data structures
   - Business logic

2. **API Endpoints**: All API endpoints remain unchanged:
   - Template endpoints: `/api/templates/*`
   - Package endpoints: `/api/packages/*`
   - Participant endpoints: `/api/packages/participant/*`

3. **Data Models**: All data models remain the same:
   - Template structure unchanged
   - Package structure unchanged
   - Field structure unchanged

4. **Core Functionality**: All core features work identically:
   - Template selection flow
   - Package creation from templates
   - Draft saving
   - Template editing
   - "Save as Template" functionality

### Verification Status

✅ **Verified and Confirmed:**
- Template selection API endpoints
- Package creation flow
- Draft saving functionality
- Template management (CRUD operations)
- s3Key requirement in all operations
- Signed URL generation (1 hour expiry)
- Field structure and validation

### What This Means for Flutter Development

1. **No API Changes**: All API endpoints documented here are current and accurate
2. **No Data Structure Changes**: All data models are correct
3. **Implementation Can Proceed**: The documentation is fully up-to-date with the latest codebase

### Testing Recommendations

When implementing in Flutter, test the following scenarios:

1. **Template Selection:**
   - Fetch templates list
   - Select template and verify all fields are loaded
   - Verify `s3Key` is included in template data
   - Verify `downloadUrl` is present and valid

2. **Package Creation:**
   - Create package from template
   - Verify `templateId` is stored
   - Verify `s3Key` is included
   - Verify fields are copied without `assignedUsers`

3. **Draft Saving:**
   - Save package as draft
   - Edit existing draft
   - Verify `s3Key` is included in save request

4. **Template Management:**
   - Create new template (verify `s3Key` required)
   - Update existing template (verify only `name` and `fields` can be updated)
   - Delete template (verify S3 file is also deleted)

---

**Document Version:** 2.0  
**Last Updated:** 2024-01-15  
**Based on:** Latest codebase (post-pull)  
**For:** Flutter App Development

