# Flutter Template Package Creation & Draft Saving Guide

Complete documentation for implementing package creation from templates and saving as drafts in Flutter. This guide covers the complete 3-step flow used in the web application.

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**For:** Flutter App Development

## Table of Contents

1. [Overview](#overview)
2. [Complete Flow Diagram](#complete-flow-diagram)
3. [Step 1: Document Selection (Template Selection)](#step-1-document-selection-template-selection)
4. [Step 2: Field Assignment](#step-2-field-assignment)
5. [Step 3: Review & Configuration](#step-3-review--configuration)
6. [Save as Draft](#save-as-draft)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Data Models](#data-models)
9. [Complete Implementation Flow](#complete-implementation-flow)
10. [Error Handling](#error-handling)
11. [Best Practices](#best-practices)

---

## Overview

The package creation system allows users to:
1. **Select Template**: Choose from existing document templates or upload new PDFs
2. **Assign Fields**: Add fields to the document and assign participants
3. **Review & Configure**: Review package details, add recipients, configure options
4. **Save as Draft**: Save work-in-progress packages without sending
5. **Send Package**: Finalize and send package to participants

### Key Concepts

- **Template**: A reusable document with predefined fields
- **Package**: A document instance created from a template or new PDF, ready for signing
- **Draft**: An unsaved or saved package that hasn't been sent yet (status: "Draft")
- **Field**: A position on the PDF where data needs to be entered (signature, text, checkbox, etc.)
- **Receiver**: A participant who will receive the package for signing

### Package Statuses

- **Draft**: Package is being created/edited, not sent yet
- **Sent**: Package has been sent to participants
- **Completed**: All participants have completed their assigned fields
- **Rejected**: A participant rejected the document
- **Revoked**: Owner revoked the document
- **Expired**: Package expired

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PACKAGE CREATION FLOW                    │
└─────────────────────────────────────────────────────────────┘

STEP 1: Document Selection
├── Option A: Select Template
│   ├── Fetch templates: GET /api/templates
│   ├── Select template: GET /api/templates/{templateId}
│   ├── Download PDF from downloadUrl
│   └── Initialize package with template data
│
└── Option B: Upload New PDF
    ├── Upload PDF: POST /api/packages/upload
    ├── Receive: attachment_uuid, fileUrl, s3Key
    └── Initialize package with uploaded document

STEP 2: Field Assignment
├── Load PDF document
├── Add fields to PDF (drag & drop or tap)
├── Configure field properties:
│   ├── Type (signature, text, checkbox, etc.)
│   ├── Position (x, y, width, height, page)
│   ├── Label, placeholder
│   ├── Required flag
│   └── Options (for dropdown/radio)
└── Assign participants to fields

STEP 3: Review & Configuration
├── Review package summary
├── Add recipients (receivers)
├── Configure package options:
│   ├── Expiration date
│   ├── Reminder settings
│   ├── Download permissions
│   └── Reassignment permissions
└── Add custom message

SAVE OPTIONS:
├── Save as Draft
│   └── POST /api/packages (status: "Draft")
│
├── Save as Template
│   └── POST /api/templates (from package)
│
└── Send Package
    └── POST /api/packages (status: "Sent")
```

---

## Step 1: Document Selection (Template Selection)

### Overview

In Step 1, users can either:
1. Select an existing template
2. Upload a new PDF document

### Option A: Select Template

#### 1.1 Fetch Available Templates

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

**Implementation:**
```dart
Future<List<Template>> fetchTemplates() async {
  final response = await api.get(
    '/api/templates',
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  return (response.data['data'] as List)
      .map((json) => Template.fromJson(json))
      .toList();
}
```

---

#### 1.2 Select Template and Initialize Package

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

**Package Initialization:**
```dart
Future<void> selectTemplate(String templateId) async {
  try {
    // 1. Fetch template details
    final template = await fetchTemplateById(templateId);
    
    // 2. Download PDF from downloadUrl (optional, for preview)
    Uint8List? pdfBytes;
    if (template.downloadUrl != null) {
      final response = await http.get(Uri.parse(template.downloadUrl!));
      pdfBytes = response.bodyBytes;
    }
    
    // 3. Initialize package state
    final package = Package(
      // Temporary ID (will be replaced when saved)
      id: generateTempId(), // Use nanoid or UUID
      name: template.name,
      attachment_uuid: template.attachment_uuid,
      fileUrl: template.fileUrl,
      s3Key: template.s3Key, // CRITICAL: Must include s3Key
      downloadUrl: template.downloadUrl,
      fileData: pdfBytes, // For local preview
      templateId: template._id, // Reference to template
      fields: template.fields.map((field) {
        // Copy fields but clear assignedUsers
        return Field(
          id: field.id,
          type: field.type,
          page: field.page,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          required: field.required,
          label: field.label,
          placeholder: field.placeholder,
          options: field.options,
          groupId: field.groupId,
          assignedUsers: [], // Clear assigned users
        );
      }).toList(),
      receivers: [],
      options: PackageOptions.defaults(),
      customMessage: '',
      status: 'Draft',
    );
    
    // 4. Store in local state
    setCurrentPackage(package);
    
    // 5. Navigate to Step 2 (Field Assignment)
    navigateToStep(1);
  } catch (e) {
    showError('Failed to load template: ${e.toString()}');
  }
}
```

**Important Notes:**
- `s3Key` is **REQUIRED** - must be included from template
- `templateId` should be stored to reference the source template
- Fields from template should be copied with `assignedUsers: []`
- `downloadUrl` is temporary (expires in 1 hour) - use for preview only

---

### Option B: Upload New PDF

#### 1.3 Upload PDF Document

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

**Implementation:**
```dart
Future<void> uploadPdfDocument(File pdfFile) async {
  try {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        pdfFile.path,
        filename: pdfFile.path.split('/').last,
      ),
    });

    final response = await api.post(
      '/api/packages/upload',
      formData,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'multipart/form-data',
        },
      ),
    );

    final uploadData = response.data['data'];
    
    // Read file bytes for preview
    final pdfBytes = await pdfFile.readAsBytes();
    
    // Initialize package
    final package = Package(
      id: generateTempId(),
      name: pdfFile.path.split('/').last.replaceAll('.pdf', ''),
      attachment_uuid: uploadData['attachment_uuid'],
      fileUrl: uploadData['fileUrl'],
      s3Key: uploadData['s3Key'], // CRITICAL: Must include s3Key
      fileData: pdfBytes,
      templateId: null, // No template for new upload
      fields: [], // Empty - user will add fields
      receivers: [],
      options: PackageOptions.defaults(),
      customMessage: '',
      status: 'Draft',
    );
    
    setCurrentPackage(package);
    navigateToStep(1);
  } catch (e) {
    showError('Failed to upload document: ${e.toString()}');
  }
}
```

---

#### 1.4 Set Package Title

Users can edit the package title in Step 1.

**Implementation:**
```dart
void updatePackageTitle(String title) {
  if (currentPackage != null) {
    setCurrentPackage(
      currentPackage!.copyWith(name: title),
    );
  }
}
```

**Validation:**
- Title is required
- Minimum 3 characters
- Maximum 100 characters (recommended)

---

## Step 2: Field Assignment

### Overview

In Step 2, users:
1. View the PDF document
2. Add fields to the document
3. Configure field properties
4. Assign participants to fields

### 2.1 Load PDF Document

**PDF Loading:**
```dart
Future<PDFDocument> loadPdfDocument(Package package) async {
  Uint8List pdfBytes;
  
  if (package.fileData != null) {
    // Use local file data
    pdfBytes = package.fileData!;
  } else if (package.downloadUrl != null) {
    // Download from signed URL
    final response = await http.get(Uri.parse(package.downloadUrl!));
    pdfBytes = response.bodyBytes;
  } else if (package.fileUrl != null) {
    // Download from file URL
    final url = package.fileUrl!.startsWith('/public')
        ? '$baseUrl${package.fileUrl}'
        : '$baseUrl/public${package.fileUrl}';
    final response = await http.get(Uri.parse(url));
    pdfBytes = response.bodyBytes;
  } else {
    throw Exception('No valid PDF source found');
  }
  
  // Use PDF library to load document
  return PDFDocument.fromBytes(pdfBytes);
}
```

---

### 2.2 Add Field to Document

**Field Types:**
- `signature` - Signature field
- `text` - Text input
- `textarea` - Multi-line text
- `checkbox` - Checkbox
- `radio` - Radio button (requires groupId)
- `date` - Date picker
- `dropdown` - Dropdown select (requires options)

**Add Field:**
```dart
void addFieldToPackage({
  required String type,
  required int page,
  required double x,
  required double y,
  required double width,
  required double height,
  String? label,
  String? placeholder,
  bool required = false,
  List<Option>? options,
  String? groupId,
}) {
  final newField = Field(
    id: generateFieldId(), // Use nanoid or UUID
    type: type,
    page: page,
    x: x,
    y: y,
    width: width,
    height: height,
    required: required,
    label: label ?? getDefaultLabel(type),
    placeholder: placeholder ?? '',
    options: options ?? [],
    groupId: groupId,
    assignedUsers: [],
  );
  
  setCurrentPackage(
    currentPackage!.copyWith(
      fields: [...currentPackage!.fields, newField],
    ),
  );
}
```

**Default Field Sizes:**
```dart
Map<String, Map<String, double>> getDefaultFieldSizes() {
  return {
    'signature': {'width': 150.0, 'height': 50.0},
    'text': {'width': 180.0, 'height': 35.0},
    'textarea': {'width': 200.0, 'height': 80.0},
    'checkbox': {'width': 25.0, 'height': 25.0},
    'radio': {'width': 25.0, 'height': 25.0},
    'date': {'width': 120.0, 'height': 35.0},
    'dropdown': {'width': 150.0, 'height': 35.0},
  };
}
```

---

### 2.3 Update Field Properties

**Update Field:**
```dart
void updateField(String fieldId, Map<String, dynamic> updates) {
  final updatedFields = currentPackage!.fields.map((field) {
    if (field.id == fieldId) {
      return field.copyWith(
        label: updates['label'] ?? field.label,
        placeholder: updates['placeholder'] ?? field.placeholder,
        required: updates['required'] ?? field.required,
        options: updates['options'] ?? field.options,
        // Position updates
        x: updates['x'] ?? field.x,
        y: updates['y'] ?? field.y,
        width: updates['width'] ?? field.width,
        height: updates['height'] ?? field.height,
      );
    }
    return field;
  }).toList();
  
  setCurrentPackage(
    currentPackage!.copyWith(fields: updatedFields),
  );
}
```

---

### 2.4 Assign Participants to Fields

**Assign User to Field:**
```dart
void assignUserToField({
  required String fieldId,
  required String contactId,
  required String contactName,
  required String contactEmail,
  required String role, // "Signer", "FormFiller", "Approver"
  List<String>? signatureMethods, // ["Email OTP", "SMS OTP"] for Signer
}) {
  final assignedUser = AssignedUser(
    id: generateAssignmentId(),
    contactId: contactId,
    contactName: contactName,
    contactEmail: contactEmail,
    role: role,
    signatureMethods: signatureMethods ?? [],
    signed: false,
  );
  
  final updatedFields = currentPackage!.fields.map((field) {
    if (field.id == fieldId) {
      return field.copyWith(
        assignedUsers: [...field.assignedUsers, assignedUser],
      );
    }
    return field;
  }).toList();
  
  setCurrentPackage(
    currentPackage!.copyWith(fields: updatedFields),
  );
}
```

**Remove User from Field:**
```dart
void removeUserFromField(String fieldId, String assignmentId) {
  final updatedFields = currentPackage!.fields.map((field) {
    if (field.id == fieldId) {
      return field.copyWith(
        assignedUsers: field.assignedUsers
            .where((au) => au.id != assignmentId)
            .toList(),
      );
    }
    return field;
  }).toList();
  
  setCurrentPackage(
    currentPackage!.copyWith(fields: updatedFields),
  );
}
```

---

### 2.5 Delete Field

**Delete Field:**
```dart
void deleteField(String fieldId) {
  final updatedFields = currentPackage!.fields
      .where((field) => field.id != fieldId)
      .toList();
  
  setCurrentPackage(
    currentPackage!.copyWith(fields: updatedFields),
  );
}
```

---

## Step 3: Review & Configuration

### Overview

In Step 3, users:
1. Review package summary
2. Add recipients (receivers)
3. Configure package options
4. Add custom message

### 3.1 Package Summary

**Display Summary:**
- Package name
- Number of fields
- Number of assigned participants
- Number of receivers
- Document preview

---

### 3.2 Add Recipients (Receivers)

**Add Receiver:**
```dart
void addReceiver({
  required String contactId,
  required String contactName,
  required String contactEmail,
}) {
  final receiver = Receiver(
    id: generateReceiverId(),
    contactId: contactId,
    contactName: contactName,
    contactEmail: contactEmail,
  );
  
  setCurrentPackage(
    currentPackage!.copyWith(
      receivers: [...currentPackage!.receivers, receiver],
    ),
  );
}
```

**Remove Receiver:**
```dart
void removeReceiver(String receiverId) {
  final updatedReceivers = currentPackage!.receivers
      .where((rec) => rec.id != receiverId)
      .toList();
  
  setCurrentPackage(
    currentPackage!.copyWith(receivers: updatedReceivers),
  );
}
```

---

### 3.3 Configure Package Options

**Package Options:**
```dart
class PackageOptions {
  final DateTime? expiresAt; // Package expiration date
  final bool sendExpirationReminders; // Send reminder before expiry
  final String? reminderPeriod; // "1_hour_before", "2_hours_before", "1_day_before", "2_days_before"
  final bool sendAutomaticReminders; // Send automatic reminders
  final int? firstReminderDays; // Days until first reminder
  final int? repeatReminderDays; // Days between repeat reminders
  final bool allowDownloadUnsigned; // Allow downloading unsigned document
  final bool allowReassign; // Allow participants to reassign fields
  final bool allowReceiversToAdd; // Allow receivers to add more recipients
  
  PackageOptions({
    this.expiresAt,
    this.sendExpirationReminders = false,
    this.reminderPeriod,
    this.sendAutomaticReminders = false,
    this.firstReminderDays,
    this.repeatReminderDays,
    this.allowDownloadUnsigned = true,
    this.allowReassign = true,
    this.allowReceiversToAdd = true,
  });
  
  static PackageOptions defaults() {
    return PackageOptions();
  }
}
```

**Update Options:**
```dart
void updatePackageOptions(PackageOptions options) {
  setCurrentPackage(
    currentPackage!.copyWith(options: options),
  );
}
```

---

### 3.4 Add Custom Message

**Set Custom Message:**
```dart
void setCustomMessage(String message) {
  setCurrentPackage(
    currentPackage!.copyWith(customMessage: message),
  );
}
```

---

## Save as Draft

### Overview

Saving as draft allows users to:
- Save work-in-progress packages
- Resume editing later
- Send package when ready

### Draft Save Flow

```
1. User clicks "Save as Draft"
   ↓
2. Validate package data:
   - Name is required
   - Document is uploaded/selected
   - s3Key is present
   ↓
3. Check if editing existing draft:
   - If package._id is MongoDB ObjectId → Update
   - Otherwise → Create new
   ↓
4. Call API:
   - POST /api/packages (new draft)
   - PATCH /api/packages/{packageId} (update draft)
   ↓
5. Save with status: "Draft"
   ↓
6. Clear local state
   ↓
7. Navigate to dashboard
```

---

### API Endpoint: Create/Update Package

**Endpoint:**
```
POST /api/packages (new package)
PATCH /api/packages/{packageId} (update package)
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (Create New Draft):**
```json
{
  "name": "Employment Contract - John Doe",
  "attachment_uuid": "uuid-123-456",
  "fileUrl": "https://s3.../template.pdf",
  "s3Key": "templates/user123/uuid-123-456.pdf",
  "templateId": "templateId123",
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
          "id": "assignment1",
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
      "id": "receiver1",
      "contactId": "contactId1",
      "contactName": "John Doe",
      "contactEmail": "john@example.com"
    }
  ],
  "options": {
    "expiresAt": null,
    "sendExpirationReminders": false,
    "reminderPeriod": null,
    "sendAutomaticReminders": false,
    "firstReminderDays": null,
    "repeatReminderDays": null,
    "allowDownloadUnsigned": true,
    "allowReassign": true,
    "allowReceiversToAdd": true
  },
  "customMessage": "Please review and sign this document",
  "status": "Draft"
}
```

**Request Body (Update Existing Draft):**
```json
{
  "name": "Updated Package Name",
  "fields": [/* updated fields */],
  "receivers": [/* updated receivers */],
  "options": {/* updated options */},
  "customMessage": "Updated message",
  "status": "Draft"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Package saved successfully",
  "data": {
    "_id": "packageId123",
    "name": "Employment Contract - John Doe",
    "status": "Draft",
    "attachment_uuid": "uuid-123-456",
    "fileUrl": "https://s3.../template.pdf",
    "s3Key": "templates/user123/uuid-123-456.pdf",
    "templateId": "templateId123",
    "fields": [/* fields array */],
    "receivers": [/* receivers array */],
    "options": {/* options object */},
    "customMessage": "Please review and sign this document",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### Implementation: Save Draft

**Save Draft Function:**
```dart
Future<void> saveDraft(Package package) async {
  try {
    // Validate
    if (package.name.trim().isEmpty) {
      throw Exception('Package title is required');
    }
    if (package.s3Key == null || package.s3Key!.isEmpty) {
      throw Exception('S3 key is required');
    }
    
    // Check if editing existing draft
    final isExistingDraft = package.id != null && 
        RegExp(r'^[a-f\d]{24}$', caseSensitive: false).hasMatch(package.id!);
    
    final payload = {
      if (isExistingDraft) '_id': package.id,
      'name': package.name,
      'attachment_uuid': package.attachment_uuid,
      'fileUrl': package.fileUrl,
      's3Key': package.s3Key,
      if (package.templateId != null) 'templateId': package.templateId,
      'fields': package.fields.map((f) => f.toJson()).toList(),
      'receivers': package.receivers.map((r) => r.toJson()).toList(),
      'options': package.options.toJson(),
      'customMessage': package.customMessage ?? '',
      'status': 'Draft',
    };
    
    if (isExistingDraft) {
      // Update existing draft
      final response = await api.patch(
        '/api/packages/${package.id}',
        payload,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
      showSuccess('Draft updated successfully');
    } else {
      // Create new draft
      // Remove _id for new packages
      payload.remove('_id');
      
      final response = await api.post(
        '/api/packages',
        payload,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
      showSuccess('Draft saved successfully');
    }
    
    // Clear local state
    clearCurrentPackage();
    
    // Navigate to dashboard
    navigateToDashboard();
  } catch (e) {
    showError('Failed to save draft: ${e.toString()}');
  }
}
```

---

### Edit Existing Draft

**Load Draft for Editing:**
```dart
Future<void> loadDraftForEditing(String packageId) async {
  try {
    final response = await api.get(
      '/api/packages/$packageId',
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
      ),
    );
    
    final packageData = response.data['data'];
    
    // Convert to Package model
    final package = Package.fromJson(packageData);
    
    // Load PDF if needed
    if (package.downloadUrl != null) {
      final pdfResponse = await http.get(Uri.parse(package.downloadUrl!));
      package.fileData = pdfResponse.bodyBytes;
    }
    
    // Set as current package
    setCurrentPackage(package);
    
    // Navigate to package creation flow
    navigateToPackageCreation();
  } catch (e) {
    showError('Failed to load draft: ${e.toString()}');
  }
}
```

---

## API Endpoints Reference

### Package Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/templates` | Get all templates | Yes |
| GET | `/api/templates/{templateId}` | Get template by ID | Yes |
| POST | `/api/packages/upload` | Upload PDF document | Yes |
| POST | `/api/packages` | Create new package | Yes |
| PATCH | `/api/packages/{packageId}` | Update package | Yes |
| GET | `/api/packages/{packageId}` | Get package by ID | Yes |
| GET | `/api/packages` | Get all packages (paginated) | Yes |

---

## Data Models

### Package Model

```dart
class Package {
  final String? id; // MongoDB ObjectId (if saved) or temp ID
  final String name; // Package/document title
  final String attachment_uuid; // Unique UUID
  final String fileUrl; // S3 URL
  final String? s3Key; // S3 object key (REQUIRED)
  final String? downloadUrl; // Temporary signed URL
  final Uint8List? fileData; // Local PDF data (for preview)
  final String? templateId; // Template ID (if created from template)
  final List<Field> fields; // Field definitions
  final List<Receiver> receivers; // Recipients
  final PackageOptions options; // Package options
  final String? customMessage; // Custom message
  final String status; // "Draft" | "Sent" | "Completed" | etc.
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Package({
    this.id,
    required this.name,
    required this.attachment_uuid,
    required this.fileUrl,
    this.s3Key,
    this.downloadUrl,
    this.fileData,
    this.templateId,
    required this.fields,
    required this.receivers,
    required this.options,
    this.customMessage,
    required this.status,
    this.createdAt,
    this.updatedAt,
  });

  Package copyWith({
    String? id,
    String? name,
    String? attachment_uuid,
    String? fileUrl,
    String? s3Key,
    String? downloadUrl,
    Uint8List? fileData,
    String? templateId,
    List<Field>? fields,
    List<Receiver>? receivers,
    PackageOptions? options,
    String? customMessage,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Package(
      id: id ?? this.id,
      name: name ?? this.name,
      attachment_uuid: attachment_uuid ?? this.attachment_uuid,
      fileUrl: fileUrl ?? this.fileUrl,
      s3Key: s3Key ?? this.s3Key,
      downloadUrl: downloadUrl ?? this.downloadUrl,
      fileData: fileData ?? this.fileData,
      templateId: templateId ?? this.templateId,
      fields: fields ?? this.fields,
      receivers: receivers ?? this.receivers,
      options: options ?? this.options,
      customMessage: customMessage ?? this.customMessage,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      'name': name,
      'attachment_uuid': attachment_uuid,
      'fileUrl': fileUrl,
      if (s3Key != null) 's3Key': s3Key,
      if (templateId != null) 'templateId': templateId,
      'fields': fields.map((f) => f.toJson()).toList(),
      'receivers': receivers.map((r) => r.toJson()).toList(),
      'options': options.toJson(),
      if (customMessage != null) 'customMessage': customMessage,
      'status': status,
    };
  }

  factory Package.fromJson(Map<String, dynamic> json) {
    return Package(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      attachment_uuid: json['attachment_uuid'],
      fileUrl: json['fileUrl'],
      s3Key: json['s3Key'],
      downloadUrl: json['downloadUrl'],
      templateId: json['templateId'],
      fields: (json['fields'] as List?)
          ?.map((f) => Field.fromJson(f))
          .toList() ?? [],
      receivers: (json['receivers'] as List?)
          ?.map((r) => Receiver.fromJson(r))
          .toList() ?? [],
      options: PackageOptions.fromJson(json['options'] ?? {}),
      customMessage: json['customMessage'],
      status: json['status'] ?? 'Draft',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }
}
```

### Field Model

```dart
class Field {
  final String id; // Client-generated ID (nanoid/uuid)
  final String type; // "text" | "signature" | "checkbox" | etc.
  final int page; // Page number (1-indexed)
  final double x; // X coordinate
  final double y; // Y coordinate
  final double width; // Field width
  final double height; // Field height
  final bool required; // Is field required?
  final String label; // Field label
  final String placeholder; // Placeholder text
  final List<Option> options; // For dropdown/radio
  final String? groupId; // For grouped radio buttons
  final List<AssignedUser> assignedUsers; // Assigned participants
  final dynamic value; // Field value (null until filled)

  Field({
    required this.id,
    required this.type,
    required this.page,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    this.required = false,
    required this.label,
    this.placeholder = '',
    this.options = const [],
    this.groupId,
    this.assignedUsers = const [],
    this.value,
  });

  Field copyWith({
    String? id,
    String? type,
    int? page,
    double? x,
    double? y,
    double? width,
    double? height,
    bool? required,
    String? label,
    String? placeholder,
    List<Option>? options,
    String? groupId,
    List<AssignedUser>? assignedUsers,
    dynamic value,
  }) {
    return Field(
      id: id ?? this.id,
      type: type ?? this.type,
      page: page ?? this.page,
      x: x ?? this.x,
      y: y ?? this.y,
      width: width ?? this.width,
      height: height ?? this.height,
      required: required ?? this.required,
      label: label ?? this.label,
      placeholder: placeholder ?? this.placeholder,
      options: options ?? this.options,
      groupId: groupId ?? this.groupId,
      assignedUsers: assignedUsers ?? this.assignedUsers,
      value: value ?? this.value,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'page': page,
      'x': x,
      'y': y,
      'width': width,
      'height': height,
      'required': required,
      'label': label,
      'placeholder': placeholder,
      'options': options.map((o) => o.toJson()).toList(),
      if (groupId != null) 'groupId': groupId,
      'assignedUsers': assignedUsers.map((au) => au.toJson()).toList(),
    };
  }

  factory Field.fromJson(Map<String, dynamic> json) {
    return Field(
      id: json['id'],
      type: json['type'],
      page: json['page'],
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      width: (json['width'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
      required: json['required'] ?? false,
      label: json['label'],
      placeholder: json['placeholder'] ?? '',
      options: (json['options'] as List?)
          ?.map((o) => Option.fromJson(o))
          .toList() ?? [],
      groupId: json['groupId'],
      assignedUsers: (json['assignedUsers'] as List?)
          ?.map((au) => AssignedUser.fromJson(au))
          .toList() ?? [],
      value: json['value'],
    );
  }
}
```

### AssignedUser Model

```dart
class AssignedUser {
  final String id; // Assignment ID
  final String contactId; // Contact ID
  final String contactName; // Contact name
  final String contactEmail; // Contact email
  final String role; // "Signer" | "FormFiller" | "Approver"
  final List<String> signatureMethods; // ["Email OTP", "SMS OTP"] for Signer
  final bool signed; // Has signed?
  final DateTime? signedAt; // Signing timestamp
  final String? signedMethod; // Signing method used
  final String? signedIP; // IP address

  AssignedUser({
    required this.id,
    required this.contactId,
    required this.contactName,
    required this.contactEmail,
    required this.role,
    this.signatureMethods = const [],
    this.signed = false,
    this.signedAt,
    this.signedMethod,
    this.signedIP,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contactId': contactId,
      'contactName': contactName,
      'contactEmail': contactEmail,
      'role': role,
      'signatureMethods': signatureMethods,
      'signed': signed,
      if (signedAt != null) 'signedAt': signedAt!.toIso8601String(),
      if (signedMethod != null) 'signedMethod': signedMethod,
      if (signedIP != null) 'signedIP': signedIP,
    };
  }

  factory AssignedUser.fromJson(Map<String, dynamic> json) {
    return AssignedUser(
      id: json['id'],
      contactId: json['contactId'],
      contactName: json['contactName'],
      contactEmail: json['contactEmail'],
      role: json['role'],
      signatureMethods: (json['signatureMethods'] as List?)
          ?.map((m) => m.toString())
          .toList() ?? [],
      signed: json['signed'] ?? false,
      signedAt: json['signedAt'] != null
          ? DateTime.parse(json['signedAt'])
          : null,
      signedMethod: json['signedMethod'],
      signedIP: json['signedIP'],
    );
  }
}
```

### Receiver Model

```dart
class Receiver {
  final String id; // Receiver ID
  final String contactId; // Contact ID
  final String contactName; // Contact name
  final String contactEmail; // Contact email

  Receiver({
    required this.id,
    required this.contactId,
    required this.contactName,
    required this.contactEmail,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contactId': contactId,
      'contactName': contactName,
      'contactEmail': contactEmail,
    };
  }

  factory Receiver.fromJson(Map<String, dynamic> json) {
    return Receiver(
      id: json['id'],
      contactId: json['contactId'],
      contactName: json['contactName'],
      contactEmail: json['contactEmail'],
    );
  }
}
```

---

## Complete Implementation Flow

### Scenario 1: Create Package from Template and Save as Draft

```
1. User opens "Create Package" screen
   ↓
2. Fetch templates: GET /api/templates
   ↓
3. Display template list
   ↓
4. User selects template
   ↓
5. Fetch template: GET /api/templates/{templateId}
   ↓
6. Download PDF from downloadUrl (for preview)
   ↓
7. Initialize package:
   - name: template.name
   - attachment_uuid: template.attachment_uuid
   - fileUrl: template.fileUrl
   - s3Key: template.s3Key (CRITICAL)
   - templateId: template._id
   - fields: template.fields (with assignedUsers: [])
   - status: "Draft"
   ↓
8. Navigate to Step 2 (Field Assignment)
   ↓
9. User adds/modifies fields (optional)
   ↓
10. User assigns participants to fields (optional)
    ↓
11. Navigate to Step 3 (Review)
    ↓
12. User adds recipients (optional)
    ↓
13. User configures options (optional)
    ↓
14. User clicks "Save as Draft"
    ↓
15. Validate package:
    - Name is required
    - s3Key is present
    ↓
16. Save draft: POST /api/packages
    - Include all package data
    - status: "Draft"
    ↓
17. Show success message
    ↓
18. Clear local state
    ↓
19. Navigate to dashboard
```

### Scenario 2: Edit Existing Draft

```
1. User opens "Packages" screen
   ↓
2. Fetch packages: GET /api/packages?status=Draft
   ↓
3. User selects draft to edit
   ↓
4. Fetch package: GET /api/packages/{packageId}
   ↓
5. Load package data:
   - Download PDF from downloadUrl
   - Load fields with assignments
   - Load receivers
   - Load options
   ↓
6. Navigate to package creation flow
   ↓
7. User edits package (any step)
   ↓
8. User clicks "Save as Draft"
   ↓
9. Update draft: PATCH /api/packages/{packageId}
   ↓
10. Show success message
    ↓
11. Clear local state
    ↓
12. Navigate to dashboard
```

### Scenario 3: Upload New PDF and Save as Draft

```
1. User opens "Create Package" screen
   ↓
2. User uploads PDF: POST /api/packages/upload
   ↓
3. Receive: attachment_uuid, fileUrl, s3Key
   ↓
4. Initialize package:
   - name: file name
   - attachment_uuid: from upload
   - fileUrl: from upload
   - s3Key: from upload (CRITICAL)
   - fields: [] (empty)
   - status: "Draft"
   ↓
5. Navigate to Step 2
   ↓
6. User adds fields
   ↓
7. User assigns participants
   ↓
8. Navigate to Step 3
   ↓
9. User configures package
   ↓
10. User clicks "Save as Draft"
    ↓
11. Save draft: POST /api/packages
    ↓
12. Success → Navigate to dashboard
```

---

## Error Handling

### Common Errors

#### 1. Missing S3 Key
```json
{
  "success": false,
  "error": "S3 key is required to create a package.",
  "statusCode": 400
}
```
**Handling:** Ensure `s3Key` is included when creating packages

#### 2. Template Not Found
```json
{
  "success": false,
  "error": "Template not found or you do not have permission to use it.",
  "statusCode": 404
}
```
**Handling:** Verify template exists and belongs to user

#### 3. Invalid Template Data
```json
{
  "success": false,
  "error": "Attachment UUID and file URL must match the selected template.",
  "statusCode": 400
}
```
**Handling:** Ensure template data matches when using templateId

#### 4. Invalid Contact IDs
```json
{
  "success": false,
  "error": "One or more contact IDs are invalid or not owned by the user.",
  "statusCode": 400
}
```
**Handling:** Verify all contact IDs exist and belong to user

#### 5. Package Not Found (Update)
```json
{
  "success": false,
  "error": "Package not found or you do not have permission to edit it.",
  "statusCode": 404
}
```
**Handling:** Verify package exists and belongs to user

### Error Handling Best Practices

```dart
Future<void> saveDraft(Package package) async {
  try {
    // Validate before API call
    if (package.name.trim().isEmpty) {
      throw Exception('Package title is required');
    }
    if (package.s3Key == null || package.s3Key!.isEmpty) {
      throw Exception('S3 key is required');
    }
    
    // Validate template data if templateId exists
    if (package.templateId != null) {
      // Verify template still exists
      try {
        await fetchTemplateById(package.templateId!);
      } catch (e) {
        throw Exception('Template no longer exists. Please select a different template.');
      }
    }
    
    // Validate contacts
    final allContactIds = [
      ...package.fields
          .expand((f) => f.assignedUsers.map((au) => au.contactId)),
      ...package.receivers.map((r) => r.contactId),
    ];
    
    // Verify contacts exist (optional client-side check)
    // Server will also validate
    
    // Make API call
    final isExisting = package.id != null && 
        RegExp(r'^[a-f\d]{24}$', caseSensitive: false).hasMatch(package.id!);
    
    if (isExisting) {
      await updatePackage(package.id!, package);
    } else {
      await createPackage(package);
    }
    
    showSuccess('Draft saved successfully');
    clearCurrentPackage();
    navigateToDashboard();
  } on DioException catch (e) {
    if (e.response != null) {
      final error = e.response!.data['error'];
      showError(error ?? 'Failed to save draft');
    } else {
      showError('Network error. Please check your connection.');
    }
  } catch (e) {
    showError(e.toString());
  }
}
```

---

## Best Practices

### 1. Always Include s3Key

**Critical:** Always store and include `s3Key` when:
- Creating packages from templates
- Creating packages from uploaded PDFs
- Saving drafts

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

### 2. Handle Template ID Extraction

Template ID might be stored as object or string:

```dart
String? extractTemplateId(dynamic templateId) {
  if (templateId == null) return null;
  if (templateId is String) return templateId;
  if (templateId is Map && templateId['_id'] != null) {
    return templateId['_id'] as String;
  }
  return null;
}
```

### 3. Validate Before Saving

```dart
bool validatePackage(Package package) {
  // Name validation
  if (package.name.trim().isEmpty) {
    showError('Package title is required');
    return false;
  }
  
  // s3Key validation
  if (package.s3Key == null || package.s3Key!.isEmpty) {
    showError('S3 key is required');
    return false;
  }
  
  // Field validation (optional for drafts)
  for (final field in package.fields) {
    if (field.type == 'dropdown' || field.type == 'radio') {
      if (field.options.isEmpty) {
        showError('${field.label} must have at least one option');
        return false;
      }
    }
  }
  
  return true;
}
```

### 4. State Management

**Recommended:** Use state management (Provider, Riverpod, Bloc, etc.)

```dart
class PackageProvider extends ChangeNotifier {
  Package? _currentPackage;
  int _activeStep = 0;
  bool _loading = false;
  String? _error;

  Package? get currentPackage => _currentPackage;
  int get activeStep => _activeStep;
  bool get loading => _loading;
  String? get error => _error;

  void initializeFromTemplate(Template template) {
    _currentPackage = Package(
      id: generateTempId(),
      name: template.name,
      attachment_uuid: template.attachment_uuid,
      fileUrl: template.fileUrl,
      s3Key: template.s3Key,
      downloadUrl: template.downloadUrl,
      templateId: template._id,
      fields: template.fields.map((f) {
        return Field(
          id: f.id,
          type: f.type,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          required: f.required,
          label: f.label,
          placeholder: f.placeholder,
          options: f.options,
          groupId: f.groupId,
          assignedUsers: [], // Clear assigned users
        );
      }).toList(),
      receivers: [],
      options: PackageOptions.defaults(),
      status: 'Draft',
    );
    _activeStep = 0;
    notifyListeners();
  }

  void addField(Field field) {
    if (_currentPackage != null) {
      _currentPackage = _currentPackage!.copyWith(
        fields: [..._currentPackage!.fields, field],
      );
      notifyListeners();
    }
  }

  Future<void> saveDraft() async {
    if (_currentPackage == null) {
      _error = 'No package to save';
      notifyListeners();
      return;
    }

    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final saved = await packageService.saveDraft(_currentPackage!);
      _currentPackage = saved;
      _error = null;
      showSuccess('Draft saved successfully');
    } catch (e) {
      _error = e.toString();
      showError(_error!);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void nextStep() {
    if (_activeStep < 2) {
      _activeStep++;
      notifyListeners();
    }
  }

  void previousStep() {
    if (_activeStep > 0) {
      _activeStep--;
      notifyListeners();
    }
  }
}
```

### 5. PDF Handling

**Recommended Libraries:**
- `syncfusion_flutter_pdfviewer` - PDF viewer
- `pdf` - PDF manipulation
- `printing` - PDF printing

**Example:**
```dart
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

SfPdfViewer.memory(
  package.fileData!,
  onDocumentLoadFailed: (error) {
    // Handle error
  },
)
```

### 6. Field Coordinate System

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

### 7. Draft Detection

**Check if Package is Existing Draft:**
```dart
bool isExistingDraft(String? packageId) {
  if (packageId == null) return false;
  // MongoDB ObjectId is 24 hex characters
  return RegExp(r'^[a-f\d]{24}$', caseSensitive: false).hasMatch(packageId);
}
```

---

## Summary

### Key Takeaways

1. **Template Selection:**
   - Fetch templates with `GET /api/templates`
   - Select template to initialize package
   - Always store `s3Key` from template

2. **Package Initialization:**
   - Copy fields from template (without `assignedUsers`)
   - Include `templateId` reference
   - Include `s3Key` (required)

3. **Field Assignment:**
   - Add fields to document
   - Assign participants to fields
   - Configure field properties

4. **Draft Saving:**
   - Save package with `status: "Draft"`
   - Include `s3Key` (required for new packages)
   - Can update existing drafts

5. **Critical Requirements:**
   - ✅ Always include `s3Key` for new packages
   - ✅ Clear `assignedUsers` when copying from template
   - ✅ Validate before saving
   - ✅ Handle signed URL expiration (1 hour)

### Implementation Checklist

- [ ] Implement template list fetching
- [ ] Implement template selection
- [ ] Implement PDF upload
- [ ] Implement package initialization
- [ ] Implement field addition
- [ ] Implement field editing
- [ ] Implement participant assignment
- [ ] Implement receiver management
- [ ] Implement package options configuration
- [ ] Implement draft saving (create)
- [ ] Implement draft saving (update)
- [ ] Implement draft loading for editing
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
3. Ensure template data matches when using `templateId`
4. Validate all contact IDs exist
5. Check signed URL expiration

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**For:** Flutter App Development

