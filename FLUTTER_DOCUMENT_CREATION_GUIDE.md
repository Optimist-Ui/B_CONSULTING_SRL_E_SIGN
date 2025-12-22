# Flutter Document Creation & Review Guide

**Complete Documentation for Mobile App Developers**

This guide covers the entire document creation workflow for the Flutter mobile application, from uploading a PDF to the final review process.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Document Upload Process](#document-upload-process)
4. [PDF Rendering & Field Positioning](#pdf-rendering--field-positioning)
5. [Adding Participants](#adding-participants)
6. [Field Types & Configuration](#field-types--configuration)
7. [Assigning Signers, Form Fillers & Approvers](#assigning-signers-form-fillers--approvers)
8. [Package Settings & Options](#package-settings--options)
9. [Save as Draft](#save-as-draft)
10. [Send Package](#send-package)
11. [Review & Status Tracking](#review--status-tracking)
12. [API Reference](#api-reference)
13. [Flutter Implementation Guide](#flutter-implementation-guide)
14. [Common Errors & Troubleshooting](#common-errors--troubleshooting)

---

## Overview

### Workflow Summary

```
1. User Authentication (JWT Token Required)
   ↓
2. Check Subscription Status (Must have active subscription)
   ↓
3. Upload PDF Document
   ↓
4. Add Signature/Form Fields to PDF
   ↓
5. Position Fields on PDF Pages
   ↓
6. Assign Participants (Signers/Form Fillers/Approvers)
   ↓
7. Configure Package Settings (Expiry, Reminders, Permissions)
   ↓
8. Save as Draft OR Send Package
   ↓
9. Track Status & Review Process
```

### Key Concepts

- **Package**: A document container with fields and participant assignments
- **Field**: An interactive element on the PDF (signature, text, checkbox, etc.)
- **Participant**: A person assigned to interact with fields
- **Signer**: A participant who signs signature fields (requires OTP verification)
- **Form Filler**: A participant who fills text/checkbox/date fields
- **Approver**: A participant who approves by checking approval fields
- **Draft**: A saved but not sent package (editable)
- **Sent**: An active package sent to participants
- **Completed**: All participants have completed their actions

---

## Prerequisites

### Authentication

All document creation APIs require authentication:

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**How to Get Token:**
- User must login via `/api/users/login`
- Store token securely using `flutter_secure_storage`
- Include in all API requests

### Subscription Requirement

**Users MUST have an active subscription to create documents.**

**Check Before Starting:**
```dart
// Check subscription status
GET /api/subscriptions/status

Response:
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

**If `canCreatePackages: false`:**
- Redirect user to subscription/upgrade page
- Show appropriate error message

---

## Document Upload Process

### Step 1: Select PDF File

**Flutter File Picker:**
```dart
import 'package:file_picker/file_picker.dart';

Future<File?> selectPDFFile() async {
  FilePickerResult? result = await FilePicker.platform.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['pdf'],
  );
  
  if (result != null) {
    return File(result.files.single.path!);
  }
  return null;
}
```

### Step 2: Upload PDF to Server

**Endpoint:** `POST /api/packages/upload`

**Request Type:** `multipart/form-data`

**Form Field Name:** `package` (the PDF file)

**Flutter Implementation:**
```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

Future<Map<String, dynamic>> uploadPDF(File pdfFile) async {
  final storage = FlutterSecureStorage();
  final token = await storage.read(key: 'authToken');
  
  final dio = Dio();
  
  // Create form data
  FormData formData = FormData.fromMap({
    'package': await MultipartFile.fromFile(
      pdfFile.path,
      filename: 'document.pdf',
    ),
  });
  
  try {
    final response = await dio.post(
      'https://your-api-url.com/api/packages/upload',
      data: formData,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'multipart/form-data',
        },
      ),
    );
    
    if (response.data['success']) {
      return response.data['data'];
    }
    throw Exception(response.data['error']);
  } catch (e) {
    throw Exception('Failed to upload PDF: $e');
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Package file uploaded successfully",
  "data": {
    "attachment_uuid": "e8f3c2a0-1b4d-4e9c-8f7a-6d5b4c3a2b1e",
    "originalFileName": "contract.pdf",
    "fileUrl": "https://s3.amazonaws.com/bucket/packages/userId/uuid.pdf",
    "s3Key": "packages/userId123/e8f3c2a0-1b4d-4e9c-8f7a-6d5b4c3a2b1e.pdf"
  }
}
```

**Store These Values:**
```dart
class UploadedDocument {
  final String attachmentUuid;
  final String fileUrl;
  final String s3Key;
  final String originalFileName;
  
  UploadedDocument({
    required this.attachmentUuid,
    required this.fileUrl,
    required this.s3Key,
    required this.originalFileName,
  });
}
```

**Important:**
- ✅ `s3Key` is **REQUIRED** for creating packages
- ✅ `attachment_uuid` is the unique identifier for this document
- ✅ `fileUrl` is used to download/display the PDF
- ⚠️ Keep these values in memory until package is created

---

## PDF Rendering & Field Positioning

### Loading PDF in Flutter

**Recommended Package:** `syncfusion_flutter_pdfviewer` or `pdfx`

**Using `pdfx`:**
```dart
import 'package:pdfx/pdfx.dart';

class PDFEditorScreen extends StatefulWidget {
  final String pdfUrl;
  
  @override
  _PDFEditorScreenState createState() => _PDFEditorScreenState();
}

class _PDFEditorScreenState extends State<PDFEditorScreen> {
  late PdfController pdfController;
  
  @override
  void initState() {
    super.initState();
    loadPDF();
  }
  
  Future<void> loadPDF() async {
    final document = await PdfDocument.openUri(widget.pdfUrl);
    pdfController = PdfController(document: document);
    setState(() {});
  }
  
  @override
  Widget build(BuildContext context) {
    return PdfView(controller: pdfController);
  }
}
```

### Understanding PDF Coordinate System

**Coordinate System:**
- Origin (0,0) is at **TOP-LEFT** corner of each page
- X-axis: Left to right (increases to the right)
- Y-axis: Top to bottom (increases downward)
- All measurements in **pixels** based on PDF page dimensions

**Example:**
```
(0,0) ─────────────────────────► X
  │
  │  PDF Page
  │
  │
  ▼
  Y

Field at x=100, y=200 means:
- 100 pixels from left edge
- 200 pixels from top edge
```

### Field Positioning Structure

**Field Position Data:**
```dart
class FieldPosition {
  final int page;      // Page number (1-indexed)
  final double x;      // X coordinate from left
  final double y;      // Y coordinate from top
  final double width;  // Field width
  final double height; // Field height
}
```

### Rendering Fields as Overlays

**Stack Fields Over PDF:**
```dart
class PDFWithFields extends StatelessWidget {
  final List<PackageField> fields;
  final int currentPage;
  final double pdfWidth;
  final double pdfHeight;
  final double scaleFactor;
  
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // PDF Page
        PdfPageView(pageNumber: currentPage),
        
        // Field Overlays
        ...fields
            .where((field) => field.page == currentPage)
            .map((field) => Positioned(
                  left: field.x * scaleFactor,
                  top: field.y * scaleFactor,
                  width: field.width * scaleFactor,
                  height: field.height * scaleFactor,
                  child: FieldWidget(field: field),
                )),
      ],
    );
  }
}
```

### Adding Fields via Drag & Drop

**Draggable Field Types:**
```dart
class FieldTypeButton extends StatelessWidget {
  final String fieldType;
  
  @override
  Widget build(BuildContext context) {
    return Draggable<String>(
      data: fieldType,
      feedback: Container(
        padding: EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.blue.withOpacity(0.7),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(fieldType),
      ),
      child: Container(
        padding: EdgeInsets.all(8),
        child: Text(fieldType),
      ),
    );
  }
}
```

**Drop Target on PDF:**
```dart
class PDFDropTarget extends StatelessWidget {
  final int pageNumber;
  final Function(String fieldType, Offset position) onFieldDropped;
  
  @override
  Widget build(BuildContext context) {
    return DragTarget<String>(
      onAccept: (fieldType) {
        // Get drop position from DragTarget details
        // Convert screen coordinates to PDF coordinates
        onFieldDropped(fieldType, dropPosition);
      },
      builder: (context, candidateData, rejectedData) {
        return PdfPageView(pageNumber: pageNumber);
      },
    );
  }
}
```

**Calculate Field Position:**
```dart
PackageField createFieldAtPosition(
  String fieldType,
  Offset screenPosition,
  int page,
  double scaleFactor,
) {
  // Convert screen coordinates to PDF coordinates
  final pdfX = screenPosition.dx / scaleFactor;
  final pdfY = screenPosition.dy / scaleFactor;
  
  // Default dimensions based on field type
  final dimensions = getDefaultFieldDimensions(fieldType);
  
  return PackageField(
    id: generateUniqueId(),
    type: fieldType,
    page: page,
    x: pdfX,
    y: pdfY,
    width: dimensions.width,
    height: dimensions.height,
    label: getDefaultLabel(fieldType),
    required: fieldType == 'signature', // Signatures are required by default
    assignedUsers: [],
  );
}

Map<String, double> getDefaultFieldDimensions(String fieldType) {
  switch (fieldType) {
    case 'signature':
      return {'width': 150.0, 'height': 50.0};
    case 'text':
      return {'width': 180.0, 'height': 35.0};
    case 'textarea':
      return {'width': 200.0, 'height': 80.0};
    case 'checkbox':
    case 'radio':
      return {'width': 25.0, 'height': 25.0};
    case 'date':
      return {'width': 120.0, 'height': 35.0};
    case 'dropdown':
      return {'width': 150.0, 'height': 35.0};
    default:
      return {'width': 100.0, 'height': 40.0};
  }
}
```

---

## Adding Participants

### Fetching Contacts

**Endpoint:** `GET /api/contacts`

**Query Parameters:**
- `search`: Filter by name or email (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Request:**
```dart
Future<List<Contact>> getContacts({String? search}) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final response = await dio.get(
    'https://your-api-url.com/api/contacts',
    queryParameters: search != null ? {'search': search} : null,
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  
  if (response.data['success']) {
    final List<dynamic> contactsJson = response.data['data'];
    return contactsJson.map((json) => Contact.fromJson(json)).toList();
  }
  throw Exception('Failed to load contacts');
}
```

**Contact Model:**
```dart
class Contact {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  
  String get fullName => '$firstName $lastName';
  
  Contact({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
  });
  
  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      id: json['_id'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      phone: json['phone'],
    );
  }
}
```

### Creating New Contact

**Endpoint:** `POST /api/contacts`

**Request:**
```dart
Future<Contact> createContact({
  required String firstName,
  required String lastName,
  required String email,
  String? phone,
}) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final response = await dio.post(
    'https://your-api-url.com/api/contacts',
    data: {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
    },
    options: Options(
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ),
  );
  
  if (response.data['success']) {
    return Contact.fromJson(response.data['data']);
  }
  throw Exception(response.data['error']);
}
```

### Searchable Contact Dropdown

**Implementation:**
```dart
class ContactDropdown extends StatefulWidget {
  final Function(Contact) onContactSelected;
  
  @override
  _ContactDropdownState createState() => _ContactDropdownState();
}

class _ContactDropdownState extends State<ContactDropdown> {
  List<Contact> contacts = [];
  List<Contact> filteredContacts = [];
  String searchQuery = '';
  bool isLoading = false;
  
  @override
  void initState() {
    super.initState();
    loadContacts();
  }
  
  Future<void> loadContacts() async {
    setState(() => isLoading = true);
    try {
      contacts = await getContacts();
      filteredContacts = contacts;
    } catch (e) {
      // Handle error
    } finally {
      setState(() => isLoading = false);
    }
  }
  
  void filterContacts(String query) {
    setState(() {
      searchQuery = query;
      filteredContacts = contacts.where((contact) {
        return contact.fullName.toLowerCase().contains(query.toLowerCase()) ||
               contact.email.toLowerCase().contains(query.toLowerCase());
      }).toList();
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          decoration: InputDecoration(
            labelText: 'Search contacts',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: filterContacts,
        ),
        SizedBox(height: 8),
        Expanded(
          child: ListView.builder(
            itemCount: filteredContacts.length,
            itemBuilder: (context, index) {
              final contact = filteredContacts[index];
              return ListTile(
                title: Text(contact.fullName),
                subtitle: Text(contact.email),
                onTap: () => widget.onContactSelected(contact),
              );
            },
          ),
        ),
      ],
    );
  }
}
```

---

## Field Types & Configuration

### Available Field Types

| Type | Description | Use Case | Data Type |
|------|-------------|----------|-----------|
| `signature` | Digital signature field | Requires OTP verification | Object (signature metadata) |
| `text` | Single-line text input | Names, short answers | String |
| `textarea` | Multi-line text input | Comments, descriptions | String |
| `checkbox` | Checkbox (true/false) | Agreements, approvals | Boolean |
| `radio` | Radio button (one choice) | Multiple choice selection | String |
| `date` | Date picker | Dates | String (ISO format) |
| `dropdown` | Dropdown select | Predefined options | String |

### Field Configuration

**Field Model:**
```dart
class PackageField {
  final String id;
  final String type;
  final int page;
  final double x;
  final double y;
  final double width;
  final double height;
  final String label;
  final bool required;
  final String? placeholder;
  final List<FieldOption>? options; // For radio/dropdown
  final String? groupId; // For radio buttons
  final List<AssignedUser> assignedUsers;
  final dynamic value; // Field value after submission
  
  PackageField({
    required this.id,
    required this.type,
    required this.page,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.label,
    this.required = false,
    this.placeholder,
    this.options,
    this.groupId,
    this.assignedUsers = const [],
    this.value,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'page': page,
      'x': x,
      'y': y,
      'width': width,
      'height': height,
      'label': label,
      'required': required,
      'placeholder': placeholder,
      'options': options?.map((o) => o.toJson()).toList(),
      'groupId': groupId,
      'assignedUsers': assignedUsers.map((u) => u.toJson()).toList(),
      'value': value,
    };
  }
}

class FieldOption {
  final String value;
  final String label;
  
  FieldOption({required this.value, required this.label});
  
  Map<String, dynamic> toJson() => {'value': value, 'label': label};
}
```

### Field Properties Panel

**UI for Editing Field Properties:**
```dart
class FieldPropertiesPanel extends StatefulWidget {
  final PackageField field;
  final Function(PackageField) onUpdate;
  
  @override
  _FieldPropertiesPanelState createState() => _FieldPropertiesPanelState();
}

class _FieldPropertiesPanelState extends State<FieldPropertiesPanel> {
  late TextEditingController labelController;
  late TextEditingController placeholderController;
  late bool isRequired;
  
  @override
  void initState() {
    super.initState();
    labelController = TextEditingController(text: widget.field.label);
    placeholderController = TextEditingController(text: widget.field.placeholder);
    isRequired = widget.field.required;
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Label
        TextField(
          controller: labelController,
          decoration: InputDecoration(labelText: 'Field Label'),
          enabled: widget.field.type != 'signature', // Signature labels can't change
        ),
        
        // Placeholder (for text/textarea)
        if (widget.field.type == 'text' || widget.field.type == 'textarea')
          TextField(
            controller: placeholderController,
            decoration: InputDecoration(labelText: 'Placeholder'),
          ),
        
        // Required checkbox
        CheckboxListTile(
          title: Text('Required Field'),
          value: isRequired,
          onChanged: (value) => setState(() => isRequired = value!),
        ),
        
        // Options (for radio/dropdown)
        if (widget.field.type == 'radio' || widget.field.type == 'dropdown')
          OptionsEditor(
            options: widget.field.options ?? [],
            onOptionsChanged: (options) {
              // Update field options
            },
          ),
        
        // Group ID (for radio)
        if (widget.field.type == 'radio')
          TextField(
            decoration: InputDecoration(
              labelText: 'Group ID',
              helperText: 'Radio buttons with same Group ID act as one choice',
            ),
          ),
        
        // Save button
        ElevatedButton(
          onPressed: () {
            final updatedField = widget.field.copyWith(
              label: labelController.text,
              placeholder: placeholderController.text,
              required: isRequired,
            );
            widget.onUpdate(updatedField);
          },
          child: Text('Update Field'),
        ),
      ],
    );
  }
}
```

---

## Assigning Signers, Form Fillers & Approvers

### Participant Roles

**Role Types:**

1. **Signer**
   - Can only be assigned to `signature` fields
   - Maximum **1 Signer** per signature field
   - Must select signature verification method(s)
   - Requires OTP verification (Email/SMS)

2. **FormFiller**
   - Can be assigned to: `text`, `textarea`, `checkbox`, `radio`, `date`, `dropdown`
   - Multiple form fillers can be assigned to one field
   - No OTP verification required
   - Fills field values

3. **Approver**
   - Can be assigned to any field type
   - Multiple approvers can be assigned to one field
   - Used for approval workflows
   - Typically used with checkbox fields for approval

### Assigned User Structure

**Model:**
```dart
class AssignedUser {
  final String id; // Assignment ID (generated)
  final String contactId;
  final String contactName;
  final String contactEmail;
  final String role; // 'Signer', 'FormFiller', or 'Approver'
  final List<String>? signatureMethods; // Only for Signers
  
  AssignedUser({
    required this.id,
    required this.contactId,
    required this.contactName,
    required this.contactEmail,
    required this.role,
    this.signatureMethods,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contactId': contactId,
      'contactName': contactName,
      'contactEmail': contactEmail,
      'role': role,
      'signatureMethods': signatureMethods,
    };
  }
}
```

### Assignment UI

**Field Assignment Dialog:**
```dart
class AssignUserDialog extends StatefulWidget {
  final PackageField field;
  final Function(AssignedUser) onAssign;
  
  @override
  _AssignUserDialogState createState() => _AssignUserDialogState();
}

class _AssignUserDialogState extends State<AssignUserDialog> {
  Contact? selectedContact;
  String? selectedRole;
  Set<String> selectedSignatureMethods = {};
  
  List<String> getAvailableRoles() {
    if (widget.field.type == 'signature') {
      return ['Signer', 'Approver'];
    }
    return ['FormFiller', 'Approver'];
  }
  
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Assign User to Field'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Contact Selection
          ListTile(
            title: Text('Select Contact'),
            subtitle: Text(selectedContact?.fullName ?? 'No contact selected'),
            onTap: () async {
              final contact = await showContactPicker(context);
              setState(() => selectedContact = contact);
            },
          ),
          
          // Role Selection
          DropdownButtonFormField<String>(
            decoration: InputDecoration(labelText: 'Role'),
            value: selectedRole,
            items: getAvailableRoles().map((role) {
              return DropdownMenuItem(value: role, child: Text(role));
            }).toList(),
            onChanged: (value) => setState(() => selectedRole = value),
          ),
          
          // Signature Methods (only for Signers)
          if (selectedRole == 'Signer') ...[
            SizedBox(height: 16),
            Text('Signature Verification Methods:'),
            CheckboxListTile(
              title: Text('Email OTP'),
              value: selectedSignatureMethods.contains('Email OTP'),
              onChanged: (checked) {
                setState(() {
                  if (checked!) {
                    selectedSignatureMethods.add('Email OTP');
                  } else {
                    selectedSignatureMethods.remove('Email OTP');
                  }
                });
              },
            ),
            CheckboxListTile(
              title: Text('SMS OTP'),
              value: selectedSignatureMethods.contains('SMS OTP'),
              onChanged: (checked) {
                setState(() {
                  if (checked!) {
                    selectedSignatureMethods.add('SMS OTP');
                  } else {
                    selectedSignatureMethods.remove('SMS OTP');
                  }
                });
              },
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (selectedContact == null || selectedRole == null) {
              showSnackBar('Please select contact and role');
              return;
            }
            
            // Validate signature methods for Signers
            if (selectedRole == 'Signer' && selectedSignatureMethods.isEmpty) {
              showSnackBar('Please select at least one signature method');
              return;
            }
            
            // Validate: Only 1 Signer per signature field
            if (selectedRole == 'Signer' && widget.field.type == 'signature') {
              final existingSigners = widget.field.assignedUsers
                  .where((u) => u.role == 'Signer')
                  .length;
              if (existingSigners >= 1) {
                showSnackBar('A signature field can only have 1 Signer');
                return;
              }
            }
            
            final assignedUser = AssignedUser(
              id: generateUniqueId(),
              contactId: selectedContact!.id,
              contactName: selectedContact!.fullName,
              contactEmail: selectedContact!.email,
              role: selectedRole!,
              signatureMethods: selectedRole == 'Signer' 
                  ? selectedSignatureMethods.toList() 
                  : null,
            );
            
            widget.onAssign(assignedUser);
            Navigator.pop(context);
          },
          child: Text('Assign'),
        ),
      ],
    );
  }
}
```

### Validation Rules

**Assignment Validation:**
```dart
class FieldAssignmentValidator {
  static String? validateFieldAssignment(PackageField field) {
    // Check signature field rules
    if (field.type == 'signature') {
      final signers = field.assignedUsers.where((u) => u.role == 'Signer').toList();
      
      if (signers.isEmpty && field.required) {
        return 'Required signature field must have a Signer assigned';
      }
      
      if (signers.length > 1) {
        return 'Signature field can only have 1 Signer';
      }
      
      // Validate signature methods
      if (signers.isNotEmpty) {
        final signer = signers.first;
        if (signer.signatureMethods == null || signer.signatureMethods!.isEmpty) {
          return 'Signer must have at least one signature method';
        }
      }
    }
    
    // Check required field rules
    if (field.required && field.assignedUsers.isEmpty) {
      return 'Required field must have at least one assigned user';
    }
    
    return null; // Valid
  }
  
