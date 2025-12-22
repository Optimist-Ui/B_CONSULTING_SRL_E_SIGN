# Flutter Contact Update Guide

Complete documentation for implementing contact update functionality in Flutter. This guide covers all features used in the web application.

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**For:** Flutter App Development

## Table of Contents

1. [Overview](#overview)
2. [Update Contact Flow](#update-contact-flow)
3. [API Endpoint](#api-endpoint)
4. [Data Models](#data-models)
5. [Complete Implementation Flow](#complete-implementation-flow)
6. [Field Validation](#field-validation)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Overview

The contact update system allows users to:
1. **Update Contact Information**: Modify any contact field (name, email, phone, etc.)
2. **Partial Updates**: Update only specific fields without affecting others
3. **Email Uniqueness**: Ensure email remains unique within user's contact list
4. **Custom Fields**: Add, update, or remove custom fields

### Key Concepts

- **Contact Update**: Modifies existing contact information
- **Partial Update**: Only changed fields need to be sent
- **Email Uniqueness**: Email must be unique per user (cannot duplicate)
- **Custom Fields**: Key-value pairs for additional contact data

### Important Notes

- **All fields are optional** in update request (partial updates supported)
- **Email uniqueness** is validated if email is being changed
- **Contact must belong to user** (cannot update other users' contacts)
- **Custom fields** can be added, modified, or removed

---

## Update Contact Flow

### Step 1: Get Contact to Update

Before updating, fetch the current contact data to populate the form.

**API Endpoint:**
```
GET /api/contacts/{contactId}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact fetched successfully",
  "data": {
    "_id": "contactId123",
    "ownerId": "userId123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "title": "CEO",
    "phone": "+1234567890",
    "dob": "1990-01-15T00:00:00.000Z",
    "language": "en",
    "customFields": {
      "department": "Sales",
      "employeeId": "EMP-12345"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Implementation:**
```dart
Future<Contact> getContactById(String contactId) async {
  final response = await api.get(
    '/api/contacts/$contactId',
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  return Contact.fromJson(response.data['data']);
}
```

---

### Step 2: Update Contact

**API Endpoint:**
```
PATCH /api/contacts/{contactId}
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (All fields optional - partial update):**
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "email": "johnny.doe@example.com",
  "title": "CTO",
  "phone": "+1234567890",
  "dob": "1990-01-15",
  "language": "es",
  "customFields": {
    "department": "Engineering",
    "employeeId": "EMP-12345"
  }
}
```

**Partial Update Example (Only phone and title):**
```json
{
  "phone": "+9876543210",
  "title": "VP of Sales"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact updated successfully",
  "data": {
    "_id": "contactId123",
    "ownerId": "userId123",
    "firstName": "Johnny",
    "lastName": "Doe",
    "email": "johnny.doe@example.com",
    "title": "CTO",
    "phone": "+1234567890",
    "dob": "1990-01-15T00:00:00.000Z",
    "language": "es",
    "customFields": {
      "department": "Engineering",
      "employeeId": "EMP-12345"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

**Implementation:**
```dart
Future<Contact> updateContact({
  required String contactId,
  String? firstName,
  String? lastName,
  String? email,
  String? title,
  String? phone,
  DateTime? dob,
  String? language,
  Map<String, String>? customFields,
}) async {
  // Build update payload (only include non-null fields)
  final payload = <String, dynamic>{};
  
  if (firstName != null) payload['firstName'] = firstName;
  if (lastName != null) payload['lastName'] = lastName;
  if (email != null) payload['email'] = email;
  if (title != null) payload['title'] = title;
  if (phone != null) payload['phone'] = phone;
  if (dob != null) payload['dob'] = dob.toIso8601String().split('T')[0]; // Date only
  if (language != null) payload['language'] = language;
  if (customFields != null) payload['customFields'] = customFields;

  final response = await api.patch(
    '/api/contacts/$contactId',
    payload,
    options: Options(
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ),
  );

  return Contact.fromJson(response.data['data']);
}
```

---

## API Endpoint

### Update Contact

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| PATCH | `/api/contacts/{contactId}` | Update contact | Yes |

### Request/Response Format

**Update Contact:**
```
PATCH /api/contacts/{contactId}
Authorization: Bearer {token}
Content-Type: application/json

Request Body (all fields optional):
{
  "firstName": string (optional),
  "lastName": string (optional),
  "email": string (optional),
  "title": string (optional),
  "phone": string (optional),
  "dob": string (optional, ISO 8601 date),
  "language": string (optional),
  "customFields": object (optional, key-value pairs with string values)
}
```

---

## Data Models

### Contact Model

```dart
class Contact {
  final String id; // MongoDB ObjectId
  final String ownerId; // User ID who owns this contact
  final String firstName; // Required
  final String lastName; // Required
  final String email; // Required, unique per user
  final String? title; // Optional (e.g., "CEO", "Manager")
  final String? phone; // Optional
  final DateTime? dob; // Optional, date of birth
  final String? language; // Optional, default: "en"
  final Map<String, String>? customFields; // Optional, key-value pairs
  final DateTime createdAt;
  final DateTime updatedAt;

  Contact({
    required this.id,
    required this.ownerId,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.title,
    this.phone,
    this.dob,
    this.language,
    this.customFields,
    required this.createdAt,
    required this.updatedAt,
  });

  Contact copyWith({
    String? id,
    String? ownerId,
    String? firstName,
    String? lastName,
    String? email,
    String? title,
    String? phone,
    DateTime? dob,
    String? language,
    Map<String, String>? customFields,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Contact(
      id: id ?? this.id,
      ownerId: ownerId ?? this.ownerId,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      title: title ?? this.title,
      phone: phone ?? this.phone,
      dob: dob ?? this.dob,
      language: language ?? this.language,
      customFields: customFields ?? this.customFields,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'ownerId': ownerId,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      if (title != null) 'title': title,
      if (phone != null) 'phone': phone,
      if (dob != null) 'dob': dob!.toIso8601String().split('T')[0],
      if (language != null) 'language': language,
      if (customFields != null) 'customFields': customFields,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      id: json['_id'] ?? json['id'],
      ownerId: json['ownerId'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      title: json['title'],
      phone: json['phone'],
      dob: json['dob'] != null ? DateTime.parse(json['dob']) : null,
      language: json['language'] ?? 'en',
      customFields: json['customFields'] != null
          ? Map<String, String>.from(json['customFields'])
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}
```

### Update Contact Request Model

```dart
class UpdateContactRequest {
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? title;
  final String? phone;
  final DateTime? dob;
  final String? language;
  final Map<String, String>? customFields;

  UpdateContactRequest({
    this.firstName,
    this.lastName,
    this.email,
    this.title,
    this.phone,
    this.dob,
    this.language,
    this.customFields,
  });

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    
    if (firstName != null) json['firstName'] = firstName;
    if (lastName != null) json['lastName'] = lastName;
    if (email != null) json['email'] = email;
    if (title != null) json['title'] = title;
    if (phone != null) json['phone'] = phone;
    if (dob != null) {
      // Format as date only (YYYY-MM-DD)
      json['dob'] = dob!.toIso8601String().split('T')[0];
    }
    if (language != null) json['language'] = language;
    if (customFields != null) json['customFields'] = customFields;
    
    return json;
  }
}
```

---

## Complete Implementation Flow

### Scenario 1: Update Contact (Full Form)

```
1. User opens contact list
   ↓
2. User selects contact to edit
   ↓
3. Fetch contact: GET /api/contacts/{contactId}
   ↓
4. Display edit form with current values:
   - First Name: contact.firstName
   - Last Name: contact.lastName
   - Email: contact.email
   - Phone: contact.phone
   - Title: contact.title
   - Language: contact.language
   - Custom Fields: contact.customFields
   ↓
5. User edits fields
   ↓
6. User clicks "Save"
   ↓
7. Validate form:
   - First name (if provided): non-empty
   - Last name (if provided): non-empty
   - Email (if provided): valid format
   - Phone (if provided): valid format
   ↓
8. Update contact: PATCH /api/contacts/{contactId}
   - Include all changed fields
   ↓
9. Show success message
   ↓
10. Update local state with new contact data
    ↓
11. Refresh contact list
```

### Scenario 2: Quick Update (Single Field)

```
1. User views contact details
   ↓
2. User clicks "Edit Phone" (quick action)
   ↓
3. Show phone input dialog
   ↓
4. User enters new phone number
   ↓
5. Update contact: PATCH /api/contacts/{contactId}
   - Only include phone field
   {
     "phone": "+9876543210"
   }
   ↓
6. Show success message
   ↓
7. Update contact in local state
```

### Scenario 3: Update Email

```
1. User opens contact edit form
   ↓
2. User changes email address
   ↓
3. Validate email format
   ↓
4. Update contact: PATCH /api/contacts/{contactId}
   {
     "email": "newemail@example.com"
   }
   ↓
5. Server validates:
   - Email format
   - Email uniqueness (not used by another contact)
   ↓
6. If email already exists:
   - Return 409 Conflict error
   - Show error: "This email is already used by another contact."
   ↓
7. If email is unique:
   - Update contact
   - Show success message
```

---

## Field Validation

### Client-Side Validation

**Required Field Validation (if provided):**
```dart
String? validateFirstName(String? value) {
  if (value != null && value.trim().isEmpty) {
    return 'First name cannot be empty';
  }
  return null;
}

String? validateLastName(String? value) {
  if (value != null && value.trim().isEmpty) {
    return 'Last name cannot be empty';
  }
  return null;
}

String? validateEmail(String? value) {
  if (value != null && value.isNotEmpty) {
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please provide a valid email address';
    }
  }
  return null;
}

String? validatePhone(String? value) {
  if (value != null && value.isNotEmpty) {
    // Use phone validation library
    if (!isValidPhoneNumber(value)) {
      return 'Please provide a valid phone number';
    }
  }
  return null;
}
```

### Server-Side Validation

The server validates:
- **firstName**: Cannot be empty if provided
- **lastName**: Cannot be empty if provided
- **email**: Must be valid email format if provided
- **phone**: Must be string if provided
- **dob**: Must be valid ISO 8601 date if provided
- **language**: Must be string if provided
- **customFields**: Must be object with string values if provided

---

## Error Handling

### Common Errors

#### 1. Email Already Exists (409 Conflict)
```json
{
  "success": false,
  "message": "Failed to update contact",
  "error": "This email is already used by another contact."
}
```
**Handling:** 
- Show error message to user
- Optionally: Offer to view the existing contact with that email
- Prevent form submission until email is changed

**Implementation:**
```dart
Future<void> updateContact(UpdateContactRequest request) async {
  try {
    final contact = await contactService.updateContact(
      contactId: contactId,
      request: request,
    );
    showSuccess('Contact updated successfully');
    updateLocalContact(contact);
  } on DioException catch (e) {
    if (e.response?.statusCode == 409) {
      showError('This email is already used by another contact.');
    } else if (e.response?.statusCode == 404) {
      showError('Contact not found or you do not have permission to edit it.');
    } else {
      showError(e.response?.data['error'] ?? 'Failed to update contact');
    }
  }
}
```

#### 2. Contact Not Found (404)
```json
{
  "success": false,
  "message": "Failed to update contact",
  "error": "Contact not found or you do not have permission to edit it."
}
```
**Handling:** 
- Show error message
- Refresh contact list
- Navigate back to contact list

#### 3. Validation Error (400)
```json
{
  "success": false,
  "message": "Failed to update contact",
  "error": "First name cannot be empty"
}
```
**Handling:** 
- Show validation error message
- Highlight invalid field in form
- Prevent form submission

#### 4. Unauthorized (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```
**Handling:** 
- Redirect to login
- Refresh authentication token
- Retry request

### Error Handling Best Practices

```dart
Future<Contact> updateContact({
  required String contactId,
  required UpdateContactRequest request,
}) async {
  try {
    // Client-side validation
    if (request.firstName != null && request.firstName!.trim().isEmpty) {
      throw Exception('First name cannot be empty');
    }
    if (request.lastName != null && request.lastName!.trim().isEmpty) {
      throw Exception('Last name cannot be empty');
    }
    if (request.email != null && !isValidEmail(request.email!)) {
      throw Exception('Please provide a valid email address');
    }

    // Build payload (only non-null fields)
    final payload = request.toJson();
    
    // Make API call
    final response = await api.patch(
      '/api/contacts/$contactId',
      payload,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ),
    );

    return Contact.fromJson(response.data['data']);
  } on DioException catch (e) {
    if (e.response != null) {
      final error = e.response!.data['error'];
      throw Exception(error ?? 'Failed to update contact');
    } else {
      throw Exception('Network error. Please check your connection.');
    }
  }
}
```

---

## Best Practices

### 1. Partial Updates

**Only send changed fields:**
```dart
// ✅ CORRECT - Only send changed fields
final updateRequest = UpdateContactRequest(
  phone: newPhone, // Only phone changed
);

// ❌ WRONG - Sending all fields unnecessarily
final updateRequest = UpdateContactRequest(
  firstName: contact.firstName, // Unchanged
  lastName: contact.lastName, // Unchanged
  email: contact.email, // Unchanged
  phone: newPhone, // Only this changed
);
```

### 2. Email Uniqueness Check

**Check before updating email:**
```dart
Future<bool> isEmailAvailable(String email, String currentContactId) async {
  try {
    final contacts = await fetchContacts();
    final existingContact = contacts.firstWhere(
      (c) => c.email.toLowerCase() == email.toLowerCase(),
      orElse: () => Contact(/* dummy */),
    );
    
    // Email is available if:
    // 1. No contact found with this email, OR
    // 2. The contact with this email is the current contact being edited
    return existingContact.id == null || existingContact.id == currentContactId;
  } catch (e) {
    return true; // Assume available if check fails
  }
}
```

### 3. Form State Management

**Track changed fields:**
```dart
class ContactEditFormState {
  final Contact originalContact;
  final Map<String, dynamic> changes = {};

  ContactEditFormState(this.originalContact);

  void updateField(String field, dynamic value) {
    if (value != originalContact.getField(field)) {
      changes[field] = value;
    } else {
      changes.remove(field);
    }
  }

  bool get hasChanges => changes.isNotEmpty;

  UpdateContactRequest toUpdateRequest() {
    return UpdateContactRequest(
      firstName: changes['firstName'] as String?,
      lastName: changes['lastName'] as String?,
      email: changes['email'] as String?,
      phone: changes['phone'] as String?,
      title: changes['title'] as String?,
      language: changes['language'] as String?,
      customFields: changes['customFields'] as Map<String, String>?,
    );
  }
}
```

### 4. Custom Fields Handling

**Update Custom Fields:**
```dart
void updateCustomField(String key, String value) {
  final currentFields = contact.customFields ?? {};
  final updatedFields = Map<String, String>.from(currentFields);
  
  if (value.isEmpty) {
    // Remove field if value is empty
    updatedFields.remove(key);
  } else {
    // Add or update field
    updatedFields[key] = value;
  }
  
  // Update contact
  updateContact(
    contactId: contact.id,
    request: UpdateContactRequest(
      customFields: updatedFields.isEmpty ? null : updatedFields,
    ),
  );
}
```

### 5. Date of Birth Handling

**Format Date for API:**
```dart
String formatDateForApi(DateTime date) {
  // Format as YYYY-MM-DD (date only, no time)
  return date.toIso8601String().split('T')[0];
}

DateTime? parseDateFromApi(String? dateString) {
  if (dateString == null) return null;
  try {
    // Parse ISO 8601 date string
    return DateTime.parse(dateString);
  } catch (e) {
    return null;
  }
}
```

### 6. State Management

**Recommended:** Use state management (Provider, Riverpod, Bloc, etc.)

```dart
class ContactProvider extends ChangeNotifier {
  Contact? _contact;
  bool _loading = false;
  String? _error;

  Contact? get contact => _contact;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> loadContact(String contactId) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _contact = await contactService.getContactById(contactId);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> updateContact({
    required String contactId,
    required UpdateContactRequest request,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _contact = await contactService.updateContact(
        contactId: contactId,
        request: request,
      );
      _error = null;
      showSuccess('Contact updated successfully');
    } catch (e) {
      _error = e.toString();
      showError(_error!);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
```

### 7. Optimistic Updates

**Update UI immediately, rollback on error:**
```dart
Future<void> updateContactOptimistic({
  required String contactId,
  required UpdateContactRequest request,
}) async {
  // Store original contact for rollback
  final originalContact = currentContact;
  
  // Optimistically update UI
  setContact(contact.copyWith(
    firstName: request.firstName ?? contact.firstName,
    lastName: request.lastName ?? contact.lastName,
    email: request.email ?? contact.email,
    phone: request.phone ?? contact.phone,
    title: request.title ?? contact.title,
    language: request.language ?? contact.language,
    customFields: request.customFields ?? contact.customFields,
  ));

  try {
    // Make API call
    final updated = await contactService.updateContact(
      contactId: contactId,
      request: request,
    );
    
    // Update with server response
    setContact(updated);
    showSuccess('Contact updated successfully');
  } catch (e) {
    // Rollback on error
    setContact(originalContact);
    showError('Failed to update contact: ${e.toString()}');
  }
}
```

### 8. Debouncing for Real-time Validation

**Debounce email uniqueness check:**
```dart
Timer? _emailCheckTimer;

void checkEmailUniqueness(String email, String contactId) {
  _emailCheckTimer?.cancel();
  
  _emailCheckTimer = Timer(Duration(milliseconds: 500), () async {
    if (email.isEmpty) return;
    
    final isAvailable = await isEmailAvailable(email, contactId);
    setEmailValidationState(isAvailable);
  });
}
```

---

## Complete Implementation Example

### Full Contact Update Flow

```dart
class ContactUpdateScreen extends StatefulWidget {
  final String contactId;

  const ContactUpdateScreen({required this.contactId});

  @override
  _ContactUpdateScreenState createState() => _ContactUpdateScreenState();
}

class _ContactUpdateScreenState extends State<ContactUpdateScreen> {
  final _formKey = GlobalKey<FormState>();
  late Contact _contact;
  bool _loading = false;
  bool _hasChanges = false;

  // Form controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _titleController = TextEditingController();
  String? _selectedLanguage;
  Map<String, String> _customFields = {};

  @override
  void initState() {
    super.initState();
    _loadContact();
  }

  Future<void> _loadContact() async {
    setState(() => _loading = true);
    try {
      _contact = await contactService.getContactById(widget.contactId);
      _populateForm();
    } catch (e) {
      showError('Failed to load contact: ${e.toString()}');
      Navigator.pop(context);
    } finally {
      setState(() => _loading = false);
    }
  }

  void _populateForm() {
    _firstNameController.text = _contact.firstName;
    _lastNameController.text = _contact.lastName;
    _emailController.text = _contact.email;
    _phoneController.text = _contact.phone ?? '';
    _titleController.text = _contact.title ?? '';
    _selectedLanguage = _contact.language ?? 'en';
    _customFields = Map<String, String>.from(_contact.customFields ?? {});
  }

  Future<void> _handleUpdate() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _loading = true);

    try {
      // Build update request with changed fields only
      final request = UpdateContactRequest(
        firstName: _firstNameController.text != _contact.firstName
            ? _firstNameController.text
            : null,
        lastName: _lastNameController.text != _contact.lastName
            ? _lastNameController.text
            : null,
        email: _emailController.text != _contact.email
            ? _emailController.text
            : null,
        phone: _phoneController.text != (_contact.phone ?? '')
            ? _phoneController.text
            : null,
        title: _titleController.text != (_contact.title ?? '')
            ? _titleController.text
            : null,
        language: _selectedLanguage != _contact.language
            ? _selectedLanguage
            : null,
        customFields: _hasCustomFieldsChanged()
            ? _customFields.isEmpty ? {} : _customFields
            : null,
      );

      final updated = await contactService.updateContact(
        contactId: widget.contactId,
        request: request,
      );

      showSuccess('Contact updated successfully');
      Navigator.pop(context, updated);
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        showError('This email is already used by another contact.');
      } else if (e.response?.statusCode == 404) {
        showError('Contact not found.');
      } else {
        showError(e.response?.data['error'] ?? 'Failed to update contact');
      }
    } catch (e) {
      showError('Failed to update contact: ${e.toString()}');
    } finally {
      setState(() => _loading = false);
    }
  }

  bool _hasCustomFieldsChanged() {
    final original = _contact.customFields ?? {};
    if (_customFields.length != original.length) return true;
    for (final key in _customFields.keys) {
      if (_customFields[key] != original[key]) return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _contact.id.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text('Edit Contact')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Edit Contact'),
        actions: [
          TextButton(
            onPressed: _loading ? null : _handleUpdate,
            child: Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _firstNameController,
              decoration: InputDecoration(labelText: 'First Name'),
              validator: (value) => value?.isEmpty ?? true
                  ? 'First name is required'
                  : null,
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _lastNameController,
              decoration: InputDecoration(labelText: 'Last Name'),
              validator: (value) => value?.isEmpty ?? true
                  ? 'Last name is required'
                  : null,
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value?.isEmpty ?? true) return 'Email is required';
                if (!isValidEmail(value!)) return 'Invalid email format';
                return null;
              },
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(labelText: 'Phone'),
              keyboardType: TextInputType.phone,
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(labelText: 'Title'),
            ),
            // Add more fields...
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _titleController.dispose();
    super.dispose();
  }
}
```

---

## Summary

### Key Takeaways

1. **Partial Updates:**
   - Only send changed fields in update request
   - All fields are optional in PATCH request
   - Server validates only provided fields

2. **Email Uniqueness:**
   - Email must be unique within user's contact list
   - Server validates if email is being changed
   - Returns 409 Conflict if email already exists

3. **Contact Ownership:**
   - User can only update their own contacts
   - Server validates ownership
   - Returns 404 if contact not found or not owned

4. **Custom Fields:**
   - Can be added, modified, or removed
   - Must be key-value pairs with string values
   - Send empty object `{}` to clear all custom fields

5. **Important Notes:**
   - ✅ All fields are optional in update request
   - ✅ Email is automatically converted to lowercase
   - ✅ Date of birth should be sent as date only (YYYY-MM-DD)
   - ✅ Custom fields values must be strings

### Implementation Checklist

- [ ] Implement get contact by ID
- [ ] Implement update contact endpoint
- [ ] Add form validation
- [ ] Handle email uniqueness check
- [ ] Implement partial updates (only changed fields)
- [ ] Handle custom fields update
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Implement state management
- [ ] Add success/error messages
- [ ] Refresh contact list after update

---

## Support

For questions or issues:
1. Check API responses for error messages
2. Verify contact ID belongs to authenticated user
3. Ensure email is unique if updating email
4. Validate all fields before sending
5. Check authentication token is valid

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**For:** Flutter App Development

