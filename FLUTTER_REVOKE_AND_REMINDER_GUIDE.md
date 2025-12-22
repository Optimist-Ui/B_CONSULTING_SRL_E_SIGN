# Flutter App - Revoke Document & Send Reminder Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Guide for implementing document revocation and reminder functionality in Flutter mobile applications

---

## Table of Contents

1. [Overview](#overview)
2. [Revoke Document](#revoke-document)
3. [Send Reminder](#send-reminder)
4. [Error Handling](#error-handling)
5. [Implementation Examples](#implementation-examples)

---

## Overview

This guide covers two important document management features:

1. **Revoke Document**: Allows the package owner to void a sent document, preventing further participant interaction
2. **Send Reminder**: Allows the package owner to manually send reminder emails to participants who haven't completed their required actions

Both features require **authentication** (Bearer token) and can only be performed by the **package owner**.

---

## Revoke Document

### Overview

Revoking a document voids it completely, preventing any further participant interaction. This action:
- Changes package status to "Revoked"
- Sends email notifications to all participants
- Records revocation details for audit trail
- Cannot be undone

### API Endpoint

**PATCH** `/api/packages/{packageId}/revoke`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Optional reason for revocation (max 500 characters)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Package has been successfully revoked.",
  "data": {
    "id": "packageId123",
    "status": "Revoked"
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

### Validation Rules

1. **Owner Only**: Only the package owner can revoke their own packages
2. **Status Check**: Cannot revoke packages that are already in terminal states:
   - "Completed"
   - "Revoked"
   - "Expired"
   - "Rejected"
3. **Reason**: Optional, but if provided, must be:
   - String type
   - Maximum 500 characters
   - Trimmed (no leading/trailing spaces)

### What Happens When Document is Revoked

1. **Status Update**: Package status changes to "Revoked"
2. **Audit Trail**: Revocation details are recorded:
   - Who revoked it (user ID, name, email)
   - When it was revoked (timestamp)
   - Reason (if provided)
   - IP address
3. **Notifications**: Email notifications sent to:
   - All participants assigned to the package
   - Package owner (confirmation)
4. **Access Blocked**: Participants can no longer:
   - Sign fields
   - Fill form fields
   - Access the document via their participant link

### Flutter Implementation

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class DocumentService {
  final String baseUrl = 'https://your-api-domain.com';
  final String? authToken; // Store user's auth token
  
  Future<RevokeResponse> revokeDocument({
    required String packageId,
    String? reason,
  }) async {
    final url = Uri.parse('$baseUrl/api/packages/$packageId/revoke');
    
    final response = await http.patch(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: json.encode({
        if (reason != null && reason.isNotEmpty) 'reason': reason,
      }),
    );
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return RevokeResponse.fromJson(jsonData);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to revoke document');
    }
  }
}

// Data Models
class RevokeResponse {
  final bool success;
  final String message;
  final RevokeData data;
  
  RevokeResponse({
    required this.success,
    required this.message,
    required this.data,
  });
  
  factory RevokeResponse.fromJson(Map<String, dynamic> json) {
    return RevokeResponse(
      success: json['success'],
      message: json['message'],
      data: RevokeData.fromJson(json['data']),
    );
  }
}

class RevokeData {
  final String id;
  final String status;
  
  RevokeData({
    required this.id,
    required this.status,
  });
  
  factory RevokeData.fromJson(Map<String, dynamic> json) {
    return RevokeData(
      id: json['id'],
      status: json['status'],
    );
  }
}
```

### UI Example

```dart
class RevokeDocumentDialog extends StatefulWidget {
  final String packageId;
  final String packageName;
  
  const RevokeDocumentDialog({
    Key? key,
    required this.packageId,
    required this.packageName,
  }) : super(key: key);
  
  @override
  State<RevokeDocumentDialog> createState() => _RevokeDocumentDialogState();
}

class _RevokeDocumentDialogState extends State<RevokeDocumentDialog> {
  final DocumentService _documentService = DocumentService();
  final TextEditingController _reasonController = TextEditingController();
  bool _isLoading = false;
  
  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }
  
  Future<void> _revokeDocument() async {
    if (_isLoading) return;
    
    setState(() => _isLoading = true);
    
    try {
      final response = await _documentService.revokeDocument(
        packageId: widget.packageId,
        reason: _reasonController.text.trim().isEmpty 
            ? null 
            : _reasonController.text.trim(),
      );
      
      if (mounted) {
        Navigator.pop(context, true); // Return true to indicate success
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Revoke Document'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to revoke "${widget.packageName}"?',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              'This action cannot be undone. All participants will be notified and will no longer be able to sign or interact with this document.',
              style: TextStyle(color: Colors.red),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _reasonController,
              decoration: InputDecoration(
                labelText: 'Reason (Optional)',
                hintText: 'Enter reason for revocation',
                border: OutlineInputBorder(),
                helperText: 'Maximum 500 characters',
              ),
              maxLength: 500,
              maxLines: 3,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.pop(context),
          child: Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _revokeDocument,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
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
              : Text('Revoke Document'),
        ),
      ],
    );
  }
}

// Usage
void showRevokeDialog(BuildContext context, String packageId, String packageName) {
  showDialog(
    context: context,
    builder: (context) => RevokeDocumentDialog(
      packageId: packageId,
      packageName: packageName,
    ),
  ).then((revoked) {
    if (revoked == true) {
      // Refresh document list or navigate back
      // Example: Navigator.pop(context);
    }
  });
}
```

---

## Send Reminder

### Overview

Sending a reminder allows the package owner to manually notify participants who haven't completed their required actions. This feature:
- Identifies participants with incomplete required fields
- Sends personalized reminder emails
- Respects participant language preferences
- Only works for packages with "Sent" status

### API Endpoint

**POST** `/api/packages/{packageId}/reminder`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:** None (empty body)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Reminders sent to 3 pending participant(s).",
  "data": {
    "success": true,
    "message": "Reminders sent to 3 pending participant(s)."
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

### Validation Rules

1. **Owner Only**: Only the package owner can send reminders
2. **Status Check**: Reminders can only be sent for packages with "Sent" status
3. **Pending Participants**: Only sends to participants who:
   - Have required fields assigned
   - Have not completed all their required fields
   - Are still pending (not signed/completed)

### What Happens When Reminder is Sent

1. **Participant Identification**: System identifies all participants with incomplete required tasks
2. **Language Detection**: Fetches each participant's language preference from their contact
3. **Email Sending**: Sends personalized reminder emails to each pending participant
4. **Email Content**: Each email includes:
   - Package name
   - Initiator's name
   - Direct link to sign the document
   - Localized content based on participant's language

### Flutter Implementation

```dart
class DocumentService {
  final String baseUrl = 'https://your-api-domain.com';
  final String? authToken;
  
  Future<ReminderResponse> sendReminder({
    required String packageId,
  }) async {
    final url = Uri.parse('$baseUrl/api/packages/$packageId/reminder');
    
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
    );
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return ReminderResponse.fromJson(jsonData);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to send reminder');
    }
  }
}

// Data Models
class ReminderResponse {
  final bool success;
  final String message;
  final ReminderData data;
  
  ReminderResponse({
    required this.success,
    required this.message,
    required this.data,
  });
  
  factory ReminderResponse.fromJson(Map<String, dynamic> json) {
    return ReminderResponse(
      success: json['success'],
      message: json['message'],
      data: ReminderData.fromJson(json['data']),
    );
  }
}

class ReminderData {
  final bool success;
  final String message;
  
  ReminderData({
    required this.success,
    required this.message,
  });
  
  factory ReminderData.fromJson(Map<String, dynamic> json) {
    return ReminderData(
      success: json['success'],
      message: json['message'],
    );
  }
}
```

### UI Example

```dart
class SendReminderButton extends StatefulWidget {
  final String packageId;
  final String packageName;
  
  const SendReminderButton({
    Key? key,
    required this.packageId,
    required this.packageName,
  }) : super(key: key);
  
  @override
  State<SendReminderButton> createState() => _SendReminderButtonState();
}

class _SendReminderButtonState extends State<SendReminderButton> {
  final DocumentService _documentService = DocumentService();
  bool _isLoading = false;
  
  Future<void> _sendReminder() async {
    if (_isLoading) return;
    
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Send Reminder'),
        content: Text(
          'Send reminder emails to all participants who haven\'t completed their required actions?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Send Reminder'),
          ),
        ],
      ),
    );
    
    if (confirmed != true) return;
    
    setState(() => _isLoading = true);
    
    try {
      final response = await _documentService.sendReminder(
        packageId: widget.packageId,
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: _isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(Icons.notifications_active),
      tooltip: 'Send Reminder',
      onPressed: _isLoading ? null : _sendReminder,
    );
  }
}
```

---

## Error Handling

### Common Errors for Revoke

#### 1. Package Not Found or No Permission
```
Error: "Package not found or you do not have permission to revoke it."
```
**Solution**: Verify the user is the package owner and package ID is correct.

#### 2. Package Already in Terminal State
```
Error: "Cannot revoke this package as it is already in a 'Completed' state."
```
**Solution**: Check package status. Can only revoke packages with status "Sent" or "Draft".

#### 3. Invalid Reason Length
```
Error: "The reason cannot exceed 500 characters."
```
**Solution**: Ensure reason is 500 characters or less.

### Common Errors for Send Reminder

#### 1. Package Not Found or No Permission
```
Error: "Package not found or you do not have permission to send reminders."
```
**Solution**: Verify the user is the package owner and package ID is correct.

#### 2. Invalid Package Status
```
Error: "Reminders can only be sent for packages with 'Sent' status. Current status: 'Draft'."
```
**Solution**: Only packages with "Sent" status can receive reminders.

#### 3. All Participants Completed
```
Error: "All participants have already completed their actions. No reminders sent."
```
**Solution**: This is informational - all participants have completed their required tasks.

### Error Handling Implementation

```dart
String _getUserFriendlyError(String error) {
  if (error.contains('not found') || error.contains('permission')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.contains('already in a')) {
    return 'This document cannot be revoked in its current state.';
  }
  
  if (error.contains('already completed')) {
    return 'All participants have completed their actions.';
  }
  
  if (error.contains('cannot exceed')) {
    return 'Reason is too long. Maximum 500 characters allowed.';
  }
  
  if (error.contains('Sent') && error.contains('status')) {
    return 'Reminders can only be sent for active documents.';
  }
  
  return error; // Return original error if no match
}
```

---

## Implementation Examples

### Complete Service Class

```dart
class DocumentService {
  final String baseUrl = 'https://your-api-domain.com';
  final String? authToken;
  