  static bool validateAllFields(List<PackageField> fields) {
    for (final field in fields) {
      final error = validateFieldAssignment(field);
      if (error != null) {
        print('Field ${field.id} validation error: $error');
        return false;
      }
    }
    return true;
  }
}
```

---

## Package Settings & Options

### Package Options Model

```dart
class PackageOptions {
  final DateTime? expiresAt;
  final bool sendExpirationReminders;
  final String? reminderPeriod; // '1_day_before', '2_days_before', '1_hour_before', '2_hours_before'
  final bool sendAutomaticReminders;
  final int? firstReminderDays;
  final int? repeatReminderDays;
  final bool allowDownloadUnsigned;
  final bool allowReassign;
  
  PackageOptions({
    this.expiresAt,
    this.sendExpirationReminders = false,
    this.reminderPeriod,
    this.sendAutomaticReminders = false,
    this.firstReminderDays,
    this.repeatReminderDays,
    this.allowDownloadUnsigned = true,
    this.allowReassign = true,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'expiresAt': expiresAt?.toIso8601String(),
      'sendExpirationReminders': sendExpirationReminders,
      'reminderPeriod': reminderPeriod,
      'sendAutomaticReminders': sendAutomaticReminders,
      'firstReminderDays': firstReminderDays,
      'repeatReminderDays': repeatReminderDays,
      'allowDownloadUnsigned': allowDownloadUnsigned,
      'allowReassign': allowReassign,
    };
  }
}
```

### Settings Configuration UI

```dart
class PackageSettingsScreen extends StatefulWidget {
  final PackageOptions initialOptions;
  final Function(PackageOptions) onSave;
  
