# Flutter Forgot Password Implementation Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Target Platform:** Flutter Mobile App

---

## Table of Contents

1. [Overview](#overview)
2. [Complete Flow Diagram](#complete-flow-diagram)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Deep Linking Setup](#deep-linking-setup)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Flutter Code Examples](#flutter-code-examples)
10. [Testing Checklist](#testing-checklist)

---

## Overview

The forgot password flow allows users to reset their password when they've forgotten it. The process involves:

1. **Request Password Reset**: User enters their email address
2. **Email Sent**: System sends a password reset link via email
3. **Token Verification**: User clicks link, app verifies the token
4. **Reset Password**: User enters new password
5. **Success**: Password is updated and user can log in

### Key Features

- ✅ Token-based password reset (32-byte hexadecimal)
- ✅ Token expiration (1 hour)
- ✅ One-time use tokens (replaced after reset)
- ✅ Security email sent after successful reset
- ✅ Deep linking support for mobile apps
- ✅ Public endpoints (no authentication required)

---

## Complete Flow Diagram

```
┌─────────────┐
│   User      │
│  Forgets    │
│  Password   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Step 1: Enter Email    │
│  POST /request-password │
│  -reset                 │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Step 2: Email Sent     │
│  (with reset link)     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Step 3: User Clicks    │
│  Link (Deep Link)       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Step 4: Verify Token  │
│  GET /verify-token/{token}│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Step 5: Enter New      │
│  Password               │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Step 6: Reset Password │
│  POST /reset-password   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Step 7: Success!       │
│  Navigate to Login      │
└─────────────────────────┘
```

---

## API Endpoints

### Base URL
```
/api/users
```

All endpoints are **public** (no authentication required).

---

### 1. Request Password Reset

**POST** `/api/users/request-password-reset`

**Description:** Initiates the password reset process by sending a reset link to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Validation Rules:**
- `email`: Required, must be a valid email format

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": {
    "message": "Password reset email sent"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to send password reset email",
  "error": "Valid email is required"
}
```

**Error Response (400) - User Not Found:**
```json
{
  "success": false,
  "message": "Failed to send password reset email",
  "error": "User not found"
}
```

**Important Notes:**
- ⚠️ **Security Best Practice**: The API returns success even if the email doesn't exist (to prevent email enumeration attacks)
- The reset token is generated as a 32-byte hexadecimal string
- Token expires in **1 hour** from the request time
- Reset link format: `${CLIENT_URL}/reset-password/{token}`

---

### 2. Verify Reset Token

**GET** `/api/users/verify-token/{token}`

**Description:** Checks if a password reset token is valid and has not expired. Use this before showing the password reset form.

**URL Parameters:**
- `token`: The reset token from the email link (path parameter)

**Success Response (200) - Valid Token:**
```json
{
  "found": true
}
```

**Success Response (200) - Invalid/Expired Token:**
```json
{
  "found": false
}
```

**Use Cases:**
- Verify token validity when user opens the reset link
- Check if token has expired before showing the form
- Handle invalid tokens gracefully

**Important Notes:**
- Token must exist in database
- Token must not be expired (`resetTokenExpiresAt > current time`)
- Returns `found: false` for invalid or expired tokens

---

### 3. Reset Password

**POST** `/api/users/reset-password`

**Description:** Sets a new password using a valid reset token.

**Request Body:**
```json
{
  "resetToken": "a1b2c3d4e5f6...",
  "newPassword": "newpassword123"
}
```

**Validation Rules:**
- `resetToken`: Required, non-empty string
- `newPassword`: Required, minimum 6 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "message": "Password reset successful"
  }
}
```

**Error Response (400) - Missing Fields:**
```json
{
  "success": false,
  "message": "Missing token or new password"
}
```

**Error Response (400) - Invalid/Expired Token:**
```json
{
  "success": false,
  "message": "Failed to reset password",
  "error": "Invalid or expired reset token"
}
```

**Error Response (400) - Validation Error:**
```json
{
  "success": false,
  "message": "Failed to reset password",
  "error": "New password must be at least 6 characters"
}
```

**Important Notes:**
- Token is **one-time use** - after successful reset, a new security token is generated
- Password is hashed using bcrypt before storage
- A success email is sent to the user with a security reset link
- User can immediately log in with the new password

---

## Data Models

### Reset Password Request
```dart
class ResetPasswordRequest {
  final String email;

  ResetPasswordRequest({
    required this.email,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
    };
  }
}
```

### Verify Token Response
```dart
class VerifyTokenResponse {
  final bool found;

  VerifyTokenResponse({
    required this.found,
  });

  factory VerifyTokenResponse.fromJson(Map<String, dynamic> json) {
    return VerifyTokenResponse(
      found: json['found'] ?? false,
    );
  }
}
```

### Reset Password Submit Request
```dart
class ResetPasswordSubmitRequest {
  final String resetToken;
  final String newPassword;

  ResetPasswordSubmitRequest({
    required this.resetToken,
    required this.newPassword,
  });

  Map<String, dynamic> toJson() {
    return {
      'resetToken': resetToken,
      'newPassword': newPassword,
    };
  }
}
```

### API Response Wrapper
```dart
class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final String? error;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.error,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'] as T?,
      error: json['error'],
    );
  }
}
```

---

## Step-by-Step Implementation

### Step 1: Forgot Password Screen

**UI Requirements:**
- Email input field
- Submit button
- Loading state indicator
- Back to login link
- Error message display

**User Flow:**
1. User enters their email address
2. User taps "Send Reset Link" button
3. Show loading indicator
4. Call `POST /api/users/request-password-reset`
5. Show success message (even if email doesn't exist - security)
6. Optionally navigate back to login or show "Check your email" message

**Validation:**
- Email format validation (client-side)
- Show error if email is empty or invalid format

---

### Step 2: Deep Link Handling

**Deep Link Format:**
```
yourapp://reset-password/{token}
```

**Alternative (Universal Link):**
```
https://yourdomain.com/reset-password/{token}
```

**Implementation:**
1. Configure deep linking in your Flutter app
2. Handle incoming links when app is opened
3. Extract the token from the URL
4. Navigate to reset password screen with token

**Important:**
- Token is passed as a URL parameter
- Extract token before navigating to reset screen
- Validate token format (should be 64-character hex string)

---

### Step 3: Reset Password Screen

**UI Requirements:**
- Token verification status (loading/success/error)
- New password input field (with show/hide toggle)
- Confirm password input field (with show/hide toggle)
- Submit button
- Password strength indicator (optional)
- Error message display

**User Flow:**
1. Screen loads with token from deep link
2. Automatically verify token: `GET /api/users/verify-token/{token}`
3. Show loading state while verifying
4. If token is valid:
   - Show password reset form
   - Enable password fields
5. If token is invalid/expired:
   - Show error message
   - Option to request new reset link
6. User enters new password and confirmation
7. Validate passwords match and meet requirements
8. Call `POST /api/users/reset-password`
9. Show success message
10. Navigate to login screen

**Validation:**
- Password minimum length: 6 characters
- Passwords must match
- Show validation errors in real-time

---

## Deep Linking Setup

> **📘 Server-Side Setup Required:** Before implementing deep linking in your Flutter app, ensure your server is configured to serve the required verification files. See **[DEEP_LINKING_SERVER_SETUP_GUIDE.md](./DEEP_LINKING_SERVER_SETUP_GUIDE.md)** for complete server-side configuration instructions.

### Android Configuration

**1. AndroidManifest.xml**
```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTop">
    
    <!-- Existing intent filter -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
    </intent-filter>
    
    <!-- Deep link intent filter -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data
            android:scheme="https"
            android:host="yourdomain.com"
            android:pathPrefix="/reset-password"/>
    </intent-filter>
    
    <!-- Custom scheme (alternative) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="yourapp"/>
    </intent-filter>
</activity>
```

### iOS Configuration

**1. Info.plist**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLName</key>
        <string>com.yourapp.resetpassword</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>yourapp</string>
        </array>
    </dict>
</array>
```

**2. Associated Domains (for Universal Links)**
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:yourdomain.com</string>
</array>
```

### Flutter Deep Link Handling

**Using `uni_links` or `app_links` package:**

```dart
import 'package:uni_links/uni_links.dart';
import 'package:app_links/app_links.dart';

class DeepLinkService {
  static const String resetPasswordPath = '/reset-password/';
  
  // Handle deep links when app is opened
  Future<String?> handleInitialLink() async {
    try {
      final initialUri = await getInitialUri();
      if (initialUri != null) {
        return _extractToken(initialUri.toString());
      }
    } catch (e) {
      print('Error handling initial link: $e');
    }
    return null;
  }
  
  // Listen for deep links when app is running
  void listenToLinks(Function(String token) onTokenReceived) {
    uriLinkStream.listen((Uri uri) {
      final token = _extractToken(uri.toString());
      if (token != null) {
        onTokenReceived(token);
      }
    }, onError: (err) {
      print('Error listening to links: $err');
    });
  }
  
  String? _extractToken(String url) {
    // Extract token from URL
    // Format: yourapp://reset-password/{token}
    // or: https://yourdomain.com/reset-password/{token}
    
    final uri = Uri.parse(url);
    final pathSegments = uri.pathSegments;
    
    if (pathSegments.length >= 2 && 
        pathSegments[0] == 'reset-password') {
      return pathSegments[1];
    }
    
    return null;
  }
}
```

---

## Error Handling

### Common Error Scenarios

#### 1. Invalid Email Format
```dart
if (!isValidEmail(email)) {
  showError('Please enter a valid email address');
  return;
}
```

#### 2. Network Error
```dart
try {
  await requestPasswordReset(email);
} on SocketException {
  showError('No internet connection. Please check your network.');
} on TimeoutException {
  showError('Request timed out. Please try again.');
} catch (e) {
  showError('An error occurred. Please try again.');
}
```

#### 3. Invalid/Expired Token
```dart
final isValid = await verifyToken(token);
if (!isValid) {
  showError('This reset link is invalid or has expired.');
  showButton('Request New Reset Link');
  return;
}
```

#### 4. Password Validation Errors
```dart
if (newPassword.length < 6) {
  showError('Password must be at least 6 characters long');
  return;
}

if (newPassword != confirmPassword) {
  showError('Passwords do not match');
  return;
}
```

#### 5. Token Already Used
```dart
// If reset password returns "Invalid or expired reset token"
// after successful verification, token was likely already used
if (error.contains('Invalid or expired')) {
  showError('This reset link has already been used. Please request a new one.');
}
```

### Error Response Handling

```dart
class AuthService {
  Future<void> requestPasswordReset(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/users/request-password-reset'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        // Success - always show success message (security)
        return;
      } else {
        throw Exception(data['error'] ?? 'Failed to send reset email');
      }
    } on http.ClientException {
      throw Exception('Network error. Please check your connection.');
    } catch (e) {
      throw Exception(e.toString());
    }
  }
  
  Future<bool> verifyToken(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/users/verify-token/$token'),
      );
      
      final data = jsonDecode(response.body);
      return data['found'] == true;
    } catch (e) {
      print('Error verifying token: $e');
      return false;
    }
  }
  
  Future<void> resetPassword(String token, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/users/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'resetToken': token,
          'newPassword': newPassword,
        }),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return;
      } else {
        throw Exception(data['error'] ?? 'Failed to reset password');
      }
    } on http.ClientException {
      throw Exception('Network error. Please check your connection.');
    } catch (e) {
      throw Exception(e.toString());
    }
  }
}
```

---

## Security Considerations

### 1. Token Security
- ✅ Tokens are 32-byte hexadecimal strings (64 characters)
- ✅ Tokens expire after 1 hour
- ✅ Tokens are one-time use (replaced after reset)
- ✅ Tokens are stored securely in database

### 2. Email Enumeration Prevention
- ✅ API returns success even if email doesn't exist
- ✅ Always show "Check your email" message
- ✅ Don't reveal if email exists in system

### 3. Password Requirements
- ✅ Minimum 6 characters (enforced on backend)
- ✅ Passwords are hashed with bcrypt
- ✅ Never send passwords in error messages

### 4. Token Validation
- ✅ Always verify token before showing reset form
- ✅ Check token expiration on backend
- ✅ Handle invalid tokens gracefully

### 5. HTTPS Only
- ✅ All API calls must use HTTPS
- ✅ Deep links should use secure schemes
- ✅ Never transmit tokens over unencrypted connections

### 6. Rate Limiting
- ⚠️ Consider implementing rate limiting on client side
- ⚠️ Backend may have rate limiting (check with backend team)

---

## Flutter Code Examples

### Complete Forgot Password Service

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ForgotPasswordService {
  final String baseUrl;
  
  ForgotPasswordService({required this.baseUrl});
  
  /// Request password reset email
  Future<void> requestPasswordReset(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/users/request-password-reset'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return; // Success
      } else {
        throw ForgotPasswordException(
          data['error'] ?? 'Failed to send reset email',
        );
      }
    } on http.ClientException {
      throw ForgotPasswordException('Network error. Please check your connection.');
    } catch (e) {
      if (e is ForgotPasswordException) rethrow;
      throw ForgotPasswordException('An error occurred: ${e.toString()}');
    }
  }
  
  /// Verify reset token validity
  Future<bool> verifyToken(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/users/verify-token/$token'),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['found'] == true;
      }
      return false;
    } catch (e) {
      print('Error verifying token: $e');
      return false;
    }
  }
  
  /// Reset password with token
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/users/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'resetToken': token,
          'newPassword': newPassword,
        }),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return; // Success
      } else {
        throw ForgotPasswordException(
          data['error'] ?? 'Failed to reset password',
        );
      }
    } on http.ClientException {
      throw ForgotPasswordException('Network error. Please check your connection.');
    } catch (e) {
      if (e is ForgotPasswordException) rethrow;
      throw ForgotPasswordException('An error occurred: ${e.toString()}');
    }
  }
}