  DocumentService({this.authToken});
  
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };
  
  Future<RevokeResponse> revokeDocument({
    required String packageId,
    String? reason,
  }) async {
    final url = Uri.parse('$baseUrl/api/packages/$packageId/revoke');
    
    final response = await http.patch(
      url,
      headers: _headers,
      body: json.encode({
        if (reason != null && reason.trim().isNotEmpty) 
          'reason': reason.trim(),
      }),
    );
    
    if (response.statusCode == 200) {
      return RevokeResponse.fromJson(json.decode(response.body));
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to revoke document');
    }
  }
  
  Future<ReminderResponse> sendReminder({
    required String packageId,
  }) async {
    final url = Uri.parse('$baseUrl/api/packages/$packageId/reminder');
    
    final response = await http.post(
      url,
      headers: _headers,
    );
    
    if (response.statusCode == 200) {
      return ReminderResponse.fromJson(json.decode(response.body));
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to send reminder');
    }
  }
}
```

### Complete UI Example

```dart
class DocumentActionsMenu extends StatelessWidget {
  final String packageId;
  final String packageName;
  final String packageStatus;
  final VoidCallback? onActionComplete;
  
  const DocumentActionsMenu({
    Key? key,
    required this.packageId,
    required this.packageName,
    required this.packageStatus,
    this.onActionComplete,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: Icon(Icons.more_vert),
      onSelected: (value) {
        if (value == 'revoke') {
          _showRevokeDialog(context);
        } else if (value == 'reminder') {
          _sendReminder(context);
        }
      },
      itemBuilder: (context) => [
        if (packageStatus == 'Sent')
          PopupMenuItem(
            value: 'reminder',
            child: Row(
              children: [
                Icon(Icons.notifications_active, size: 20),
                SizedBox(width: 8),
                Text('Send Reminder'),
              ],
            ),
          ),
        if (packageStatus == 'Sent' || packageStatus == 'Draft')
          PopupMenuItem(
            value: 'revoke',
            child: Row(
              children: [
                Icon(Icons.block, size: 20, color: Colors.red),
                SizedBox(width: 8),
                Text('Revoke Document', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
      ],
    );
  }
  
  void _showRevokeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => RevokeDocumentDialog(
        packageId: packageId,
        packageName: packageName,
      ),
    ).then((revoked) {
      if (revoked == true && onActionComplete != null) {
        onActionComplete!();
      }
    });
  }
  
  void _sendReminder(BuildContext context) {
    final service = DocumentService(authToken: 'your_token_here');
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Send Reminder'),
        content: Text(
          'Send reminder emails to all participants who haven\'t completed their required actions?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final response = await service.sendReminder(
                  packageId: packageId,
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(response.message),
                    backgroundColor: Colors.green,
                  ),
                );
                if (onActionComplete != null) {
                  onActionComplete!();
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error: ${e.toString()}'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: Text('Send'),
          ),
        ],
      ),
    );
  }
}
```

---

## Summary

### Revoke Document
- **Endpoint**: `PATCH /api/packages/{packageId}/revoke`
- **Auth**: Required (Owner only)
- **Status**: Can only revoke "Sent" or "Draft" packages
- **Result**: Status changes to "Revoked", all participants notified
- **Irreversible**: Cannot be undone

### Send Reminder
- **Endpoint**: `POST /api/packages/{packageId}/reminder`
- **Auth**: Required (Owner only)
- **Status**: Only works for "Sent" packages
- **Result**: Reminder emails sent to pending participants
- **Smart**: Only sends to participants with incomplete required tasks

### Key Points
1. Both features require authentication (Bearer token)
2. Only package owners can perform these actions
3. Status validation is important - check before calling
4. Error messages are descriptive - handle them appropriately
5. UI should provide clear feedback and confirmations

---

**Version:** 1.0  
**Last Updated:** 2024

