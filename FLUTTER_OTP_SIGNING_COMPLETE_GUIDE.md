# Flutter App - OTP Document Signing Complete Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Complete guide for implementing OTP-based document signing with reassignment functionality in Flutter mobile applications

---

## Table of Contents

1. [Overview](#overview)
2. [Document Signing with OTP](#document-signing-with-otp)
3. [OTP Verification Flow](#otp-verification-flow)
4. [Email OTP Signing](#email-otp-signing)
5. [SMS OTP Signing](#sms-otp-signing)
6. [Document Reassignment](#document-reassignment)
7. [Complete Implementation Example](#complete-implementation-example)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## Overview

This guide covers the complete OTP-based document signing flow in Flutter mobile applications, including:

- **OTP Signing**: Sign documents using Email OTP or SMS OTP verification
- **Reassignment**: Transfer document signing responsibilities to another contact
- **Field Management**: Handle text, checkbox, and signature fields
- **Status Management**: Track document completion and status updates

### Key Concepts

- **OTP (One-Time Password)**: 6-digit numeric code used for secure verification
- **Signature Method**: Either "Email OTP" or "SMS OTP" based on participant configuration
- **Reassignment**: Process of transferring all assigned fields from one participant to another
- **Participant ID**: Unique identifier for each participant's assignment to a package
- **Field Assignment**: Fields can be assigned to specific participants for signing

---

## Document Signing with OTP

### Overview

The OTP signing process allows participants to sign documents securely by verifying their identity through a one-time password sent to their email or phone. When a participant verifies an OTP for one signature field, **ALL signature fields** assigned to that participant are automatically signed.

### Prerequisites

1. Participant must have agreed to Terms of Use (`hasAgreedToTerms: true`)
2. Document must be in "Sent" status
3. Participant must have at least one signature field assigned
4. Signature method must be available (Email OTP or SMS OTP)

### Signature Flow Steps

1. **Load Package Data**: Fetch document and field information
2. **Select Signature Field**: User taps on a signature field
3. **Check Terms Agreement**: Verify user has agreed to terms
4. **Choose Signing Method**: Select Email OTP or SMS OTP (if both available)
5. **Enter Identity**: Provide email or phone number
6. **Request OTP**: System sends OTP to provided contact
7. **Enter OTP Code**: User enters 6-digit OTP
8. **Verify OTP**: System validates and applies signature to ALL fields
9. **Update UI**: Reflect signed status on all signature fields

---

## OTP Verification Flow

### OTP Details

- **Format**: 6-digit numeric code (100000-999999)
- **Expiration**: 60 seconds from generation
- **Max Attempts**: 4 incorrect attempts allowed
- **After Max Attempts**: OTP is deleted, user must request new one
- **One Active OTP**: Requesting a new OTP deletes the previous one

### OTP Lifecycle

1. **Request OTP**: Participant requests OTP via email or SMS
2. **Generation**: System generates random 6-digit code
3. **Storage**: OTP stored with expiration timestamp
4. **Delivery**: OTP sent via email or SMS
5. **Verification**: User enters code, system validates
6. **Application**: Signature applied to ALL signature fields
7. **Cleanup**: OTP deleted after successful verification or expiration

---

## Email OTP Signing

### API Endpoints

#### 1. Send Email OTP

**POST** `/api/packages/participant/{packageId}/{participantId}/send-otp`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "email": "john@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP sent to your email.",
  "data": {
    "message": "OTP sent to your email."
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message here",
  "statusCode": 400
}
```

#### 2. Verify Email OTP

**POST** `/api/packages/participant/{packageId}/{participantId}/verify-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "otp": "123456"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Signature completed for 2 field(s).",
  "data": {
    "message": "Signature completed for 2 field(s).",
    "package": {
      "_id": "packageId123",
      "name": "Contract Agreement",
      "status": "Sent",
      "fields": [
        {
          "id": "fieldId1",
          "type": "signature",
          "value": {
            "signedBy": "John Doe",
            "email": "john@example.com",
            "date": "2024-01-15T10:30:00.000Z",
            "method": "Email OTP",
            "ip": "192.168.1.1",
            "otpCode": "123456"
          }
        }
      ]
    },
    "fieldsSignedCount": 2
  }
}
```

### Validation Rules

1. **Email Match**: Email must match `currentUser.contactEmail`
2. **Field Type**: Field must be of type "signature"
3. **Signature Method**: Participant must have "Email OTP" in `signatureMethods`
4. **Not Signed**: Field must not already be signed
5. **Package Status**: Package must be in "Sent" status
6. **Terms Agreement**: User must have agreed to terms

### Flutter Implementation

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class EmailOtpService {
  final String baseUrl = 'https://your-api-domain.com';
  
  Future<void> sendEmailOtp({
    required String packageId,
    required String participantId,
    required String fieldId,
    required String email,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/send-otp'
    );
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'fieldId': fieldId,
        'email': email,
      }),
    );
    
    if (response.statusCode != 200) {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to send OTP');
    }
  }
  
  Future<ParticipantPackage> verifyEmailOtp({
    required String packageId,
    required String participantId,
    required String fieldId,
    required String otp,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/verify-otp'
    );
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'fieldId': fieldId,
        'otp': otp,
      }),
    );
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return ParticipantPackage.fromJson(jsonData['data']['package']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to verify OTP');
    }
  }
}
```

---

## SMS OTP Signing

### API Endpoints

#### 1. Send SMS OTP

**POST** `/api/packages/participant/{packageId}/{participantId}/send-sms-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "phone": "+1234567890"
}
```

**Response:** Same format as Email OTP

#### 2. Verify SMS OTP

**POST** `/api/packages/participant/{packageId}/{participantId}/verify-sms-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "otp": "123456"
}
```

**Response:** Same format as Email OTP verification

### Validation Rules

1. **Phone Match**: Phone must match `currentUser.contactPhone`
2. **Field Type**: Field must be of type "signature"
3. **Signature Method**: Participant must have "SMS OTP" in `signatureMethods`
4. **Not Signed**: Field must not already be signed
5. **Package Status**: Package must be in "Sent" status
6. **Terms Agreement**: User must have agreed to terms

### Flutter Implementation

```dart
class SmsOtpService {
  final String baseUrl = 'https://your-api-domain.com';
  
  Future<void> sendSmsOtp({
    required String packageId,
    required String participantId,
    required String fieldId,
    required String phone,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/send-sms-otp'
    );
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'fieldId': fieldId,
        'phone': phone,
      }),
    );
    
    if (response.statusCode != 200) {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to send OTP');
    }
  }
  
  Future<ParticipantPackage> verifySmsOtp({
    required String packageId,
    required String participantId,
    required String fieldId,
    required String otp,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/verify-sms-otp'
    );
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'fieldId': fieldId,
        'otp': otp,
      }),
    );
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return ParticipantPackage.fromJson(jsonData['data']['package']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to verify OTP');
    }
  }
}
```

---

## Document Reassignment

### Overview

Reassignment allows a participant to transfer all their assigned fields to another contact. This is useful when:
- A participant cannot complete the signing process
- Responsibilities need to be delegated
- Contact information needs to be updated

### Important Rules

1. **Cannot Reassign if Signed**: If any field has been signed, reassignment is not allowed
2. **New Contact Must Be Available**: The new contact must not already be a participant
3. **Package Owner Only**: New contact must belong to the same package owner
4. **Package Status**: Only "Sent" packages can be reassigned
5. **Reassignment Enabled**: Package must have `allowReassign: true` option

### Reassignment Flow

1. **Check Eligibility**: Verify participant can reassign
2. **List Contacts**: Fetch available contacts for reassignment
3. **Create Contact (Optional)**: Create new contact if needed
4. **Select Contact**: Choose the contact to reassign to
5. **Provide Reason**: Enter reason for reassignment
6. **Perform Reassignment**: Execute the reassignment
7. **Receive New Participant ID**: Get new participant ID for the reassigned contact

### API Endpoints

#### 1. Check Reassignment Eligibility

**GET** `/api/packages/participant/{packageId}/{participantId}/reassignment/eligibility`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "canReassign": true,
    "reason": null,
    "hasSignedFields": false
  }
}
```

**Response (Cannot Reassign):**
```json
{
  "success": true,
  "data": {
    "canReassign": false,
    "reason": "Cannot reassign because these fields have already been completed: Signature Field 1",
    "hasSignedFields": true
  }
}
```

#### 2. List Available Contacts

**GET** `/api/packages/participant/{packageId}/{participantId}/reassignment/contacts`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "_id": "contactId123",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "phone": "+1234567890"
      }
    ]
  }
}
```

#### 3. Register New Contact

**POST** `/api/packages/participant/{packageId}/{participantId}/reassignment/register-contact`

**Request Body:**
```json
{
  "email": "newcontact@example.com",
  "firstName": "New",
  "lastName": "Contact",
  "phone": "+1234567890"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Contact registered successfully.",
  "data": {
    "contact": {
      "_id": "newContactId123",
      "firstName": "New",
      "lastName": "Contact",
      "email": "newcontact@example.com",
      "phone": "+1234567890"
    }
  }
}
```

#### 4. Perform Reassignment

**POST** `/api/packages/participant/{packageId}/{participantId}/reassignment/perform`

**Request Body:**
```json
{
  "newContactId": "contactId123",
  "reason": "I am unable to complete this document. Please reassign to my colleague."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Reassignment completed successfully.",
  "data": {
    "message": "Reassignment completed successfully.",
    "newParticipantId": "newParticipantId456",
    "fieldsReassigned": 2,
    "receiverReassigned": true
  }
}
```

### What Happens During Reassignment

1. **Validation**: System checks all prerequisites
2. **Field Transfer**: All assigned fields are transferred to new contact
3. **Receiver Transfer**: If participant is a receiver, receiver status is transferred
4. **New Participant ID**: New unique participant ID is generated
5. **History Record**: Reassignment is recorded in package history
6. **Notifications**: 
   - Original participant receives notification
   - New participant receives invitation email
   - Package owner receives notification
7. **Access Change**: Original participant loses access, new participant gains access

### Flutter Implementation

```dart
class ReassignmentService {
  final String baseUrl = 'https://your-api-domain.com';
  
  // Check if participant can reassign
  Future<ReassignmentEligibility> checkEligibility({
    required String packageId,
    required String participantId,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/reassignment/eligibility'
    );
    
    final response = await http.get(url);
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return ReassignmentEligibility.fromJson(jsonData['data']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to check eligibility');
    }
  }
  
  // List available contacts for reassignment
  Future<List<Contact>> listContacts({
    required String packageId,
    required String participantId,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/reassignment/contacts'
    );
    
    final response = await http.get(url);
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return (jsonData['data']['contacts'] as List)
          .map((c) => Contact.fromJson(c))
          .toList();
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch contacts');
    }
  }
  
  // Create new contact for reassignment
  Future<Contact> createContact({
    required String packageId,
    required String participantId,
    required String email,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/reassignment/register-contact'
    );
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        if (phone != null) 'phone': phone,
      }),
    );
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return Contact.fromJson(jsonData['data']['contact']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to create contact');
    }
  }
  
  // Perform the reassignment
  Future<ReassignmentResult> performReassignment({
    required String packageId,
    required String participantId,
    required String newContactId,
    required String reason,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/reassignment/perform'
    );
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'newContactId': newContactId,
        'reason': reason,
      }),
    );
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return ReassignmentResult.fromJson(jsonData['data']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to perform reassignment');
    }
  }
}

// Data Models
class ReassignmentEligibility {
  final bool canReassign;
  final String? reason;
  final bool hasSignedFields;
  
  ReassignmentEligibility({
    required this.canReassign,
    this.reason,
    required this.hasSignedFields,
  });
  
  factory ReassignmentEligibility.fromJson(Map<String, dynamic> json) {
    return ReassignmentEligibility(
      canReassign: json['canReassign'],
      reason: json['reason'],
      hasSignedFields: json['hasSignedFields'],
    );
  }
}

class Contact {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  
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
  
  String get fullName => '$firstName $lastName';
}

class ReassignmentResult {
  final String message;
  final String newParticipantId;
  final int fieldsReassigned;
  final bool receiverReassigned;
  
  ReassignmentResult({
    required this.message,
    required this.newParticipantId,
    required this.fieldsReassigned,
    required this.receiverReassigned,
  });
  
  factory ReassignmentResult.fromJson(Map<String, dynamic> json) {
    return ReassignmentResult(
      message: json['message'],
      newParticipantId: json['newParticipantId'],
      fieldsReassigned: json['fieldsReassigned'],
      receiverReassigned: json['receiverReassigned'],
    );
  }
}
```

### UI Example - Reassignment Dialog

```dart
class ReassignmentDialog extends StatefulWidget {
  final String packageId;
  final String participantId;
  final Function(String newParticipantId) onReassigned;
  
  const ReassignmentDialog({
    Key? key,
    required this.packageId,
    required this.participantId,
    required this.onReassigned,
  }) : super(key: key);
  
  @override
  State<ReassignmentDialog> createState() => _ReassignmentDialogState();
}

class _ReassignmentDialogState extends State<ReassignmentDialog> {
  final ReassignmentService _reassignmentService = ReassignmentService();
  
  ReassignmentEligibility? _eligibility;
  List<Contact> _contacts = [];
  Contact? _selectedContact;
  String _reason = '';
  bool _isLoading = false;
  bool _showCreateContact = false;
  String? _error;
  
  // Form controllers for new contact
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    _checkEligibility();
  }
  
  @override
  void dispose() {
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
  
  Future<void> _checkEligibility() async {
    setState(() => _isLoading = true);
    try {
      final eligibility = await _reassignmentService.checkEligibility(
        packageId: widget.packageId,
        participantId: widget.participantId,
      );
      
      if (eligibility.canReassign) {
        _loadContacts();
      }
      
      setState(() {
        _eligibility = eligibility;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }
  
  Future<void> _loadContacts() async {
    try {
      final contacts = await _reassignmentService.listContacts(
        packageId: widget.packageId,
        participantId: widget.participantId,
      );
      setState(() => _contacts = contacts);
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }
  
  Future<void> _createContact() async {
    if (_emailController.text.isEmpty ||
        _firstNameController.text.isEmpty ||
        _lastNameController.text.isEmpty) {
      setState(() => _error = 'Please fill in all required fields');
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final contact = await _reassignmentService.createContact(
        packageId: widget.packageId,
        participantId: widget.participantId,
        email: _emailController.text,
        firstName: _firstNameController.text,
        lastName: _lastNameController.text,
        phone: _phoneController.text.isEmpty ? null : _phoneController.text,
      );
      
      setState(() {
        _selectedContact = contact;
        _contacts.add(contact);
        _showCreateContact = false;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }
  
  Future<void> _performReassignment() async {
    if (_selectedContact == null) {
      setState(() => _error = 'Please select a contact');
      return;
    }
    
    if (_reason.trim().isEmpty) {
      setState(() => _error = 'Please provide a reason for reassignment');
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final result = await _reassignmentService.performReassignment(
        packageId: widget.packageId,
        participantId: widget.participantId,
        newContactId: _selectedContact!.id,
        reason: _reason,
      );
      
      if (mounted) {
        Navigator.pop(context);
        widget.onReassigned(result.newParticipantId);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Document reassigned successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        padding: EdgeInsets.all(24),
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Reassign Document',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            
            if (_isLoading && _eligibility == null)
              Center(child: CircularProgressIndicator())
            else if (_eligibility != null && !_eligibility!.canReassign) ...[
              Icon(Icons.block, color: Colors.red, size: 48),
              SizedBox(height: 16),
              Text(
                'Cannot Reassign',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red),
              ),
              SizedBox(height: 8),
              Text(
                _eligibility!.reason ?? 'Reassignment is not allowed',
                style: TextStyle(color: Colors.grey),
              ),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: Text('Close'),
              ),
            ] else ...[
              if (!_showCreateContact) ...[
                // Contact Selection
                Text('Select a contact to reassign to:', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Expanded(
                  child: _contacts.isEmpty
                      ? Center(child: Text('No contacts available'))
                      : ListView.builder(
                          itemCount: _contacts.length,
                          itemBuilder: (context, index) {
                            final contact = _contacts[index];
                            final isSelected = _selectedContact?.id == contact.id;
                            
                            return ListTile(
                              title: Text(contact.fullName),
                              subtitle: Text(contact.email),
                              selected: isSelected,
                              onTap: () => setState(() => _selectedContact = contact),
                              trailing: isSelected ? Icon(Icons.check, color: Colors.green) : null,
                            );
                          },
                        ),
                ),
                SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () => setState(() => _showCreateContact = true),
                  icon: Icon(Icons.add),
                  label: Text('Create New Contact'),
                ),
              ] else ...[
                // Create Contact Form
                Text('Create New Contact', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 16),
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email *',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                SizedBox(height: 8),
                TextField(
                  controller: _firstNameController,
                  decoration: InputDecoration(
                    labelText: 'First Name *',
                    border: OutlineInputBorder(),
                  ),
                ),
                SizedBox(height: 8),
                TextField(
                  controller: _lastNameController,
                  decoration: InputDecoration(
                    labelText: 'Last Name *',
                    border: OutlineInputBorder(),
                  ),
                ),
                SizedBox(height: 8),
                TextField(
                  controller: _phoneController,
                  decoration: InputDecoration(
                    labelText: 'Phone (Optional)',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.phone,
                ),
                SizedBox(height: 16),
                Row(
                  children: [
                    TextButton(
                      onPressed: () => setState(() => _showCreateContact = false),
                      child: Text('Back'),
                    ),
                    Spacer(),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _createContact,
                      child: _isLoading
                          ? SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text('Create Contact'),
                    ),
                  ],
                ),
              ],
              
              if (_selectedContact != null && !_showCreateContact) ...[
                Divider(height: 32),
                Text('Reason for Reassignment *', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Enter reason for reassignment',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                  onChanged: (value) => setState(() => _reason = value),
                ),
              ],
              
              if (_error != null) ...[
                SizedBox(height: 8),
                Text(
                  _error!,
                  style: TextStyle(color: Colors.red, fontSize: 12),
                ),
              ],
              
              SizedBox(height: 16),
              Row(
                children: [
                  TextButton(
                    onPressed: _isLoading ? null : () => Navigator.pop(context),
                    child: Text('Cancel'),
                  ),
                  if (_selectedContact != null && !_showCreateContact)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading || _reason.trim().isEmpty
                            ? null
                            : _performReassignment,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                        ),
                        child: _isLoading
                            ? SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text('Reassign Document'),
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

---

## Complete Implementation Example

### Unified Signing Service

```dart
class DocumentSigningService {
  final String baseUrl = 'https://your-api-domain.com';
  final EmailOtpService _emailOtp = EmailOtpService();
  final SmsOtpService _smsOtp = SmsOtpService();
  final ReassignmentService _reassignment = ReassignmentService();
  
  // Determine available signing methods
  List<String> getAvailableMethods(DocumentField field) {
    if (field.assignedUsers.isEmpty) return [];
    return field.assignedUsers[0].signatureMethods;
  }
  
  // Send OTP based on method
  Future<void> sendOtp({
    required String packageId,
    required String participantId,
    required String fieldId,
    required String method, // 'email' or 'sms'
    required String identity, // email or phone
  }) async {
    if (method == 'email') {
      return _emailOtp.sendEmailOtp(
        packageId: packageId,
        participantId: participantId,
        fieldId: fieldId,
        email: identity,
      );
    } else {
      return _smsOtp.sendSmsOtp(
        packageId: packageId,
        participantId: participantId,
        fieldId: fieldId,
        phone: identity,
      );
    }
  }
  
  // Verify OTP based on method
  Future<ParticipantPackage> verifyOtp({
    required String packageId,
    required String participantId,
    required String fieldId,
    required String method, // 'email' or 'sms'
    required String otp,
  }) async {
    if (method == 'email') {
      return _emailOtp.verifyEmailOtp(
        packageId: packageId,
        participantId: participantId,
        fieldId: fieldId,
        otp: otp,
      );
    } else {
      return _smsOtp.verifySmsOtp(
        packageId: packageId,
        participantId: participantId,
        fieldId: fieldId,
        otp: otp,
      );
    }
  }
}
```

### Complete Signing Modal with OTP

```dart
class OTPSigningModal extends StatefulWidget {
  final DocumentField field;
  final CurrentUser currentUser;
  final String packageId;
  final String participantId;
  final Function(ParticipantPackage) onSuccess;
  
  const OTPSigningModal({
    Key? key,
    required this.field,
    required this.currentUser,
    required this.packageId,
    required this.participantId,
    required this.onSuccess,
  }) : super(key: key);
  
  @override
  State<OTPSigningModal> createState() => _OTPSigningModalState();
}

class _OTPSigningModalState extends State<OTPSigningModal> {
  final DocumentSigningService _signingService = DocumentSigningService();
  
  List<String> get _availableMethods {
    return _signingService.getAvailableMethods(widget.field);
  }
  
  String? _selectedMethod; // 'email' or 'sms'
  String _identityInput = '';
  String _otpInput = '';
  bool _isLoading = false;
  bool _otpSent = false;
  int _otpTimer = 60;
  Timer? _timer;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    // Auto-select if only one method
    if (_availableMethods.length == 1) {
      _selectedMethod = _availableMethods[0].contains('Email') ? 'email' : 'sms';
      // Pre-fill identity
      if (_selectedMethod == 'email') {
        _identityInput = widget.currentUser.contactEmail;
      } else {
        _identityInput = widget.currentUser.contactPhone ?? '';
      }
    }
  }
  
  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
  
  void _startOtpTimer() {
    _otpTimer = 60;
    _timer?.cancel();
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_otpTimer > 0) {
        setState(() => _otpTimer--);
      } else {
        timer.cancel();
      }
    });
  }
  
  Future<void> _sendOtp() async {
    if (_selectedMethod == null) {
      setState(() => _error = 'Please select a signing method');
      return;
    }
    
    if (_selectedMethod == 'email') {
      if (!_isValidEmail(_identityInput)) {
        setState(() => _error = 'Please enter a valid email address');
        return;
      }
      if (_identityInput.toLowerCase() != widget.currentUser.contactEmail.toLowerCase()) {
        setState(() => _error = 'Email must match your assigned email');
        return;
      }
    } else {
      if (!_isValidPhone(_identityInput)) {
        setState(() => _error = 'Please enter a valid phone number');
        return;
      }
      if (_identityInput != widget.currentUser.contactPhone) {
        setState(() => _error = 'Phone must match your assigned phone number');
        return;
      }
    }
    
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      await _signingService.sendOtp(
        packageId: widget.packageId,
        participantId: widget.participantId,
        fieldId: widget.field.id,
        method: _selectedMethod!,
        identity: _identityInput,
      );
      
      setState(() {
        _otpSent = true;
        _isLoading = false;
      });
      
      _startOtpTimer();
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }
  
  Future<void> _verifyOtp() async {
    if (_otpInput.length != 6) {
      setState(() => _error = 'Please enter a 6-digit OTP code');
      return;
    }
    
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final updatedPackage = await _signingService.verifyOtp(
        packageId: widget.packageId,
        participantId: widget.participantId,
        fieldId: widget.field.id,
        method: _selectedMethod!,
        otp: _otpInput,
      );
      
      widget.onSuccess(updatedPackage);
      Navigator.pop(context);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Document signed successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }
  
  Future<void> _resendOtp() async {
    if (_otpTimer > 0) return;
    
    _otpInput = '';
    setState(() => _otpSent = false);
    await _sendOtp();
  }
  
  bool _isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }
  
  bool _isValidPhone(String phone) {
    return RegExp(r'^\+?[1-9]\d{1,14}$').hasMatch(phone);
  }
  
  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        padding: EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Sign Document',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              
              if (!_otpSent) ...[
                // Method Selection
                if (_availableMethods.length > 1) ...[
                  Text('Select signing method:', style: TextStyle(fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  RadioListTile<String>(
                    title: Text('Email OTP'),
                    value: 'email',
                    groupValue: _selectedMethod,
                    onChanged: (value) {
                      setState(() {
                        _selectedMethod = value;
                        _identityInput = widget.currentUser.contactEmail;
                      });
                    },
                  ),
                  RadioListTile<String>(
                    title: Text('SMS OTP'),
                    value: 'sms',
                    groupValue: _selectedMethod,
                    onChanged: (value) {
                      setState(() {
                        _selectedMethod = value;
                        _identityInput = widget.currentUser.contactPhone ?? '';
                      });
                    },
                  ),
                  SizedBox(height: 8),
                ],
                
                // Identity Input
                TextField(
                  decoration: InputDecoration(
                    labelText: _selectedMethod == 'email' ? 'Email' : 'Phone Number',
                    hintText: _selectedMethod == 'email'
                        ? widget.currentUser.contactEmail
                        : widget.currentUser.contactPhone ?? '',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: _selectedMethod == 'email'
                      ? TextInputType.emailAddress
                      : TextInputType.phone,
                  controller: TextEditingController(text: _identityInput)
                    ..selection = TextSelection.collapsed(offset: _identityInput.length),
                  onChanged: (value) => setState(() => _identityInput = value),
                ),
                SizedBox(height: 16),
                
                if (_error != null) ...[
                  Text(
                    _error!,
                    style: TextStyle(color: Colors.red, fontSize: 12),
                  ),
                  SizedBox(height: 8),
                ],
                
                ElevatedButton(
                  onPressed: _isLoading ? null : _sendOtp,
                  child: _isLoading
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text('Send OTP'),
                ),
              ] else ...[
                // OTP Input
                Text('Enter the 6-digit OTP code:', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                TextField(
                  decoration: InputDecoration(
                    labelText: 'OTP Code',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 24, letterSpacing: 8),
                  onChanged: (value) => setState(() => _otpInput = value),
                ),
                SizedBox(height: 8),
                
                if (_otpTimer > 0)
                  Text(
                    'Code expires in $_otpTimer seconds',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                
                if (_error != null) ...[
                  SizedBox(height: 8),
                  Text(
                    _error!,
                    style: TextStyle(color: Colors.red, fontSize: 12),
                  ),
                ],
                
                SizedBox(height: 16),
                
                Row(
                  children: [
                    if (_otpTimer == 0)
                      TextButton(
                        onPressed: _resendOtp,
                        child: Text('Resend OTP'),
                      ),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading || _otpInput.length != 6
                            ? null
                            : _verifyOtp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                        ),
                        child: _isLoading
                            ? SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text('Verify & Sign'),
                      ),
                    ),
                  ],
                ),
              ],
              
              SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('Cancel'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## Error Handling

### Common Errors for OTP Signing

#### 1. Email/Phone Mismatch
```
Error: "Email does not match assigned participant."
```
**Solution**: Ensure the email/phone entered matches `currentUser.contactEmail` or `currentUser.contactPhone`.

#### 2. Invalid or Expired OTP
```
Error: "Invalid or expired OTP."
```
**Solution**: Request a new OTP. OTPs expire after 60 seconds.

#### 3. Incorrect OTP
```
Error: "Incorrect OTP."
```
**Solution**: Verify the OTP code. Maximum 4 attempts allowed.

#### 4. Maximum Attempts Exceeded
```
Error: "Maximum OTP attempts exceeded."
```
**Solution**: Request a new OTP after 4 failed attempts.

#### 5. Terms Not Agreed
```
Error: "You must agree to the Terms of Use before signing."
```
**Solution**: Display terms agreement screen before allowing signing.

#### 6. Field Already Signed
```
Error: "This field has already been signed."
```
**Solution**: Check field status before allowing signing.

### Common Errors for Reassignment

#### 1. Cannot Reassign - Fields Signed
```
Error: "Cannot reassign because these fields have already been completed: Signature Field 1"
```
**Solution**: Reassignment is only allowed if no fields have been signed.

#### 2. Contact Already Participant
```
Error: "The selected contact is already a participant in this package."
```
**Solution**: Select a different contact that is not already assigned.

#### 3. Reassignment Not Allowed
```
Error: "Reassignment is not allowed for this package."
```
**Solution**: Check package settings - `allowReassign` must be true.

#### 4. Package Not in Sent Status
```
Error: "Reassignment is only available for sent packages."
```
**Solution**: Reassignment only works for packages with "Sent" status.

#### 5. Contact Not Found
```
Error: "New contact not found or invalid."
```
**Solution**: Verify the contact exists and belongs to the package owner.

### Error Handling Implementation

```dart
String _getUserFriendlyError(String error) {
  if (error.contains('not match')) {
    return 'The email or phone number does not match your assigned contact information.';
  }
  
  if (error.contains('Invalid or expired OTP')) {
    return 'The OTP code has expired. Please request a new one.';
  }
  
  if (error.contains('Incorrect OTP')) {
    return 'The OTP code is incorrect. Please try again.';
  }
  
  if (error.contains('Maximum OTP attempts')) {
    return 'Too many incorrect attempts. Please request a new OTP code.';
  }
  
  if (error.contains('Terms of Use')) {
    return 'You must agree to the Terms of Use before signing.';
  }
  
  if (error.contains('already been completed')) {
    return 'Cannot reassign because some fields have already been signed.';
  }
  
  if (error.contains('already a participant')) {
    return 'The selected contact is already assigned to this document.';
  }
  
  if (error.contains('not allowed for this package')) {
    return 'Reassignment is not enabled for this document.';
  }
  
  return error; // Return original error if no match
}
```

---

## Best Practices

### 1. OTP Management

- **Timer Display**: Always show countdown timer for OTP expiration
- **Auto-request**: Don't auto-request OTP on screen load
- **Resend Logic**: Enable resend only after timer expires
- **Input Validation**: Validate OTP format before submission (6 digits)
- **Attempt Tracking**: Show remaining attempts after failed verification

### 2. Reassignment Flow

- **Check Eligibility First**: Always check eligibility before showing reassignment UI
- **Clear Communication**: Explain what will happen during reassignment
- **Required Reason**: Make reason mandatory for audit trail
- **Confirmation**: Show confirmation dialog before performing reassignment
- **Handle New Participant ID**: Update app state with new participant ID after reassignment

### 3. State Management

- **Package Updates**: Refresh package data after OTP verification
- **Field Status**: Update all signature fields when one is verified
- **Loading States**: Show loading indicators during API calls
- **Error States**: Clear errors when user starts new action

### 4. User Experience

- **Pre-fill Identity**: Pre-fill email/phone from current user data
- **Method Selection**: Auto-select if only one method available
- **Visual Feedback**: Show success animations after signing
- **Status Indicators**: Clearly show which fields are signed
- **Navigation**: Handle navigation after successful operations

### 5. Security

- **Identity Validation**: Always validate email/phone matches assigned contact
- **OTP Expiration**: Respect 60-second expiration window
- **Attempt Limits**: Enforce 4-attempt limit
- **Terms Agreement**: Require terms agreement before signing
- **HTTPS Only**: Use HTTPS for all API calls

### 6. Testing Scenarios

Test the following scenarios:

- ✅ Email OTP flow (single and multiple fields)
- ✅ SMS OTP flow (single and multiple fields)
- ✅ Both methods available (selection works)
- ✅ OTP expiration handling
- ✅ Maximum attempt limit (4 attempts)
- ✅ Resend OTP after expiration
- ✅ Multiple signature fields (all sign at once)
- ✅ Reassignment eligibility check
- ✅ Reassignment flow (select contact)
- ✅ Reassignment flow (create contact)
- ✅ Reassignment with signed fields (should fail)
- ✅ Terms agreement requirement
- ✅ Package expiry scenarios
- ✅ Network error handling
- ✅ Already-signed fields handling

---

## Summary

This guide covers the complete OTP-based document signing implementation in Flutter:

### Key Features

1. **OTP Signing**: 
   - Email OTP and SMS OTP support
   - Automatic signing of all fields on verification
   - 60-second expiration with timer
   - 4-attempt limit with clear feedback

2. **Document Reassignment**:
   - Eligibility checking
   - Contact selection or creation
   - Reason requirement
   - Automatic notification system

3. **Error Handling**:
   - User-friendly error messages
   - Proper validation
   - Graceful failure handling

4. **Best Practices**:
   - Security-first approach
   - Excellent user experience
   - Proper state management
   - Comprehensive testing

### Important Notes

- **One OTP Signs All**: Verifying OTP for one field signs ALL signature fields for that participant
- **Reassignment Restrictions**: Cannot reassign if any field has been signed
- **Identity Matching**: Email/phone must exactly match assigned contact information
- **Terms Required**: Users must agree to terms before signing
- **Package Status**: Operations only work on "Sent" status packages

---

## Support

For questions or issues:

1. Check API responses for detailed error messages
2. Verify `participantId` and `packageId` are correct
3. Ensure package status is "Sent"
4. Confirm email/phone matches participant assignment
5. Check OTP expiration and attempt limits
6. Verify terms agreement status
7. Check reassignment eligibility before attempting

---

**Version:** 1.0  
**Last Updated:** 2024

