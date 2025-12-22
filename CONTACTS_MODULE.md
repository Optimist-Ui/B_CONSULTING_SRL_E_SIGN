# Contacts Module - API Documentation

This document describes the complete contacts management system. Contacts are used to manage people who can be assigned as participants (signers, form fillers, approvers) or receivers in document packages.

## Table of Contents
1. [Overview](#overview)
2. [Contact Model](#contact-model)
3. [API Endpoints](#api-endpoints)
4. [Contact Usage in Packages](#contact-usage-in-packages)
5. [Enterprise Inquiry](#enterprise-inquiry)
6. [Search Functionality](#search-functionality)
7. [Important Notes for Flutter Development](#important-notes-for-flutter-development)

---

## Overview

**What are Contacts?**
Contacts are people that authenticated users can add to their personal contact list. These contacts can then be assigned to document packages as:
- **Signers**: People who need to sign the document
- **Form Fillers**: People who need to fill form fields
- **Approvers**: People who need to approve the document
- **Receivers**: People who receive a copy of the completed document (CC recipients)

**Key Features:**
- Each user has their own private contact list
- Contacts are identified by email (unique per user)
- Contacts can have custom fields for additional data
- Contacts can be searched by name or email
- Contacts are referenced by ID when assigning to packages

**Important:**
- All contact endpoints require authentication
- Contacts are user-specific (you can only access your own contacts)
- Email must be unique within a user's contact list

---

## Contact Model

### Contact Schema

```json
{
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
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | String (ObjectId) | Auto | Unique contact identifier |
| `ownerId` | String (ObjectId) | Auto | ID of user who owns this contact |
| `firstName` | String | ✅ Yes | Contact's first name |
| `lastName` | String | ✅ Yes | Contact's last name |
| `email` | String | ✅ Yes | Contact's email (unique per owner) |
| `title` | String | ❌ No | Job title (e.g., "CEO", "Manager") |
| `phone` | String | ❌ No | Phone number |
| `dob` | Date (ISO 8601) | ❌ No | Date of birth |
| `language` | String | ❌ No | Preferred language (default: "en") |
| `customFields` | Object (Map) | ❌ No | Key-value pairs for custom data |
| `createdAt` | Date | Auto | Timestamp when contact was created |
| `updatedAt` | Date | Auto | Timestamp when contact was last updated |

### Validation Rules

**Required Fields:**
- `firstName`: Non-empty string
- `lastName`: Non-empty string
- `email`: Valid email format

**Optional Fields:**
- `title`: String (if provided)
- `phone`: String (if provided)
- `dob`: Valid ISO 8601 date (if provided)
- `language`: String (if provided, default: "en")
- `customFields`: Object with string values (if provided)

**Constraints:**
- Email must be unique within a user's contact list
- Email is automatically converted to lowercase
- Custom field values must be strings

---

## API Endpoints

### Base URL
All contact endpoints are under: `/api/contacts`

**All endpoints require authentication** (except enterprise inquiry)

---

### 1. Create Contact

**POST** `/api/contacts`

**Protected Endpoint** - Requires authentication

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "title": "CEO",
  "phone": "+1234567890",
  "dob": "1990-01-15",
  "language": "en",
  "customFields": {
    "department": "Sales",
    "employeeId": "EMP-12345"
  }
}
```

**Minimal Request (Required Fields Only):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Contact created successfully",
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

**Error Responses:**

**409 Conflict** - Email already exists:
```json
{
  "success": false,
  "message": "Failed to create contact",
  "error": "A contact with this email already exists."
}
```

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "message": "Failed to create contact",
  "error": "First name is required"
}
```

**401 Unauthorized** - Missing/invalid token:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

### 2. Get All Contacts

**GET** `/api/contacts`

**Protected Endpoint** - Requires authentication

**Query Parameters:**
- `search` (optional): Search string to filter by first name, last name, or email

**Headers:**
```
Authorization: Bearer {token}
```

**Examples:**
- Get all contacts: `GET /api/contacts`
- Search contacts: `GET /api/contacts?search=john`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contacts fetched successfully",
  "data": [
    {
      "_id": "contactId123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "title": "CEO",
      "phone": "+1234567890",
      "language": "en",
      "customFields": {},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "contactId456",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "title": "Manager",
      "phone": "+9876543210",
      "language": "en",
      "customFields": {},
      "createdAt": "2024-01-16T11:00:00.000Z",
      "updatedAt": "2024-01-16T11:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Results are sorted by first name, then last name (ascending)
- Search is case-insensitive
- Only returns contacts owned by the authenticated user
- Empty array `[]` if no contacts found

---

### 3. Get Contact by ID

**GET** `/api/contacts/{contactId}`

**Protected Endpoint** - Requires authentication

**URL Parameters:**
- `contactId`: MongoDB ObjectId of the contact

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
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
      "department": "Sales"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**404 Not Found** - Contact not found or not owned by user:
```json
{
  "success": false,
  "message": "Failed to fetch contact",
  "error": "Contact not found or you do not have permission to view it."
}
```

**400 Bad Request** - Invalid contactId format:
```json
{
  "success": false,
  "message": "A valid contact ID is required in the URL parameter."
}
```

---

### 4. Update Contact

**PATCH** `/api/contacts/{contactId}`

**Protected Endpoint** - Requires authentication

**URL Parameters:**
- `contactId`: MongoDB ObjectId of the contact

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (All fields optional):**
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

**Partial Update Example:**
```json
{
  "phone": "+1234567890",
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
    "firstName": "Johnny",
    "lastName": "Doe",
    "email": "johnny.doe@example.com",
    "title": "CTO",
    "phone": "+1234567890",
    "language": "es",
    "customFields": {
      "department": "Engineering"
    },
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

**Error Responses:**

**409 Conflict** - Email already used by another contact:
```json
{
  "success": false,
  "message": "Failed to update contact",
  "error": "This email is already used by another contact."
}
```

**404 Not Found** - Contact not found:
```json
{
  "success": false,
  "message": "Failed to update contact",
  "error": "Contact not found or you do not have permission to edit it."
}
```

---

### 5. Delete Contact

**DELETE** `/api/contacts/{contactId}`

**Protected Endpoint** - Requires authentication

**URL Parameters:**
- `contactId`: MongoDB ObjectId of the contact

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact deleted successfully.",
  "data": {
    "message": "Contact deleted successfully."
  }
}
```

**Error Responses:**

**404 Not Found** - Contact not found:
```json
{
  "success": false,
  "message": "Failed to delete contact",
  "error": "Contact not found or you do not have permission to delete it."
}
```

**Note:**
- Deletion is permanent
- Contact is removed from user's list
- If contact is assigned to packages, verify package behavior

---

## Contact Usage in Packages

### How Contacts Are Used

Contacts are referenced when creating or updating document packages. When assigning participants or receivers to a package:

1. **Select Contact**: User chooses a contact from their contact list
2. **Assign Role**: Contact is assigned a role (Signer, FormFiller, Approver, or Receiver)
3. **Package Reference**: Contact ID is stored in the package
4. **Contact Information**: Contact name and email are copied to package for notifications

### Contact Assignment Process

**When creating/updating a package:**
```json
{
  "fields": [
    {
      "id": "field1",
      "assignedUsers": [
        {
          "contactId": "contactId123",
          "contactName": "John Doe",
          "contactEmail": "john.doe@example.com",
          "role": "Signer",
          "signatureMethods": ["Email OTP"]
        }
      ]
    }
  ],
  "receivers": [
    {
      "contactId": "contactId456",
      "contactName": "Jane Smith",
      "contactEmail": "jane.smith@example.com"
    }
  ]
}
```

**Important Notes:**
- Contact ID must exist and be owned by the package creator
- Contact information (name, email) is copied at assignment time
- Changes to contact after assignment don't affect existing packages
- Phone number is fetched from contact for SMS OTP functionality

### Validation During Package Creation

The system validates that:
1. All contact IDs exist
2. All contact IDs belong to the package creator
3. Required fields are present for each role

**Example Error:**
```json
{
  "success": false,
  "error": "One or more contact IDs are invalid or not owned by the user."
}
```

---

## Enterprise Inquiry

### Submit Enterprise Inquiry

**POST** `/api/contacts/enterprise-inquiry`

**Public Endpoint** - No authentication required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "company": "Acme Corporation",
  "phone": "+1 (123) 456-7890",
  "message": "We need custom enterprise features for our team..."
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `company`: Required, 2-200 characters
- `phone`: Optional, valid phone format
- `message`: Required, 10-2000 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your inquiry has been sent successfully",
  "data": {
    "success": true,
    "message": "Enterprise inquiry submitted successfully"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to submit inquiry",
  "error": "Name must be between 2 and 100 characters"
}
```

**Use Case:**
This endpoint allows public users (non-authenticated) to submit enterprise inquiry forms. The inquiry is sent via email to administrators.

---

## Search Functionality

### Search Implementation

**Endpoint:** `GET /api/contacts?search={query}`

**Search Behavior:**
- Searches across: `firstName`, `lastName`, and `email`
- Case-insensitive matching
- Partial matching (substring search)
- Returns all matching contacts

**Search Examples:**

1. **Search by first name:**
   ```
   GET /api/contacts?search=john
   ```
   Returns contacts with "john" in firstName, lastName, or email

2. **Search by last name:**
   ```
   GET /api/contacts?search=doe
   ```
   Returns contacts with "doe" in firstName, lastName, or email

3. **Search by email:**
   ```
   GET /api/contacts?search=example.com
   ```
   Returns contacts with "example.com" in email

4. **Multiple word search:**
   ```
   GET /api/contacts?search=john doe
   ```
   Searches for contacts matching "john doe" in any field

**Results:**
- Always sorted by firstName, then lastName (ascending)
- Only returns contacts owned by authenticated user
- Empty array if no matches

---

## Important Notes for Flutter Development

### 1. Authentication Requirement

**All endpoints require authentication** (except enterprise inquiry):
```dart
headers['Authorization'] = 'Bearer $token';
```

### 2. Contact Management Flow

**Creating a Contact:**
1. Collect required fields: `firstName`, `lastName`, `email`
2. Optionally collect: `title`, `phone`, `dob`, `language`, `customFields`
3. Validate email format and required fields
4. Call `POST /api/contacts`
5. Handle duplicate email error (409)
6. Update local state/list

**Updating a Contact:**
1. Allow partial updates (only send changed fields)
2. Validate email uniqueness if updating email
3. Call `PATCH /api/contacts/{contactId}`
4. Handle errors gracefully

### 3. Contact Selection in Packages

**When creating/updating packages:**
1. Fetch user's contacts: `GET /api/contacts`
2. Display contacts in a selectable list
3. Allow search: `GET /api/contacts?search={query}`
4. User selects contacts
5. Assign roles to selected contacts
6. Include contact IDs in package creation payload

**Example Contact Selection:**
```dart
// Fetch contacts
final contacts = await getContacts();

// Display in dropdown/multi-select
// User selects contact with ID: "contactId123"

// Include in package payload
packagePayload['fields'][0]['assignedUsers'] = [
  {
    'contactId': 'contactId123',
    'role': 'Signer',
    'signatureMethods': ['Email OTP']
  }
];
```

### 4. Search Implementation

**Client-Side Search:**
- Option 1: Fetch all contacts, filter locally
- Option 2: Use API search parameter (recommended for large lists)

**API Search (Recommended):**
```dart
Future<List<Contact>> searchContacts(String query) async {
  final response = await dio.get(
    '/api/contacts',
    queryParameters: {'search': query},
  );
  return parseContacts(response.data);
}
```

**Real-time Search:**
- Implement debouncing (wait 300-500ms after user stops typing)
- Clear search shows all contacts
- Empty state when no results

### 5. Custom Fields Handling

**Display Custom Fields:**
```dart
// Contact has customFields
final customFields = contact.customFields as Map<String, dynamic>?;

if (customFields != null) {
  customFields.forEach((key, value) {
    // Display key-value pair
    print('$key: $value');
  });
}
```

**Creating Contact with Custom Fields:**
```dart
final contactData = {
  'firstName': 'John',
  'lastName': 'Doe',
  'email': 'john@example.com',
  'customFields': {
    'department': 'Sales',
    'employeeId': 'EMP-123',
  },
};
```

### 6. Error Handling

**Common Errors:**

**409 Conflict - Duplicate Email:**
```dart
if (error.statusCode == 409) {
  // Show message: "A contact with this email already exists."
  // Optionally: Offer to update existing contact
}
```

**404 Not Found:**
```dart
if (error.statusCode == 404) {
  // Contact doesn't exist or user doesn't have access
  // Refresh contact list or show error
}
```

**400 Bad Request - Validation:**
```dart
if (error.statusCode == 400) {
  // Show validation error message
  // Highlight invalid fields in form
}
```

### 7. Contact List UI

**Recommended Features:**
- ✅ List view with search bar
- ✅ Add contact button
- ✅ Edit/delete actions per contact
- ✅ Filter/search functionality
- ✅ Empty state when no contacts
- ✅ Loading states during API calls
- ✅ Pull-to-refresh functionality

**Contact Item Display:**
- Full name (firstName + lastName)
- Email
- Phone (if available)
- Title (if available)
- Actions: Edit, Delete

### 8. State Management

**Recommended State:**
```dart
class ContactsState {
  final List<Contact> contacts;
  final bool isLoading;
  final String? error;
  final String searchQuery;
  final Contact? selectedContact;
}
```

**Actions:**
- `fetchContacts(searchQuery)`
- `createContact(contactData)`
- `updateContact(contactId, contactData)`
- `deleteContact(contactId)`
- `searchContacts(query)`
- `clearSearch()`

### 9. Phone Number Formatting

**Recommendations:**
- Use phone input widget with country code support
- Store phone numbers with international format: `+1234567890`
- Display formatted for user's locale
- Validate format before sending

**Example:**
```dart
// Use phone_number package
final phoneNumber = PhoneNumber.parse('+1234567890');
final formatted = phoneNumber.format('INTERNATIONAL');
```

### 10. Date of Birth Handling

**Format:**
- Send as ISO 8601 date string: `"1990-01-15"`
- Or full ISO string: `"1990-01-15T00:00:00.000Z"`

**UI:**
- Use date picker widget
- Format display according to user's locale
- Validate age if required by business logic

### 11. Language Selection

**Supported Languages:**
- Store language code (e.g., "en", "es", "fr", "de")
- Default: "en"
- Use for localization in email templates/notifications

**UI:**
- Dropdown/selector with language names
- Common options: English, Spanish, French, German, etc.

### 12. Validation

**Client-Side Validation (Before API Call):**
```dart
bool isValidContact(Map<String, dynamic> contactData) {
  // Required fields
  if (contactData['firstName']?.isEmpty ?? true) return false;
  if (contactData['lastName']?.isEmpty ?? true) return false;
  if (!isValidEmail(contactData['email'] ?? '')) return false;
  
  // Optional but validate if provided
  if (contactData['email'] != null && !isValidEmail(contactData['email'])) {
    return false;
  }
  
  return true;
}

bool isValidEmail(String email) {
  return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
}
```

### 13. Testing Checklist

- [ ] Create contact with required fields
- [ ] Create contact with all fields
- [ ] Create contact with duplicate email (should fail)
- [ ] Get all contacts
- [ ] Search contacts by first name
- [ ] Search contacts by last name
- [ ] Search contacts by email
- [ ] Get contact by ID
- [ ] Update contact partially
- [ ] Update contact email to existing (should fail)
- [ ] Delete contact
- [ ] Delete non-existent contact (should fail)
- [ ] Access another user's contact (should fail)
- [ ] Handle network errors gracefully
- [ ] Handle token expiration
- [ ] Submit enterprise inquiry
- [ ] Validate enterprise inquiry fields

### 14. Performance Considerations

**Optimization Tips:**
1. **Cache contacts locally** after fetching
2. **Use pagination** if contact list is large (not implemented yet)
3. **Debounce search** to reduce API calls
4. **Load contacts lazily** when needed (e.g., when opening package creation)
5. **Use search API** instead of filtering all contacts locally

### 15. Contact Deletion Impact

**Before Deleting:**
- Check if contact is used in active packages
- Warn user if contact is assigned to packages
- Consider soft delete or marking as inactive

**Current Behavior:**
- Hard delete (contact removed immediately)
- Packages retain contact information (names/emails copied)
- Contact ID references in packages become orphaned

---

## Summary

### Contact Lifecycle

1. **Create** → User adds contact to their list
2. **Manage** → User can view, update, search contacts
3. **Assign** → User selects contacts when creating packages
4. **Use** → Contacts become participants/receivers in packages
5. **Delete** → User removes contact from list (if needed)

### Key Points

- ✅ Contacts are **user-specific** (private to each user)
- ✅ Email must be **unique per user**
- ✅ Contacts are **required** for package participant assignment
- ✅ All endpoints require **authentication**
- ✅ **Search** is case-insensitive across name and email
- ✅ **Custom fields** allow extensibility
- ✅ Contact information is **copied** to packages at assignment time

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation message",
  "data": { /* contact or array of contacts */ }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Operation message",
  "error": "Specific error details"
}
```

---

## Support

For questions or issues:
1. Check API response `error` field for specific error
2. Verify authentication token is valid
3. Confirm contact ID belongs to authenticated user
4. Validate email format before sending
5. Check for duplicate emails within user's contact list
6. Verify contact ID exists before using in packages