  @override
  _PackageSettingsScreenState createState() => _PackageSettingsScreenState();
}

class _PackageSettingsScreenState extends State<PackageSettingsScreen> {
  DateTime? expiresAt;
  bool sendExpirationReminders = false;
  String? reminderPeriod;
  bool sendAutomaticReminders = false;
  int? firstReminderDays;
  int? repeatReminderDays;
  bool allowDownloadUnsigned = true;
  bool allowReassign = true;
  
  @override
  void initState() {
    super.initState();
    // Initialize from widget.initialOptions
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Package Settings')),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          // Expiration Date
          ListTile(
            title: Text('Package Expiration'),
            subtitle: Text(expiresAt != null 
                ? DateFormat.yMMMd().add_jm().format(expiresAt!) 
                : 'No expiration'),
            trailing: Icon(Icons.calendar_today),
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: expiresAt ?? DateTime.now().add(Duration(days: 30)),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(Duration(days: 365)),
              );
              if (date != null) {
                final time = await showTimePicker(
                  context: context,
                  initialTime: TimeOfDay.now(),
                );
                if (time != null) {
                  setState(() {
                    expiresAt = DateTime(
                      date.year, date.month, date.day,
                      time.hour, time.minute,
                    );
                  });
                }
              }
            },
          ),
          
          // Expiration Reminders
          if (expiresAt != null) ...[
            SwitchListTile(
              title: Text('Send Expiration Reminders'),
              value: sendExpirationReminders,
              onChanged: (value) => setState(() => sendExpirationReminders = value),
            ),
            
            if (sendExpirationReminders)
              DropdownButtonFormField<String>(
                decoration: InputDecoration(labelText: 'Reminder Timing'),
                value: reminderPeriod,
                items: [
                  DropdownMenuItem(value: '1_hour_before', child: Text('1 Hour Before')),
                  DropdownMenuItem(value: '2_hours_before', child: Text('2 Hours Before')),
                  DropdownMenuItem(value: '1_day_before', child: Text('1 Day Before')),
                  DropdownMenuItem(value: '2_days_before', child: Text('2 Days Before')),
                ],
                onChanged: (value) => setState(() => reminderPeriod = value),
              ),
          ],
          
          Divider(),
          
          // Automatic Reminders
          if (expiresAt != null) ...[
            SwitchListTile(
              title: Text('Enable Automatic Reminders'),
              subtitle: Text('Send periodic reminders to participants'),
              value: sendAutomaticReminders,
              onChanged: (value) => setState(() => sendAutomaticReminders = value),
            ),
            
            if (sendAutomaticReminders) ...[
              TextField(
                decoration: InputDecoration(
                  labelText: 'First Reminder (days before expiry)',
                  hintText: 'e.g., 7',
                ),
                keyboardType: TextInputType.number,
                onChanged: (value) => firstReminderDays = int.tryParse(value),
              ),
              TextField(
                decoration: InputDecoration(
                  labelText: 'Repeat Every (days)',
                  hintText: 'e.g., 3',
                ),
                keyboardType: TextInputType.number,
                onChanged: (value) => repeatReminderDays = int.tryParse(value),
              ),
            ],
          ],
          
          Divider(),
          
          // Permissions
          SwitchListTile(
            title: Text('Allow Download Before Completion'),
            subtitle: Text('Participants can download PDF before all signatures are collected'),
            value: allowDownloadUnsigned,
            onChanged: (value) => setState(() => allowDownloadUnsigned = value),
          ),
          
          SwitchListTile(
            title: Text('Allow Participants to Reassign'),
            subtitle: Text('Participants can reassign their role to another person'),
            value: allowReassign,
            onChanged: (value) => setState(() => allowReassign = value),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          final options = PackageOptions(
            expiresAt: expiresAt,
            sendExpirationReminders: sendExpirationReminders,
            reminderPeriod: reminderPeriod,
            sendAutomaticReminders: sendAutomaticReminders,
            firstReminderDays: firstReminderDays,
            repeatReminderDays: repeatReminderDays,
            allowDownloadUnsigned: allowDownloadUnsigned,
            allowReassign: allowReassign,
          );
          widget.onSave(options);
        },
        label: Text('Save Settings'),
        icon: Icon(Icons.save),
      ),
    );
  }
}
```

---

## Save as Draft

### Draft Package Structure

**Package Model:**
```dart
class DocumentPackage {
  final String? id; // MongoDB ID (null for new packages)
  final String name; // Package title
  final String attachmentUuid;
  final String fileUrl;
  final String s3Key;
  final List<PackageField> fields;
  final List<Receiver> receivers; // Notification-only recipients
  final PackageOptions options;
  final String? customMessage;
  final String status; // 'Draft', 'Sent', 'Completed', etc.
  final String? templateId;
  
  DocumentPackage({
    this.id,
    required this.name,
    required this.attachmentUuid,
    required this.fileUrl,
    required this.s3Key,
    this.fields = const [],
    this.receivers = const [],
    required this.options,
    this.customMessage,
    this.status = 'Draft',
    this.templateId,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'attachment_uuid': attachmentUuid,
      'fileUrl': fileUrl,
      's3Key': s3Key,
      'fields': fields.map((f) => f.toJson()).toList(),
      'receivers': receivers.map((r) => r.toJson()).toList(),
      'options': options.toJson(),
      'customMessage': customMessage,
      'status': status,
      'templateId': templateId,
    };
  }
}

