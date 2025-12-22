# Flutter Delete Account Implementation Guide

This guide explains how to implement the delete account functionality in your Flutter application.

## Overview

The delete account feature uses a **grace period** approach:
- Account is **deactivated** immediately (not deleted)
- User receives a reactivation link via email (valid for 14 days)
- Account is **permanently deleted** after 14 days if not reactivated
- Subscription is maintained during the grace period (not cancelled immediately)

---

## API Endpoints

### 1. Delete Account (Deactivate)

**Endpoint:** `POST /api/users/delete-account`

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

**Request Body:** None (empty body)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deactivation requested successfully",
  "data": {
    "message": "Account deactivated. Check your email for reactivation instructions."
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Failed to request account deletion",
  "error": "Unauthorized"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to request account deletion",
  "error": "User not found"
}
```

---

### 2. Reactivate Account

**Endpoint:** `GET /api/users/reactivate/{token}`

**Authentication:** Not required (public endpoint)

**URL Parameters:**
- `token`: The reactivation token from the email link

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account reactivated successfully",
  "data": {
    "message": "Account reactivated successfully. You can now log in.",
    "hasActiveSubscription": true
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to reactivate account",
  "error": "Invalid or expired reactivation token."
}
```

---

## Implementation Steps

### Step 1: Create API Service Method

Add the delete account method to your API service:

```dart
// api_service.dart

Future<Map<String, dynamic>> deleteAccount() async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/users/delete-account'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200) {
      return {
        'success': true,
        'message': data['data']['message'] ?? 'Account deactivated successfully',
      };
    } else {
      return {
        'success': false,
        'message': data['error'] ?? 'Failed to delete account',
      };
    }
  } catch (e) {
    return {
      'success': false,
      'message': 'Network error: ${e.toString()}',
    };
  }
}

Future<Map<String, dynamic>> reactivateAccount(String token) async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/api/users/reactivate/$token'),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    final data = json.decode(response.body);
    
    if (response.statusCode == 200) {
      return {
        'success': true,
        'message': data['data']['message'] ?? 'Account reactivated successfully',
        'hasActiveSubscription': data['data']['hasActiveSubscription'] ?? false,
      };
    } else {
      return {
        'success': false,
        'message': data['error'] ?? 'Failed to reactivate account',
      };
    }
  } catch (e) {
    return {
      'success': false,
      'message': 'Network error: ${e.toString()}',
    };
  }
}
```

---

### Step 2: Create Delete Account Confirmation Dialog

Create a confirmation dialog that requires the user to type a confirmation text:

```dart
// widgets/delete_account_dialog.dart

import 'package:flutter/material.dart';

class DeleteAccountDialog extends StatefulWidget {
  final VoidCallback onConfirm;

  const DeleteAccountDialog({
    Key? key,
    required this.onConfirm,
  }) : super(key: key);

  @override
  State<DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<DeleteAccountDialog> {
  final TextEditingController _confirmController = TextEditingController();
  final String _requiredText = 'REMOVE MY ACCOUNT';

  @override
  void dispose() {
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          Icon(Icons.warning, color: Colors.red, size: 24),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Confirm Account Deletion',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'This action is irreversible. Your account and all associated data will be deactivated. To proceed, type "$_requiredText" below:',
            style: TextStyle(fontSize: 14),
          ),
          SizedBox(height: 16),
          TextField(
            controller: _confirmController,
            decoration: InputDecoration(
              hintText: 'Type $_requiredText',
              border: OutlineInputBorder(),
              focusedBorder: OutlineInputBorder(
                borderSide: BorderSide(color: Colors.red),
              ),
            ),
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) {
              if (_confirmController.text == _requiredText) {
                widget.onConfirm();
              }
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _confirmController.text == _requiredText
              ? () {
                  widget.onConfirm();
                  Navigator.of(context).pop();
                }
              : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            foregroundColor: Colors.white,
          ),
          child: Text('Delete Account'),
        ),
      ],
    );
  }
}
```

---

### Step 3: Implement Delete Account in Profile/Settings Screen

Add the delete account functionality to your profile or settings screen:

```dart
// screens/profile_screen.dart

import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/delete_account_dialog.dart';

class ProfileScreen extends StatefulWidget {
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();
  bool _isDeleting = false;

  Future<void> _handleDeleteAccount() async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => DeleteAccountDialog(
        onConfirm: () => Navigator.of(context).pop(true),
      ),
    );

    if (confirmed != true) return;

    // Show loading indicator
    setState(() => _isDeleting = true);

    try {
      final result = await _apiService.deleteAccount();

      if (mounted) {
        setState(() => _isDeleting = false);

        if (result['success'] == true) {
          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message']),
              backgroundColor: Colors.green,
            ),
          );

          // Logout user and navigate to login
          // Clear local storage, tokens, etc.
          await _logoutUser();
          
          Navigator.of(context).pushNamedAndRemoveUntil(
            '/login',
            (route) => false,
          );
        } else {
          // Show error message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message']),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isDeleting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('An error occurred: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _logoutUser() async {
    // Clear authentication tokens
    // Clear user data from local storage
    // Clear any cached data
    // Example:
    // await SharedPreferences.getInstance().then((prefs) {
    //   prefs.remove('auth_token');
    //   prefs.remove('user_data');
    // });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile Settings'),
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          // Other profile settings...
          
          SizedBox(height: 24),
          Divider(),
          SizedBox(height: 16),
          
          // Delete Account Section
          Text(
            'Danger Zone',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.red,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Once you delete your account, there is no going back. Please be certain.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: _isDeleting ? null : _handleDeleteAccount,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: _isDeleting
                ? SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text('Delete Account'),
          ),
        ],
      ),
    );
  }
}
```