class ForgotPasswordException implements Exception {
  final String message;
  ForgotPasswordException(this.message);
  
  @override
  String toString() => message;
}
```

### Forgot Password Screen

```dart
import 'package:flutter/material.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);
  
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _service = ForgotPasswordService(baseUrl: 'https://api.yourapp.com');
  
  bool _isLoading = false;
  bool _emailSent = false;
  String? _errorMessage;
  
  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }
  
  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      await _service.requestPasswordReset(_emailController.text.trim());
      setState(() {
        _emailSent = true;
        _isLoading = false;
      });
    } on ForgotPasswordException catch (e) {
      setState(() {
        _errorMessage = e.message;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'An unexpected error occurred';
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_emailSent) {
      return _buildSuccessView();
    }
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Forgot Password'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Enter your email address and we\'ll send you a link to reset your password.',
                style: TextStyle(fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  hintText: 'Enter your email',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!value.contains('@')) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  child: _isLoading
                      ? const CircularProgressIndicator()
                      : const Text('Send Reset Link'),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Back to Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildSuccessView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Check Your Email'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.email,
              size: 80,
              color: Colors.green,
            ),
            const SizedBox(height: 24),
            const Text(
              'Password Reset Email Sent',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'We\'ve sent a password reset link to ${_emailController.text}',
              style: const TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Back to Login'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Reset Password Screen

```dart
import 'package:flutter/material.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String token;
  
  const ResetPasswordScreen({
    Key? key,
    required this.token,
  }) : super(key: key);
  
  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _service = ForgotPasswordService(baseUrl: 'https://api.yourapp.com');
  
  bool _isLoading = false;
  bool _isVerifying = true;
  bool _tokenValid = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  String? _errorMessage;
  String? _successMessage;
  
  @override
  void initState() {
    super.initState();
    _verifyToken();
  }
  
  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
  
  Future<void> _verifyToken() async {
    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });
    
    final isValid = await _service.verifyToken(widget.token);
    
    setState(() {
      _isVerifying = false;
      _tokenValid = isValid;
      if (!isValid) {
        _errorMessage = 'This reset link is invalid or has expired.';
      }
    });
  }
  
  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });
    
    try {
      await _service.resetPassword(
        token: widget.token,
        newPassword: _passwordController.text,
      );
      
      setState(() {
        _successMessage = 'Password reset successful!';
        _isLoading = false;
      });
      
      // Navigate to login after 2 seconds
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.of(context).pushNamedAndRemoveUntil(
            '/login',
            (route) => false,
          );
        }
      });
    } on ForgotPasswordException catch (e) {
      setState(() {
        _errorMessage = e.message;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'An unexpected error occurred';
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isVerifying) {
      return Scaffold(
        appBar: AppBar(title: const Text('Reset Password')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Verifying reset link...'),
            ],
          ),
        ),
      );
    }
    
    if (!_tokenValid) {
      return Scaffold(
        appBar: AppBar(title: const Text('Invalid Link')),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 80,
                color: Colors.red,
              ),
              const SizedBox(height: 24),
              const Text(
                'Invalid or Expired Link',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage ?? 'This reset link is invalid or has expired.',
                style: const TextStyle(fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pushNamed('/forgot-password');
                  },
                  child: const Text('Request New Reset Link'),
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_successMessage != null) ...[
                const Icon(
                  Icons.check_circle,
                  size: 80,
                  color: Colors.green,
                ),
                const SizedBox(height: 16),
                Text(
                  _successMessage!,
                  style: const TextStyle(
                    fontSize: 18,
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
              ] else ...[
                const Text(
                  'Enter your new password',
                  style: TextStyle(fontSize: 18),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _passwordController,
                  obscureText: !_showPassword,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    hintText: 'Enter new password',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showPassword
                            ? Icons.visibility
                            : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _showPassword = !_showPassword;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a password';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: !_showConfirmPassword,
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    hintText: 'Confirm new password',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showConfirmPassword
                            ? Icons.visibility
                            : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _showConfirmPassword = !_showConfirmPassword;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your password';
                    }
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSubmit,
                    child: _isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Reset Password'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
```

### Deep Link Handler (Main App)

```dart
import 'package:flutter/material.dart';
import 'package:uni_links/uni_links.dart';

class AppRouter {
  static void handleDeepLink(BuildContext context, String link) {
    final uri = Uri.parse(link);
    
    // Extract path segments
    final segments = uri.pathSegments;
    
    if (segments.isNotEmpty && segments[0] == 'reset-password') {
      if (segments.length >= 2) {
        final token = segments[1];
        Navigator.of(context).pushNamed(
          '/reset-password',
          arguments: token,
        );
      }
    }
  }
}

// In your main.dart or app initialization
class MyApp extends StatefulWidget {
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  StreamSubscription? _linkSubscription;
  
  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }
  
  void _initDeepLinks() async {
    // Handle initial link (when app is opened from link)
    try {
      final initialLink = await getInitialUri();
      if (initialLink != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          AppRouter.handleDeepLink(context, initialLink.toString());
        });
      }
    } catch (e) {
      print('Error handling initial link: $e');
    }
    
    // Listen for links when app is running
    _linkSubscription = uriLinkStream.listen(
      (Uri uri) {
        AppRouter.handleDeepLink(context, uri.toString());
      },
      onError: (err) {
        print('Error listening to links: $err');
      },
    );
  }
  
  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // ... your app configuration
      routes: {
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/reset-password': (context) {
          final token = ModalRoute.of(context)!.settings.arguments as String;
          return ResetPasswordScreen(token: token);
        },
        // ... other routes
      },
    );
  }
}
```

---

## Testing Checklist

### Functional Testing

- [ ] **Request Password Reset**
  - [ ] Valid email sends request successfully
  - [ ] Invalid email format shows validation error
  - [ ] Empty email shows validation error
  - [ ] Success message displayed (even for non-existent emails)
  - [ ] Loading state shown during request
  - [ ] Network error handled gracefully

- [ ] **Token Verification**
  - [ ] Valid token returns `found: true`
  - [ ] Expired token returns `found: false`
  - [ ] Invalid token returns `found: false`
  - [ ] Loading state shown during verification
  - [ ] Error state displayed for invalid tokens

- [ ] **Reset Password**
  - [ ] Valid token and password resets successfully
  - [ ] Password minimum length validation (6 characters)
  - [ ] Password confirmation match validation
  - [ ] Invalid token shows error
  - [ ] Expired token shows error
  - [ ] Already-used token shows error
  - [ ] Success message displayed
  - [ ] Navigation to login after success

- [ ] **Deep Linking**
  - [ ] App opens from email link (cold start)
  - [ ] App handles link when already running
  - [ ] Token extracted correctly from URL
  - [ ] Invalid link format handled gracefully
  - [ ] Universal links work (iOS)
  - [ ] Custom scheme links work (Android)

### Security Testing

- [ ] Email enumeration prevention (same response for existing/non-existing emails)
- [ ] Token expiration enforced (1 hour)
- [ ] Token one-time use enforced
- [ ] HTTPS used for all API calls
- [ ] Passwords not logged or exposed
- [ ] Token not exposed in error messages

### UI/UX Testing

- [ ] Loading indicators shown during async operations
- [ ] Error messages are user-friendly
- [ ] Success messages are clear
- [ ] Form validation provides immediate feedback
- [ ] Password visibility toggle works
- [ ] Keyboard handling appropriate
- [ ] Back navigation works correctly

### Edge Cases

- [ ] Multiple rapid requests handled
- [ ] App killed during reset process
- [ ] Network interruption during request
- [ ] Very long email addresses
- [ ] Special characters in password
- [ ] Token with invalid format
- [ ] Empty token string

---

## Important Notes for Flutter Development

### 1. State Management
- Use `StatefulWidget` or state management solution (Provider, Bloc, Riverpod)
- Manage loading states for better UX
- Handle token verification state separately from form state

### 2. Navigation
- Use named routes for deep linking
- Handle navigation from deep links properly
- Clear navigation stack when navigating to login after success

### 3. Error Handling
- Always show user-friendly error messages
- Log technical errors for debugging
- Handle network errors separately from validation errors

### 4. Security
- Never store tokens in shared preferences
- Clear sensitive data from memory when done
- Use secure storage for any cached data
- Validate all inputs on client side

### 5. Email Links
- Email links use `${CLIENT_URL}/reset-password/{token}` format
- Configure your app to handle this URL pattern
- Test both universal links and custom schemes

### 6. Token Format
- Tokens are 64-character hexadecimal strings
- Validate token format before sending to API
- Handle malformed tokens gracefully

### 7. Password Requirements
- Minimum 6 characters (enforced on backend)
- Consider adding client-side strength indicator
- Always validate password confirmation matches

### 8. Success Flow
- After successful reset, user receives security email
- User can immediately log in with new password
- Consider auto-navigating to login screen

---

## Support and Troubleshooting

### Common Issues

**Issue:** Deep link not opening app
- **Solution:** Check AndroidManifest.xml and Info.plist configuration
- Verify URL scheme matches email link format
- Test with `adb` commands (Android) or Safari (iOS)

**Issue:** Token verification always fails
- **Solution:** Check token extraction from URL
- Verify token format (64 hex characters)
- Check API base URL configuration

**Issue:** Password reset fails after verification
- **Solution:** Token may have been used already
- Check if token expired (1 hour limit)
- Verify password meets requirements

**Issue:** Email not received
- **Solution:** Check spam folder
- Verify email service configuration on backend
- Check email address is correct

---

## API Base URL Configuration

Make sure to configure the correct API base URL in your Flutter app:

```dart
// Development
const String baseUrl = 'https://dev-api.yourapp.com';

// Production
const String baseUrl = 'https://api.yourapp.com';
```

Update this based on your environment configuration.

---

## Conclusion

This guide provides everything needed to implement the forgot password flow in your Flutter mobile app. The flow is secure, user-friendly, and follows best practices for password reset functionality.

For questions or clarifications, refer to the backend API documentation or contact the backend development team.

---

**End of Document**