class Receiver {
  final String id;
  final String contactId;
  final String contactName;
  final String contactEmail;
  
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
}
```

### Save Draft API

**For New Package:**

**Endpoint:** `POST /api/packages`

**Request:**
```dart
Future<DocumentPackage> saveDraft(DocumentPackage package) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final response = await dio.post(
    'https://your-api-url.com/api/packages',
    data: package.toJson(),
    options: Options(
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ),
  );
  
  if (response.data['success']) {
    return DocumentPackage.fromJson(response.data['data']);
  }
  throw Exception(response.data['error']);
}
```

**For Existing Draft:**

**Endpoint:** `PATCH /api/packages/{packageId}`

**Request:**
```dart
Future<DocumentPackage> updateDraft(String packageId, DocumentPackage package) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final response = await dio.patch(
    'https://your-api-url.com/api/packages/$packageId',
    data: package.toJson(),
    options: Options(
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ),
  );
  
  if (response.data['success']) {
    return DocumentPackage.fromJson(response.data['data']);
  }
  throw Exception(response.data['error']);
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Package created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j0",
    "ownerId": "userId123",
    "name": "Employment Contract",
    "attachment_uuid": "e8f3c2a0-1b4d-4e9c-8f7a-6d5b4c3a2b1e",
    "fileUrl": "https://s3.amazonaws.com/...",
    "s3Key": "packages/userId/uuid.pdf",
    "fields": [...],
    "receivers": [...],
    "options": {...},
    "status": "Draft",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Draft Validation

**Minimum Requirements for Draft:**
```dart
bool canSaveAsDraft(DocumentPackage package) {
  // Must have package name
  if (package.name.trim().isEmpty || package.name.length < 3) {
    return false;
  }
  
  // Must have document uploaded
  if (package.s3Key.isEmpty || package.attachmentUuid.isEmpty) {
    return false;
  }
  
  return true;
}
```

---

## Loading & Editing Draft Packages

### Overview

This section covers how to:
1. Load a previously saved draft package
2. Display it in the editor with all fields
3. Continue editing (add/remove/modify fields)
4. Update the draft
5. Send it for signature

### Loading Draft Package List

**Step 1: Get All Draft Packages**

**Endpoint:** `GET /api/packages?status=Draft`

**Flutter Implementation:**
```dart
Future<List<DocumentPackage>> loadDraftPackages() async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final response = await dio.get(
    'https://your-api-url.com/api/packages',
    queryParameters: {
      'status': 'Draft',
      'page': 1,
      'limit': 50,
      'sortKey': 'updatedAt',
      'sortDirection': 'desc',
    },
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  
  if (response.data['success']) {
    final packages = response.data['data']['packages'] as List;
    return packages.map((p) => DocumentPackage.fromJson(p)).toList();
  }
  throw Exception('Failed to load drafts');
}
```

**Draft List UI:**
```dart
class DraftListScreen extends StatefulWidget {
  @override
  _DraftListScreenState createState() => _DraftListScreenState();
}

class _DraftListScreenState extends State<DraftListScreen> {
  List<DocumentPackage> drafts = [];
  bool isLoading = true;
  
  @override
  void initState() {
    super.initState();
    loadDrafts();
  }
  
  Future<void> loadDrafts() async {
    setState(() => isLoading = true);
    try {
      drafts = await loadDraftPackages();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load drafts: $e')),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }
    
    if (drafts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.draft, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No draft packages found'),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/create-package'),
              child: Text('Create New Package'),
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      itemCount: drafts.length,
      itemBuilder: (context, index) {
        final draft = drafts[index];
        return DraftCard(
          package: draft,
          onTap: () => openDraftEditor(draft),
          onDelete: () => deleteDraft(draft.id!),
        );
      },
    );
  }
  
  void openDraftEditor(DocumentPackage draft) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DraftEditorScreen(draftPackage: draft),
      ),
    );
  }
  
  Future<void> deleteDraft(String packageId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Draft'),
        content: Text('Are you sure you want to delete this draft?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    
    if (confirm == true) {
      try {
        final token = await storage.read(key: 'authToken');
        final dio = Dio();
        await dio.delete(
          'https://your-api-url.com/api/packages/$packageId',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );
        loadDrafts(); // Reload list
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Draft deleted successfully')),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete draft: $e')),
        );
      }
    }
  }
}
```

**Draft Card Widget:**
```dart
class DraftCard extends StatelessWidget {
  final DocumentPackage package;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  
  const DraftCard({
    required this.package,
    required this.onTap,
    required this.onDelete,
  });
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: Icon(Icons.draft, color: Colors.orange),
        title: Text(
          package.name,
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 4),
            Text('${package.fields.length} fields'),
            Text(
              'Last modified: ${DateFormat.yMMMd().add_jm().format(DateTime.parse(package.updatedAt))}',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        trailing: IconButton(
          icon: Icon(Icons.delete, color: Colors.red),
          onPressed: onDelete,
        ),
        onTap: onTap,
      ),
    );
  }
}
```

### Loading Specific Draft Package

**Step 2: Load Full Package Details**

When user selects a draft, load complete package data with all fields:

**Endpoint:** `GET /api/packages/{packageId}`

**Implementation:**
```dart
Future<DocumentPackage> loadDraftPackageById(String packageId) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final response = await dio.get(
    'https://your-api-url.com/api/packages/$packageId',
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  
  if (response.data['success']) {
    return DocumentPackage.fromJson(response.data['data']);
  }
  throw Exception('Failed to load draft package');
}
```

### Restoring Draft State

**Step 3: Initialize Editor with Draft Data**

**Draft Editor Screen:**
```dart
class DraftEditorScreen extends StatefulWidget {
  final DocumentPackage draftPackage;
  
  const DraftEditorScreen({required this.draftPackage});
  
  @override
  _DraftEditorScreenState createState() => _DraftEditorScreenState();
}

class _DraftEditorScreenState extends State<DraftEditorScreen> {
  late DocumentPackage currentPackage;
  late PdfController pdfController;
  bool isLoadingPdf = true;
  bool isSaving = false;
  String? selectedFieldId;
  
  @override
  void initState() {
    super.initState();
    currentPackage = widget.draftPackage;
    loadPDF();
  }
  
  Future<void> loadPDF() async {
    setState(() => isLoadingPdf = true);
    
    try {
      // Download PDF from fileUrl (S3 signed URL)
      final pdfDocument = await PdfDocument.openUri(currentPackage.fileUrl);
      pdfController = PdfController(document: pdfDocument);
      
      setState(() => isLoadingPdf = false);
    } catch (e) {
      setState(() => isLoadingPdf = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load PDF: $e')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Edit Draft: ${currentPackage.name}'),
        actions: [
          // Save Draft Button
          IconButton(
            icon: Icon(Icons.save),
            onPressed: isSaving ? null : saveDraft,
            tooltip: 'Save Draft',
          ),
          // Send Button
          IconButton(
            icon: Icon(Icons.send),
            onPressed: isSaving ? null : sendPackage,
            tooltip: 'Send for Signature',
          ),
        ],
      ),
      body: isLoadingPdf
          ? Center(child: CircularProgressIndicator())
          : Row(
              children: [
                // Left Panel: Field Types & Properties
                Container(
                  width: 300,
                  child: Column(
                    children: [
                      // Package Name Editor
                      Padding(
                        padding: EdgeInsets.all(16),
                        child: TextField(
                          decoration: InputDecoration(
                            labelText: 'Package Name',
                            border: OutlineInputBorder(),
                          ),
                          controller: TextEditingController(text: currentPackage.name),
                          onChanged: (value) {
                            setState(() {
                              currentPackage = currentPackage.copyWith(name: value);
                            });
                          },
                        ),
                      ),
                      
                      Divider(),
                      
                      // Field Types Toolbar
                      Expanded(
                        child: selectedFieldId == null
                            ? FieldTypesToolbar(
                                onFieldTypeSelected: (fieldType) {
                                  // Field will be added via drag & drop on PDF
                                },
                              )
                            : FieldPropertiesPanel(
                                field: currentPackage.fields.firstWhere(
                                  (f) => f.id == selectedFieldId,
                                ),
                                onUpdate: updateField,
                                onDelete: deleteField,
                                onAssignUser: (user) => assignUserToField(selectedFieldId!, user),
                              ),
                      ),
                    ],
                  ),
                ),
                
                VerticalDivider(width: 1),
                
                // Right Panel: PDF Viewer with Fields
                Expanded(
                  child: PDFEditorView(
                    pdfController: pdfController,
                    fields: currentPackage.fields,
                    onFieldAdded: addField,
                    onFieldSelected: (fieldId) {
                      setState(() => selectedFieldId = fieldId);
                    },
                    onFieldPositionChanged: updateFieldPosition,
                  ),
                ),
              ],
            ),
    );
  }
  
  // Add new field
  void addField(PackageField field) {
    setState(() {
      currentPackage = currentPackage.copyWith(
        fields: [...currentPackage.fields, field],
      );
      selectedFieldId = field.id; // Select newly added field
    });
  }
  
  // Update existing field
  void updateField(PackageField updatedField) {
    setState(() {
      final fields = currentPackage.fields.map((f) {
        return f.id == updatedField.id ? updatedField : f;
      }).toList();
      currentPackage = currentPackage.copyWith(fields: fields);
    });
  }
  
  // Delete field
  void deleteField(String fieldId) {
    setState(() {
      currentPackage = currentPackage.copyWith(
        fields: currentPackage.fields.where((f) => f.id != fieldId).toList(),
      );
      selectedFieldId = null;
    });
  }
  
  // Update field position (after drag)
  void updateFieldPosition(String fieldId, double x, double y) {
    setState(() {
      final fields = currentPackage.fields.map((field) {
        if (field.id == fieldId) {
          return field.copyWith(x: x, y: y);
        }
        return field;
      }).toList();
      currentPackage = currentPackage.copyWith(fields: fields);
    });
  }
  
  // Assign user to field
  void assignUserToField(String fieldId, AssignedUser user) {
    setState(() {
      final fields = currentPackage.fields.map((field) {
        if (field.id == fieldId) {
          return field.copyWith(
            assignedUsers: [...field.assignedUsers, user],
          );
        }
        return field;
      }).toList();
      currentPackage = currentPackage.copyWith(fields: fields);
    });
  }
  
  // Save draft (update existing)
  Future<void> saveDraft() async {
    setState(() => isSaving = true);
    
    try {
      final token = await storage.read(key: 'authToken');
      final dio = Dio();
      
      final packageData = currentPackage.toJson();
      packageData['status'] = 'Draft'; // Keep as draft
      
      final response = await dio.patch(
        'https://your-api-url.com/api/packages/${currentPackage.id}',
        data: packageData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );
      
      if (response.data['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Draft saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Update with server response
        setState(() {
          currentPackage = DocumentPackage.fromJson(response.data['data']);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save draft: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => isSaving = false);
    }
  }
  
  // Send package for signature
  Future<void> sendPackage() async {
    // Validate before sending
    final validation = PackageSendValidator.validateForSending(currentPackage);
    
    if (!validation.isValid) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Validation Errors'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: validation.errors.map((error) {
                return Padding(
                  padding: EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Icon(Icons.error, color: Colors.red, size: 16),
                      SizedBox(width: 8),
                      Expanded(child: Text(error)),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK'),
            ),
          ],
        ),
      );
      return;
    }
    
    // Calculate credits needed
    final creditsNeeded = PackageSendValidator.calculateDocumentCredits(currentPackage);
    
    // Confirm before sending
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Send Package'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('You are about to send this package for signature.'),
            SizedBox(height: 16),
            Text('Package: ${currentPackage.name}'),
            Text('Fields: ${currentPackage.fields.length}'),
            Text('Credits required: $creditsNeeded'),
            SizedBox(height: 16),
            Text(
              'Once sent, you cannot edit the fields.',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.orange,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Send'),
          ),
        ],
      ),
    );
    
    if (confirm != true) return;
    
    setState(() => isSaving = true);
    
    try {
      final token = await storage.read(key: 'authToken');
      final dio = Dio();
      
      final packageData = currentPackage.toJson();
      packageData['status'] = 'Sent'; // Change status to Sent
      
      final response = await dio.patch(
        'https://your-api-url.com/api/packages/${currentPackage.id}',
        data: packageData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );
      
      if (response.data['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Package sent successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Navigate back to package list
        Navigator.pop(context);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to send package: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => isSaving = false);
    }
  }
}
```