---

### Step 4: Handle Deep Link for Reactivation

If the user clicks the reactivation link in their email, handle it in your app:

```dart
// main.dart or app initialization

import 'package:flutter/material.dart';
import 'package:uni_links/uni_links.dart'; // Add this package

class MyApp extends StatefulWidget {
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    // Handle initial link (if app was opened via link)
    try {
      final initialLink = await getInitialLink();
      if (initialLink != null) {
        _handleDeepLink(initialLink);
      }
    } catch (e) {
      print('Error getting initial link: $e');
    }

    // Listen for links while app is running
    linkStream.listen((String? link) {
      if (link != null) {
        _handleDeepLink(link);
      }
    }, onError: (err) {
      print('Error listening to links: $err');
    });
  }

  void _handleDeepLink(String link) {
    // Parse the reactivation link
    // Format: https://yourdomain.com/reactivate/{token}
    // Or: yourapp://reactivate/{token}
    
    final uri = Uri.parse(link);
    
    if (uri.pathSegments.contains('reactivate') && 
        uri.pathSegments.length > 1) {
      final token = uri.pathSegments.last;
      _handleReactivation(token);
    }
  }

  Future<void> _handleReactivation(String token) async {
    final apiService = ApiService();
    
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(child: CircularProgressIndicator()),
    );

    try {
      final result = await apiService.reactivateAccount(token);

      if (mounted) {
        Navigator.of(context).pop(); // Close loading dialog

        if (result['success'] == true) {
          // Show success message
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: Text('Account Reactivated'),
              content: Text(result['message']),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    // Navigate to login screen
                    Navigator.of(context).pushNamed('/login');
                  },
                  child: Text('OK'),
                ),
              ],
            ),
          );
        } else {
          // Show error message
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: Text('Reactivation Failed'),
              content: Text(result['message']),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text('OK'),
                ),
              ],
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop(); // Close loading dialog
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('Error'),
            content: Text('An error occurred: ${e.toString()}'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text('OK'),
              ),
            ],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // Your app configuration
    );
  }
}
```

---

## Important Notes

### 1. Account Deactivation Flow
- Account is **deactivated immediately** (not deleted)
- User cannot log in after deactivation
- Subscription is **not cancelled immediately** (maintained during grace period)
- User receives email with reactivation link (valid for 14 days)

### 2. Grace Period
- **14 days** grace period for reactivation
- After 14 days, account is **permanently deleted** by a cron job
- Subscription is cancelled during permanent deletion if still active

### 3. User Experience
- After deletion request, **immediately log out** the user
- Show clear message that account is deactivated
- Inform user to check email for reactivation instructions
- User can reactivate within 14 days via email link

### 4. Reactivation
- Reactivation link is sent via email
- Link format: `{CLIENT_URL}/reactivate/{token}`
- Token is valid for 14 days
- After reactivation, user can log in normally

### 5. Error Handling
- Handle network errors gracefully
- Show user-friendly error messages
- Handle expired/invalid reactivation tokens
- Handle unauthorized requests (token expired)

---

## Testing Checklist

- [ ] Delete account request succeeds with valid token
- [ ] Delete account fails with invalid/expired token
- [ ] Confirmation dialog requires exact text match
- [ ] User is logged out after successful deletion
- [ ] Success message is displayed
- [ ] Reactivation link opens app (deep linking)
- [ ] Reactivation succeeds with valid token
- [ ] Reactivation fails with expired/invalid token
- [ ] Network errors are handled gracefully
- [ ] Loading states are shown during API calls

---

## Example Complete Flow

1. User navigates to Profile/Settings screen
2. User taps "Delete Account" button
3. Confirmation dialog appears requiring "REMOVE MY ACCOUNT" text
4. User types confirmation text and confirms
5. API call is made to `/api/users/delete-account`
6. On success:
   - Success message is shown
   - User is logged out
   - User is redirected to login screen
   - Email is sent with reactivation link
7. User clicks reactivation link in email (within 14 days)
8. App opens via deep link
9. API call is made to `/api/users/reactivate/{token}`
10. On success:
    - Account is reactivated
    - User can log in again
11. If user doesn't reactivate within 14 days:
    - Account is permanently deleted by cron job
    - Subscription is cancelled (if exists)

---

## Additional Resources

- See `AUTHENTICATION_FLOW.md` for related authentication endpoints
- See `api/src/services/UserService.js` for backend implementation
- See `api/src/jobs/DeleteExpiredAccountsJob.js` for deletion cron job