### PDF Editor View with Existing Fields

**Step 4: Display PDF with All Existing Fields**

```dart
class PDFEditorView extends StatefulWidget {
  final PdfController pdfController;
  final List<PackageField> fields;
  final Function(PackageField) onFieldAdded;
  final Function(String) onFieldSelected;
  final Function(String, double, double) onFieldPositionChanged;
  
  const PDFEditorView({
    required this.pdfController,
    required this.fields,
    required this.onFieldAdded,
    required this.onFieldSelected,
    required this.onFieldPositionChanged,
  });
  
  @override
  _PDFEditorViewState createState() => _PDFEditorViewState();
}

class _PDFEditorViewState extends State<PDFEditorView> {
  int currentPage = 1;
  double scaleFactor = 1.0;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Page Navigation
        Container(
          padding: EdgeInsets.all(8),
          color: Colors.grey[200],
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: Icon(Icons.arrow_back),
                onPressed: currentPage > 1
                    ? () => setState(() => currentPage--)
                    : null,
              ),
              Text('Page $currentPage'),
              IconButton(
                icon: Icon(Icons.arrow_forward),
                onPressed: () => setState(() => currentPage++),
              ),
            ],
          ),
        ),
        
        // PDF with Fields Overlay
        Expanded(
          child: DragTarget<String>(
            onAccept: (fieldType) {
              // Handle field drop - add new field
            },
            builder: (context, candidateData, rejectedData) {
              return Stack(
                children: [
                  // PDF Page
                  PdfView(
                    controller: widget.pdfController,
                    onDocumentLoaded: (document) {
                      setState(() {
                        // Calculate scale factor
                      });
                    },
                  ),
                  
                  // Field Overlays
                  ...widget.fields
                      .where((field) => field.page == currentPage)
                      .map((field) => Positioned(
                            left: field.x * scaleFactor,
                            top: field.y * scaleFactor,
                            child: DraggableField(
                              field: field,
                              scaleFactor: scaleFactor,
                              onTap: () => widget.onFieldSelected(field.id),
                              onDragEnd: (newX, newY) {
                                // Convert screen coordinates back to PDF coordinates
                                final pdfX = newX / scaleFactor;
                                final pdfY = newY / scaleFactor;
                                widget.onFieldPositionChanged(field.id, pdfX, pdfY);
                              },
                            ),
                          )),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}
```

**Draggable Field Widget:**
```dart
class DraggableField extends StatefulWidget {
  final PackageField field;
  final double scaleFactor;
  final VoidCallback onTap;
  final Function(double, double) onDragEnd;
  
  const DraggableField({
    required this.field,
    required this.scaleFactor,
    required this.onTap,
    required this.onDragEnd,
  });
  
  @override
  _DraggableFieldState createState() => _DraggableFieldState();
}

class _DraggableFieldState extends State<DraggableField> {
  Offset position = Offset.zero;
  
  @override
  void initState() {
    super.initState();
    position = Offset(
      widget.field.x * widget.scaleFactor,
      widget.field.y * widget.scaleFactor,
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: position.dx,
      top: position.dy,
      child: GestureDetector(
        onTap: widget.onTap,
        onPanUpdate: (details) {
          setState(() {
            position = Offset(
              position.dx + details.delta.dx,
              position.dy + details.delta.dy,
            );
          });
        },
        onPanEnd: (details) {
          widget.onDragEnd(position.dx, position.dy);
        },
        child: Container(
          width: widget.field.width * widget.scaleFactor,
          height: widget.field.height * widget.scaleFactor,
          decoration: BoxDecoration(
            border: Border.all(
              color: widget.field.required ? Colors.red : Colors.blue,
              width: 2,
            ),
            color: widget.field.assignedUsers.isEmpty
                ? Colors.red.withOpacity(0.2)
                : Colors.blue.withOpacity(0.2),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _getFieldIcon(widget.field.type),
                size: 16,
              ),
              SizedBox(height: 2),
              Text(
                widget.field.label,
                style: TextStyle(fontSize: 10),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              // Show assigned users count
              if (widget.field.assignedUsers.isNotEmpty)
                Text(
                  '${widget.field.assignedUsers.length} user(s)',
                  style: TextStyle(fontSize: 8, color: Colors.grey),
                ),
            ],
          ),
        ),
      ),
    );
  }
  
  IconData _getFieldIcon(String fieldType) {
    switch (fieldType) {
      case 'signature':
        return Icons.draw;
      case 'text':
        return Icons.text_fields;
      case 'textarea':
        return Icons.notes;
      case 'checkbox':
        return Icons.check_box;
      case 'radio':
        return Icons.radio_button_checked;
      case 'date':
        return Icons.calendar_today;
      case 'dropdown':
        return Icons.arrow_drop_down;
      default:
        return Icons.help;
    }
  }
}
```

### Continuing to Edit Fields

**Step 5: Add, Modify, or Remove Fields**

**Adding New Fields:**
```dart
// User drags field type onto PDF
void handleFieldDrop(String fieldType, Offset dropPosition, int page) {
  final pdfX = dropPosition.dx / scaleFactor;
  final pdfY = dropPosition.dy / scaleFactor;
  
  final newField = PackageField(
    id: Uuid().v4(),
    type: fieldType,
    page: page,
    x: pdfX,
    y: pdfY,
    width: getDefaultFieldWidth(fieldType),
    height: getDefaultFieldHeight(fieldType),
    label: getDefaultLabel(fieldType),
    required: fieldType == 'signature',
    assignedUsers: [],
  );
  
  widget.onFieldAdded(newField);
}
```

**Modifying Existing Fields:**
```dart
// When user selects a field, show properties panel
// User can change label, placeholder, required status, etc.
// When user assigns participants, add to assignedUsers list

void updateFieldProperties(String fieldId, Map<String, dynamic> updates) {
  final field = currentPackage.fields.firstWhere((f) => f.id == fieldId);
  
  final updatedField = field.copyWith(
    label: updates['label'] ?? field.label,
    placeholder: updates['placeholder'] ?? field.placeholder,
    required: updates['required'] ?? field.required,
    options: updates['options'] ?? field.options,
    groupId: updates['groupId'] ?? field.groupId,
  );
  
  updateField(updatedField);
}
```

**Removing Fields:**
```dart
void removeField(String fieldId) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Delete Field'),
      content: Text('Are you sure you want to delete this field?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancel'),
        ),
        TextButton(
          onPressed: () {
            deleteField(fieldId);
            Navigator.pop(context);
          },
          child: Text('Delete', style: TextStyle(color: Colors.red)),
        ),
      ],
    ),
  );
}
```

### Auto-Save Draft (Optional)

**Step 6: Implement Auto-Save**

```dart
class DraftAutoSave {
  Timer? _autoSaveTimer;
  DateTime? _lastSaved;
  bool _hasUnsavedChanges = false;
  
  void startAutoSave(Function() saveFunction, {Duration interval = const Duration(minutes: 2)}) {
    _autoSaveTimer?.cancel();
    _autoSaveTimer = Timer.periodic(interval, (timer) {
      if (_hasUnsavedChanges) {
        saveFunction();
        _hasUnsavedChanges = false;
        _lastSaved = DateTime.now();
      }
    });
  }
  
  void markAsChanged() {
    _hasUnsavedChanges = true;
  }
  
  void stopAutoSave() {
    _autoSaveTimer?.cancel();
  }
  
  String getLastSavedText() {
    if (_lastSaved == null) return 'Not saved yet';
    final duration = DateTime.now().difference(_lastSaved!);
    if (duration.inMinutes < 1) return 'Saved just now';
    if (duration.inMinutes < 60) return 'Saved ${duration.inMinutes} min ago';
    return 'Saved ${duration.inHours} hour(s) ago';
  }
}

// Usage in DraftEditorScreen
class _DraftEditorScreenState extends State<DraftEditorScreen> {
  final DraftAutoSave _autoSave = DraftAutoSave();
  
  @override
  void initState() {
    super.initState();
    _autoSave.startAutoSave(() => saveDraft());
  }
  
  @override
  void dispose() {
    _autoSave.stopAutoSave();
    super.dispose();
  }
  
  // Call this whenever package is modified
  void onPackageModified() {
    _autoSave.markAsChanged();
  }
  
  // Show auto-save status in UI
  Widget buildAutoSaveStatus() {
    return Text(
      _autoSave.getLastSavedText(),
      style: TextStyle(fontSize: 12, color: Colors.grey),
    );
  }
}
```

### Update Existing Draft

**Step 7: Save Changes to Draft**

**Endpoint:** `PATCH /api/packages/{packageId}`

**Implementation:**
```dart
Future<DocumentPackage> updateDraft(
  String packageId,
  DocumentPackage package,
) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final packageData = package.toJson();
  packageData['status'] = 'Draft'; // Ensure it stays as Draft
  
  final response = await dio.patch(
    'https://your-api-url.com/api/packages/$packageId',
    data: packageData,
    options: Options(
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ),
  );
  
  if (response.data['success']) {
    return DocumentPackage.fromJson(response.data['data']);
  }
  throw Exception(response.data['error']);
}
```

### Send Draft Package

**Step 8: Convert Draft to Sent Status**

**Before Sending Checklist:**
```dart
class PreSendChecklist {
  static Future<bool> showChecklist(BuildContext context, DocumentPackage package) async {
    final validation = PackageSendValidator.validateForSending(package);
    final progress = PackageProgress.calculate(package);
    final creditsNeeded = PackageSendValidator.calculateDocumentCredits(package);
    
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Send Package for Signature'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Package: ${package.name}', style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 16),
              
              // Validation Status
              if (validation.isValid) ...[
                Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green),
                    SizedBox(width: 8),
                    Text('All validations passed'),
                  ],
                ),
              ] else ...[
                Row(
                  children: [
                    Icon(Icons.error, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Validation errors found:'),
                  ],
                ),
                ...validation.errors.map((error) => Padding(
                      padding: EdgeInsets.only(left: 32, top: 4),
                      child: Text('• $error', style: TextStyle(color: Colors.red)),
                    )),
              ],
              
              SizedBox(height: 16),
              Divider(),
              SizedBox(height: 16),
              
              // Package Summary
              Text('Summary:', style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('• ${package.fields.length} fields'),
              Text('• ${progress.totalParticipants} participants'),
              Text('• ${creditsNeeded} document credit(s) will be used'),
              
              if (package.options.expiresAt != null)
                Text('• Expires: ${DateFormat.yMMMd().add_jm().format(package.options.expiresAt!)}'),
              
              SizedBox(height: 16),
              
              // Warning
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  border: Border.all(color: Colors.orange),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Once sent, you cannot edit fields or participants.',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: validation.isValid
                ? () => Navigator.pop(context, true)
                : null,
            child: Text('Send Package'),
          ),
        ],
      ),
    ) ?? false;
  }
}
```

**Send Package Function:**
```dart
Future<void> sendDraftPackage(String packageId, DocumentPackage package) async {
  // Show pre-send checklist
  final confirmed = await PreSendChecklist.showChecklist(context, package);
  if (!confirmed) return;
  
  setState(() => isSaving = true);
  
  try {
    final token = await storage.read(key: 'authToken');
    final dio = Dio();
    
    final packageData = package.toJson();
    packageData['status'] = 'Sent'; // Change status to Sent
    
    final response = await dio.patch(
      'https://your-api-url.com/api/packages/$packageId',
      data: packageData,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ),
    );
    
    if (response.data['success']) {
      // Show success dialog
      await showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green),
              SizedBox(width: 8),
              Text('Package Sent'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Your package has been sent successfully!'),
              SizedBox(height: 16),
              Text('All participants will receive email notifications with their signing links.'),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Close editor
              },
              child: Text('OK'),
            ),
          ],
        ),
      );
    }
  } catch (e) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.error, color: Colors.red),
            SizedBox(width: 8),
            Text('Send Failed'),
          ],
        ),
        content: Text('Failed to send package: $e'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  } finally {
    setState(() => isSaving = false);
  }
}
```

### Complete Workflow Example

**Full Flow from Draft List to Sent:**

```dart
// 1. User opens app and navigates to Drafts screen
Navigator.pushNamed(context, '/drafts');

// 2. DraftListScreen loads all draft packages
List<DocumentPackage> drafts = await loadDraftPackages();

// 3. User selects a draft to edit
onDraftSelected(DocumentPackage draft) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => DraftEditorScreen(draftPackage: draft),
    ),
  );
}

// 4. DraftEditorScreen loads PDF and displays all existing fields
await loadPDF(draft.fileUrl);
displayFieldsOnPDF(draft.fields);

// 5. User edits the package:
// - Add new fields
// - Modify field properties
// - Assign participants
// - Update package settings

// 6. Changes are auto-saved every 2 minutes (or manual save)
await saveDraft(); // PATCH /api/packages/{id} with status: 'Draft'

// 7. When ready, user clicks "Send"
await sendDraftPackage(); // PATCH /api/packages/{id} with status: 'Sent'

// 8. Success! Package is now sent to all participants
```

### Summary

**Key Points for Loading & Editing Drafts:**

✅ **Loading Drafts:**
- Fetch draft list with `GET /api/packages?status=Draft`
- Load specific draft with `GET /api/packages/{id}`
- Display draft cards with package name, field count, and last modified date

✅ **Restoring State:**
- Load PDF from `fileUrl` (S3 signed URL)
- Display all existing fields on their respective pages
- Initialize field positions using stored x, y coordinates
- Show assigned users for each field

✅ **Editing Capabilities:**
- Add new fields via drag & drop
- Modify field properties (label, required, etc.)
- Assign/remove participants
- Move/resize fields
- Update package settings

✅ **Saving Changes:**
- Manual save with `PATCH /api/packages/{id}` (status: 'Draft')
- Auto-save every 2 minutes (optional)
- Show last saved timestamp

✅ **Sending Package:**
- Pre-send validation checklist
- Confirm with user (show credits, participants, etc.)
- Update package with `PATCH /api/packages/{id}` (status: 'Sent')
- Show success confirmation

✅ **Important:**
- Draft packages can be edited multiple times
- Once sent (status: 'Sent'), fields cannot be edited
- All field positions and assignments are preserved
- PDF is re-downloaded from S3 URL each time

---

## Send Package

### Pre-Send Validation

**Complete Validation Before Sending:**
```dart
class PackageSendValidator {
  static ValidationResult validateForSending(DocumentPackage package) {
    List<String> errors = [];
    
    // 1. Package name validation
    if (package.name.trim().isEmpty || package.name.length < 3) {
      errors.add('Package name must be at least 3 characters');
    }
    
    // 2. Document validation
    if (package.s3Key.isEmpty || package.attachmentUuid.isEmpty) {
      errors.add('No document uploaded');
    }
    
    // 3. Must have at least one field
    if (package.fields.isEmpty) {
      errors.add('Package must have at least one field');
    }
    
    // 4. All required fields must have assigned users
    for (final field in package.fields) {
      if (field.required && field.assignedUsers.isEmpty) {
        errors.add('Required field "${field.label}" has no assigned users');
      }
    }
    
    // 5. Signature field validation
    for (final field in package.fields.where((f) => f.type == 'signature')) {
      final signers = field.assignedUsers.where((u) => u.role == 'Signer').toList();
      
      if (field.required && signers.isEmpty) {
        errors.add('Required signature field "${field.label}" has no Signer');
      }
      
      if (signers.length > 1) {
        errors.add('Signature field "${field.label}" cannot have more than 1 Signer');
      }
      
      if (signers.isNotEmpty) {
        final signer = signers.first;
        if (signer.signatureMethods == null || signer.signatureMethods!.isEmpty) {
          errors.add('Signer for "${field.label}" must have at least one signature method');
        }
      }
    }
    
    // 6. At least one participant must be assigned
    final allParticipants = <String>{};
    for (final field in package.fields) {
      for (final user in field.assignedUsers) {
        allParticipants.add(user.contactId);
      }
    }
    if (allParticipants.isEmpty) {
      errors.add('Package must have at least one participant assigned');
    }
    
    return ValidationResult(
      isValid: errors.isEmpty,
      errors: errors,
    );
  }
  
  static int calculateDocumentCredits(DocumentPackage package) {
    // Count unique signers
    final uniqueSigners = <String>{};
    
    for (final field in package.fields.where((f) => f.type == 'signature')) {
      for (final user in field.assignedUsers.where((u) => u.role == 'Signer')) {
        uniqueSigners.add(user.contactId);
      }
    }
    
    // 1 credit = up to 2 signers (rounded up)
    if (uniqueSigners.isEmpty) return 1; // Minimum 1 credit
    return (uniqueSigners.length / 2).ceil();
  }
}

class ValidationResult {
  final bool isValid;
  final List<String> errors;
  
  ValidationResult({required this.isValid, required this.errors});
}
```

### Send Package API

**Endpoint:** `POST /api/packages` (with status: 'Sent')

**Request:**
```dart
Future<DocumentPackage> sendPackage(DocumentPackage package) async {
  // Validate before sending
  final validation = PackageSendValidator.validateForSending(package);
  if (!validation.isValid) {
    throw ValidationException(validation.errors.join('\n'));
  }
  
  // Calculate credits needed
  final creditsNeeded = PackageSendValidator.calculateDocumentCredits(package);
  print('Package requires $creditsNeeded credit(s)');
  
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  // Set status to 'Sent'
  final packageData = package.toJson();
  packageData['status'] = 'Sent';
  
  final response = await dio.post(
    'https://your-api-url.com/api/packages',
    data: packageData,
    options: Options(
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ),
  );
  
  if (response.data['success']) {
    return DocumentPackage.fromJson(response.data['data']);
  }
  throw Exception(response.data['error']);
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Package created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j0",
    "ownerId": "userId123",
    "name": "Employment Contract",
    "status": "Sent",
    "sentAt": "2024-01-15T10:30:00.000Z",
    "fields": [...],
    "receivers": [...],
    ...
  }
}
```

### What Happens When Package is Sent

1. **Status Changes:** `Draft` → `Sent`
2. **Timestamp:** `sentAt` is set to current time
3. **Credits Consumed:** Document credits are deducted based on unique signers
4. **Email Notifications:** All participants receive email with access link
5. **Access Links Generated:** Each participant gets unique URL: `/package/{packageId}/participant/{participantId}`

---

## Review & Status Tracking

### Package Status Flow

```
Draft → Sent → In Progress → Completed
  ↓       ↓         ↓            ↓
  ↓    Rejected  Expired     Archived
  ↓    Revoked
  └─> Can be edited
```

**Status Definitions:**

- **Draft**: Created but not sent. Owner can edit/delete.
- **Sent**: Sent to participants but no one has signed yet.
- **In Progress**: At least one participant has started signing (implicit, shown as "Sent").
- **Completed**: All participants have completed their actions.
- **Rejected**: A participant rejected the package.
- **Expired**: Package passed expiration date without completion.
- **Revoked**: Owner manually revoked the package.
- **Archived**: Owner archived completed/rejected packages.

### Fetching Package List

**Endpoint:** `GET /api/packages`

**Query Parameters:**
```dart
class PackageFilters {
  final String? status; // 'All', 'Draft', 'Pending', 'Finished', 'Rejected', 'Expired'
  final String? name; // Search by name
  final int page; // Page number (default: 1)
  final int limit; // Items per page (default: 10)
  final String? sortKey; // 'name', 'status', 'addedOn'
  final String? sortDirection; // 'asc', 'desc'
}
```

**Request:**
```dart
Future<PackageListResponse> getPackages({
  String? status,
  String? name,
  int page = 1,
  int limit = 10,
  String sortKey = 'addedOn',
  String sortDirection = 'desc',
}) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final queryParams = {
    'page': page,
    'limit': limit,
    'sortKey': sortKey,
    'sortDirection': sortDirection,
  };
  
  if (status != null && status != 'All') {
    queryParams['status'] = status;
  }
  
  if (name != null && name.isNotEmpty) {
    queryParams['name'] = name;
  }
  
  final response = await dio.get(
    'https://your-api-url.com/api/packages',
    queryParameters: queryParams,
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  
  if (response.data['success']) {
    return PackageListResponse.fromJson(response.data['data']);
  }
  throw Exception(response.data['error']);
}

class PackageListResponse {
  final List<DocumentPackage> packages;
  final int total;
  final int page;
  final int pages;
  
  PackageListResponse({
    required this.packages,
    required this.total,
    required this.page,
    required this.pages,
  });
  
  factory PackageListResponse.fromJson(Map<String, dynamic> json) {
    return PackageListResponse(
      packages: (json['packages'] as List)
          .map((p) => DocumentPackage.fromJson(p))
          .toList(),
      total: json['total'],
      page: json['page'],
      pages: json['pages'],
    );
  }
}
```

### Checking Package Progress

**Get Single Package:**

**Endpoint:** `GET /api/packages/{packageId}`

**Request:**
```dart
Future<DocumentPackage> getPackageById(String packageId) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  final response = await dio.get(
    'https://your-api-url.com/api/packages/$packageId',
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  
  if (response.data['success']) {
    return DocumentPackage.fromJson(response.data['data']);
  }
  throw Exception(response.data['error']);
}
```

**Progress Calculation:**
```dart
class PackageProgress {
  final int totalFields;
  final int completedFields;
  final int totalParticipants;
  final int completedParticipants;
  final double progressPercentage;
  
  PackageProgress({
    required this.totalFields,
    required this.completedFields,
    required this.totalParticipants,
    required this.completedParticipants,
    required this.progressPercentage,
  });
  
  static PackageProgress calculate(DocumentPackage package) {
    int totalFields = 0;
    int completedFields = 0;
    Set<String> totalParticipants = {};
    Set<String> completedParticipants = {};
    
    for (final field in package.fields) {
      for (final user in field.assignedUsers) {
        totalParticipants.add(user.contactId);
        
        if (user.role == 'Signer' && user.signed) {
          completedParticipants.add(user.contactId);
        }
        
        // Check if field is completed
        if (field.required) {
          totalFields++;
          if (field.value != null) {
            completedFields++;
          }
        }
      }
    }
    
    final progressPercentage = totalFields > 0 
        ? (completedFields / totalFields) * 100 
        : 0.0;
    
    return PackageProgress(
      totalFields: totalFields,
      completedFields: completedFields,
      totalParticipants: totalParticipants.length,
      completedParticipants: completedParticipants.length,
      progressPercentage: progressPercentage,
    );
  }
}
```

### Package Progress UI

```dart
class PackageProgressCard extends StatelessWidget {
  final DocumentPackage package;
  
  @override
  Widget build(BuildContext context) {
    final progress = PackageProgress.calculate(package);
    
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        children: [
          Text(package.name, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          
          // Status Badge
          Chip(
            label: Text(package.status),
            backgroundColor: _getStatusColor(package.status),
          ),
          
          SizedBox(height: 16),
          
          // Progress Bar
          LinearProgressIndicator(
            value: progress.progressPercentage / 100,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
          ),
          
          SizedBox(height: 8),
          
          // Progress Text
          Text('${progress.completedFields}/${progress.totalFields} fields completed'),
          Text('${progress.completedParticipants}/${progress.totalParticipants} participants completed'),
          
          SizedBox(height: 16),
          
          // Participant List
          Text('Participants:', style: TextStyle(fontWeight: FontWeight.bold)),
          ...package.fields
              .expand((f) => f.assignedUsers)
              .map((user) => ListTile(
                    leading: Icon(
                      user.signed ? Icons.check_circle : Icons.pending,
                      color: user.signed ? Colors.green : Colors.orange,
                    ),
                    title: Text(user.contactName),
                    subtitle: Text(user.role),
                    trailing: user.signedAt != null 
                        ? Text(DateFormat.yMMMd().format(user.signedAt!))
                        : null,
                  ))
              .toSet() // Remove duplicates
              .toList(),
        ],
      ),
    );
  }
  
  Color _getStatusColor(String status) {
    switch (status) {
      case 'Draft':
        return Colors.grey;
      case 'Sent':
        return Colors.blue;
      case 'Completed':
        return Colors.green;
      case 'Rejected':
      case 'Expired':
        return Colors.red;
      case 'Revoked':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
```

### Downloading Completed Package

**Endpoint:** `GET /api/packages/{packageId}/download`

**Request:**
```dart
Future<void> downloadPackage(String packageId, String fileName) async {
  final token = await storage.read(key: 'authToken');
  final dio = Dio();
  
  // Get temporary directory for download
  final directory = await getTemporaryDirectory();
  final filePath = '${directory.path}/$fileName';
  
  await dio.download(
    'https://your-api-url.com/api/packages/$packageId/download',
    filePath,
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
      responseType: ResponseType.bytes,
    ),
    onReceiveProgress: (received, total) {
      if (total != -1) {
        final progress = (received / total) * 100;
        print('Download progress: ${progress.toStringAsFixed(0)}%');
      }
    },
  );
  
  // Open downloaded file
  await OpenFile.open(filePath);
}
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/login` | User login | No |
| POST | `/api/users/signup` | User registration | No |
| GET | `/api/users/profile` | Get user profile | Yes |

### Subscription Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subscriptions/status` | Check subscription status | Yes |
| GET | `/api/subscriptions` | Get subscription details | Yes |
| POST | `/api/subscriptions/create` | Purchase subscription | Yes |

### Contact Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/contacts` | Get all contacts | Yes |
| POST | `/api/contacts` | Create new contact | Yes |
| GET | `/api/contacts/:id` | Get contact by ID | Yes |
| PATCH | `/api/contacts/:id` | Update contact | Yes |
| DELETE | `/api/contacts/:id` | Delete contact | Yes |

### Package Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/packages/upload` | Upload PDF file | Yes |
| POST | `/api/packages` | Create package | Yes |
| GET | `/api/packages` | Get all packages (paginated) | Yes |
| GET | `/api/packages/:id` | Get package by ID | Yes |
| PATCH | `/api/packages/:id` | Update package | Yes |
| DELETE | `/api/packages/:id` | Delete package | Yes |
| GET | `/api/packages/:id/download` | Download package PDF | Yes |

### Template Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/templates` | Get all templates | Yes |
| GET | `/api/templates/:id` | Get template by ID | Yes |
| POST | `/api/templates` | Create template | Yes |

---

## Flutter Implementation Guide

### Project Setup

**Required Packages (pubspec.yaml):**
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  provider: ^6.0.5
  
  # Networking
  dio: ^5.3.0
  
  # Secure Storage
  flutter_secure_storage: ^9.0.0
  
  # PDF Rendering
  pdfx: ^2.5.0
  # OR
  syncfusion_flutter_pdfviewer: ^23.1.38
  
  # File Picker
  file_picker: ^5.5.0
  
  # Date/Time Formatting
  intl: ^0.18.0
  
  # Open Files
  open_file: ^3.3.2
  
  # Path Provider
  path_provider: ^2.1.1
  
  # UUID Generation
  uuid: ^4.0.0
```

### API Service Layer

**Create API Service:**
```dart
// lib/services/api_service.dart

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'https://your-api-url.com';
  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = FlutterSecureStorage();
  
  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add auth token to all requests
          final token = await _storage.read(key: 'authToken');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 (unauthorized) errors
          if (error.response?.statusCode == 401) {
            // Clear token and redirect to login
            await _storage.delete(key: 'authToken');
            // Navigate to login screen
          }
          return handler.next(error);
        },
      ),
    );
  }
  
  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/api/users/login', data: {
      'email': email,
      'password': password,
    });
    return response.data['data'];
  }
  
  // Check subscription
  Future<Map<String, dynamic>> getSubscriptionStatus() async {
    final response = await _dio.get('/api/subscriptions/status');
    return response.data['data'];
  }
  
  // Upload PDF
  Future<Map<String, dynamic>> uploadPDF(File file) async {
    FormData formData = FormData.fromMap({
      'package': await MultipartFile.fromFile(file.path, filename: 'document.pdf'),
    });
    final response = await _dio.post('/api/packages/upload', data: formData);
    return response.data['data'];
  }
  
  // Create/Update Package
  Future<Map<String, dynamic>> savePackage(Map<String, dynamic> packageData, {String? packageId}) async {
    if (packageId == null) {
      // Create new
      final response = await _dio.post('/api/packages', data: packageData);
      return response.data['data'];
    } else {
      // Update existing
      final response = await _dio.patch('/api/packages/$packageId', data: packageData);
      return response.data['data'];
    }
  }
  
  // Get packages
  Future<Map<String, dynamic>> getPackages({
    String? status,
    String? name,
    int page = 1,
    int limit = 10,
  }) async {
    final response = await _dio.get('/api/packages', queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (name != null) 'name': name,
    });
    return response.data['data'];
  }
  
  // Get contacts
  Future<List<Map<String, dynamic>>> getContacts({String? search}) async {
    final response = await _dio.get('/api/contacts', queryParameters: {
      if (search != null) 'search': search,
    });
    return List<Map<String, dynamic>>.from(response.data['data']);
  }
  
  // Create contact
  Future<Map<String, dynamic>> createContact(Map<String, dynamic> contactData) async {
    final response = await _dio.post('/api/contacts', data: contactData);
    return response.data['data'];
  }
}
```

### State Management (Provider)

**Package Provider:**
```dart
// lib/providers/package_provider.dart

import 'package:flutter/material.dart';

class PackageProvider extends ChangeNotifier {
  DocumentPackage? _currentPackage;
  bool _isLoading = false;
  String? _error;
  
  DocumentPackage? get currentPackage => _currentPackage;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  void startNewPackage(String attachmentUuid, String fileUrl, String s3Key) {
    _currentPackage = DocumentPackage(
      name: '',
      attachmentUuid: attachmentUuid,
      fileUrl: fileUrl,
      s3Key: s3Key,
      options: PackageOptions(),
    );
    notifyListeners();
  }
  
  void updatePackageName(String name) {
    if (_currentPackage != null) {
      _currentPackage = _currentPackage!.copyWith(name: name);
      notifyListeners();
    }
  }
  
  void addField(PackageField field) {
    if (_currentPackage != null) {
      _currentPackage = _currentPackage!.copyWith(
        fields: [..._currentPackage!.fields, field],
      );
      notifyListeners();
    }
  }
  
  void updateField(String fieldId, PackageField updatedField) {
    if (_currentPackage != null) {
      final fields = _currentPackage!.fields.map((f) {
        return f.id == fieldId ? updatedField : f;
      }).toList();
      _currentPackage = _currentPackage!.copyWith(fields: fields);
      notifyListeners();
    }
  }
  
  void removeField(String fieldId) {
    if (_currentPackage != null) {
      _currentPackage = _currentPackage!.copyWith(
        fields: _currentPackage!.fields.where((f) => f.id != fieldId).toList(),
      );
      notifyListeners();
    }
  }
  
  void assignUserToField(String fieldId, AssignedUser user) {
    if (_currentPackage != null) {
      final fields = _currentPackage!.fields.map((field) {
        if (field.id == fieldId) {
          return field.copyWith(
            assignedUsers: [...field.assignedUsers, user],
          );
        }
        return field;
      }).toList();
      _currentPackage = _currentPackage!.copyWith(fields: fields);
      notifyListeners();
    }
  }
  
  void updatePackageOptions(PackageOptions options) {
    if (_currentPackage != null) {
      _currentPackage = _currentPackage!.copyWith(options: options);
      notifyListeners();
    }
  }
  
  Future<void> saveDraft(ApiService api) async {
    if (_currentPackage == null) return;
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await api.savePackage(
        _currentPackage!.toJson(),
        packageId: _currentPackage!.id,
      );
      _currentPackage = DocumentPackage.fromJson(result);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  Future<void> sendPackage(ApiService api) async {
    if (_currentPackage == null) return;
    
    // Validate
    final validation = PackageSendValidator.validateForSending(_currentPackage!);
    if (!validation.isValid) {
      _error = validation.errors.join('\n');
      notifyListeners();
      throw Exception(_error);
    }
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final packageData = _currentPackage!.toJson();
      packageData['status'] = 'Sent';
      
      final result = await api.savePackage(
        packageData,
        packageId: _currentPackage!.id,
      );
      _currentPackage = DocumentPackage.fromJson(result);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  void clearPackage() {
    _currentPackage = null;
    _error = null;
    notifyListeners();
  }
}
```

### Main App Setup

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => PackageProvider()),
        Provider(create: (_) => ApiService()),
      ],
      child: MaterialApp(
        title: 'E-Sign App',
        theme: ThemeData(primarySwatch: Colors.blue),
        home: LoginScreen(),
        routes: {
          '/login': (context) => LoginScreen(),
          '/home': (context) => HomeScreen(),
          '/create-package': (context) => CreatePackageScreen(),
        },
      ),
    );
  }
}
```

---

## Common Errors & Troubleshooting

### Error: "No active subscription"

**Cause:** User doesn't have an active subscription

**Solution:**
```dart
// Check subscription before allowing document creation
final subscriptionStatus = await api.getSubscriptionStatus();
if (!subscriptionStatus['canCreatePackages']) {
  // Redirect to subscription page
  Navigator.pushNamed(context, '/subscription-required');
}
```

### Error: "S3 key is required"

**Cause:** Missing `s3Key` when creating package

**Solution:**
```dart
// Always include s3Key from upload response
final uploadResult = await api.uploadPDF(file);
package.s3Key = uploadResult['s3Key']; // REQUIRED
```

### Error: "Required field has no assigned users"

**Cause:** Trying to send package with unassigned required fields

**Solution:**
```dart
// Validate before sending
for (final field in package.fields) {
  if (field.required && field.assignedUsers.isEmpty) {
    showError('Field "${field.label}" must have at least one assigned user');
    return;
  }
}
```

### Error: "Signature field can only have 1 Signer"

**Cause:** Assigning multiple Signers to one signature field

**Solution:**
```dart
// Check existing signers before adding
if (role == 'Signer' && field.type == 'signature') {
  final existingSigners = field.assignedUsers.where((u) => u.role == 'Signer').length;
  if (existingSigners >= 1) {
    showError('A signature field can only have 1 Signer');
    return;
  }
}
```

### Error: "Signers must have at least one signature method"

**Cause:** Signer assigned without selecting Email OTP or SMS OTP

**Solution:**
```dart
// Validate signature methods for Signers
if (role == 'Signer' && signatureMethods.isEmpty) {
  showError('Please select at least one signature method (Email OTP or SMS OTP)');
  return;
}
```

### Error: "Invalid or expired token"

**Cause:** JWT token expired (24-hour expiration)

**Solution:**
```dart
// Handle 401 errors in Dio interceptor
onError: (error, handler) async {
  if (error.response?.statusCode == 401) {
    await storage.delete(key: 'authToken');
    Navigator.pushReplacementNamed(context, '/login');
  }
  return handler.next(error);
}
```

---

## Summary

### Complete Workflow Checklist

**Document Creation:**
- [ ] User is authenticated (JWT token stored)
- [ ] Subscription status verified (`canCreatePackages: true`)
- [ ] PDF file selected and uploaded (`attachment_uuid`, `s3Key`, `fileUrl` received)
- [ ] Package title set (minimum 3 characters)

**Field Configuration:**
- [ ] Fields added to PDF pages with correct positions
- [ ] Field types configured (signature, text, checkbox, etc.)
- [ ] Field properties set (label, placeholder, required, options)
- [ ] Radio buttons grouped with `groupId`

**Participant Assignment:**
- [ ] Contacts fetched or created
- [ ] Participants assigned to fields with correct roles
- [ ] Signature fields have exactly 1 Signer
- [ ] Signers have at least one signature method selected
- [ ] All required fields have assigned users

**Package Settings:**
- [ ] Expiration date set (optional)
- [ ] Reminder settings configured (optional)
- [ ] Permissions set (download, reassign)
- [ ] Custom message added (optional)

**Sending:**
- [ ] All validations passed
- [ ] Document credits calculated and available
- [ ] Package sent (status: 'Sent')
- [ ] Participants notified via email

**Review:**
- [ ] Package status tracked
- [ ] Progress monitored
- [ ] Completed package downloaded

### Key Points to Remember

1. **Always** check subscription status before creating documents
2. **Always** include `s3Key` from upload response
3. **Signature fields** can only have 1 Signer
4. **Signers** must have at least one signature method
5. **Required fields** must have assigned users before sending
6. **Tokens expire** after 24 hours - handle 401 errors
7. **Credits are calculated** based on unique signers (1 credit = 2 signers)
8. **Draft packages** can be edited; Sent packages cannot

---

## Additional Resources

- [Authentication Flow Documentation](./AUTHENTICATION_FLOW.md)
- [Document Signing Flow Documentation](./DOCUMENT_SIGNING_FLOW.md)
- [Subscription Flow Documentation](./SUBSCRIPTION_FLOW_COMPLETE.md)
- [Frontend Complete Flow Documentation](./FRONTEND_COMPLETE_FLOW.md)

---

**Document Version:** 1.0  
**Last Updated:** October 30, 2025  
**Target Platform:** Flutter Mobile App

For questions or issues, please refer to the API error responses or contact the backend team.

