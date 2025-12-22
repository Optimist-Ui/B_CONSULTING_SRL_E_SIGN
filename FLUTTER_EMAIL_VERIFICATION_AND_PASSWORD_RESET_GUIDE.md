# Flutter Email Verification and Password Reset Deep Linking Guide

**Version:** 1.0  
**Last Updated:** November 2024  
**Target Platform:** Flutter Mobile App

---

## Table of Contents

1. [Overview](#overview)
2. [Deep Linking Configuration](#deep-linking-configuration)
3. [Email Verification Flow](#email-verification-flow)
4. [Password Reset Flow](#password-reset-flow)
5. [Deep Link Handler Implementation](#deep-link-handler-implementation)
6. [API Integration](#api-integration)
7. [UI Components](#ui-components)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)
10. [Testing Checklist](#testing-checklist)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers the implementation of email verification and password reset functionality in your Flutter mobile app using deep linking. These features allow users to verify their email addresses and reset their passwords by clicking links sent to their email.

### Key Features

- ✅ **Email Verification**: Users verify their email address after registration
- ✅ **Password Reset**: Users can reset their password if forgotten
- ✅ **Deep Linking**: Seamless app opening from email links
- ✅ **Universal Links**: iOS and Android app link support
- ✅ **Token-based Security**: Secure, time-limited tokens
- ✅ **Offline Handling**: Graceful handling of network issues

### Deep Link Paths

Your app is configured to handle the following deep link paths:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "69QX53F9VW.com.isign.app",
        "paths": [
          "/reset-password/*",
          "/verify-email/*",
          "/package/*/participant/*",
          "/package/*/participant/*/review"
        ]
      }
    ]
  }
}
```

This guide focuses on:
- `/verify-email/*` - Email verification
- `/reset-password/*` - Password reset

---

## Deep Linking Configuration

### Prerequisites

> **📘 Server-Side Setup Required:** Before implementing deep linking in your Flutter app, ensure your server is configured to serve the required verification files. See **[DEEP_LINKING_SERVER_SETUP_GUIDE.md](./DEEP_LINKING_SERVER_SETUP_GUIDE.md)** for complete server-side configuration instructions.

### Required Flutter Packages

Add these packages to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  uni_links: ^0.5.1  # For deep link handling
  app_links: ^3.5.0  # Alternative, more modern approach
  http: ^1.1.0      # For API calls
  flutter_secure_storage: ^9.0.0  # For secure token storage
```

### Android Configuration

**File:** `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity
            android:name=".MainActivity"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <!-- Main launcher intent filter -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
            
            <!-- Deep linking intent filter for HTTPS (Universal Links) -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                
                <!-- Replace yourdomain.com with your actual domain -->
                <data
                    android:scheme="https"
                    android:host="yourdomain.com"
                    android:pathPrefix="/verify-email"/>
                <data
                    android:scheme="https"
                    android:host="yourdomain.com"
                    android:pathPrefix="/reset-password"/>
            </intent-filter>
            
            <!-- Optional: Custom scheme for deep links -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                
                <data android:scheme="com.isign.app"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### iOS Configuration

**File:** `ios/Runner/Info.plist`

```xml
<dict>
    <!-- Existing keys... -->
    
    <!-- Custom URL Scheme -->
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeRole</key>
            <string>Editor</string>
            <key>CFBundleURLName</key>
            <string>com.isign.app</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>com.isign.app</string>
            </array>
        </dict>
    </array>
    
    <!-- Associated Domains for Universal Links -->
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:yourdomain.com</string>
    </array>
</dict>
```

**File:** `ios/Runner.entitlements` (create if doesn't exist)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:yourdomain.com</string>
    </array>
</dict>
</plist>
```

---

## Email Verification Flow

### Complete Flow Diagram

```
┌─────────────────────┐
│  User Registers     │
│  on App             │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Registration       │
│  Successful         │
│  (email sent)       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  User Opens Email   │
│  Clicks Verify Link │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  App Opens via      │
│  Deep Link          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Extract Token      │
│  from URL           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Call Verify API    │
│  GET /verify-email/ │
│  {token}            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Show Success       │
│  Message            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Navigate to        │
│  Login Screen       │
└─────────────────────┘
```

### Email Verification API

**Endpoint:** `GET /api/users/verify-email/{token}`

**Description:** Verifies a user's email address using a token sent via email.

**URL Parameters:**
- `token`: The verification token from the email link (64-character hexadecimal string)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "message": "Email verified successfully. You can now log in."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to verify email",
  "error": "Invalid or expired verification token."
}
```

**Token Details:**
- Format: 32-byte hexadecimal string (64 characters)
- Expiration: 1 hour from registration
- One-time use: Token is deleted after successful verification
- Automatically triggers welcome email upon successful verification

### Implementation Steps

#### 1. Create Email Verification Service

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class EmailVerificationService {
  final String baseUrl;
  
  EmailVerificationService({required this.baseUrl});
  
  /// Verify email with token
  Future<VerificationResult> verifyEmail(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/users/verify-email/$token'),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return VerificationResult(
          success: true,
          message: data['data']['message'] ?? 'Email verified successfully',
        );
      } else {
        return VerificationResult(
          success: false,
          message: data['error'] ?? 'Failed to verify email',
        );
      }
    } on http.ClientException {
      return VerificationResult(
        success: false,
        message: 'Network error. Please check your connection.',
      );
    } catch (e) {
      return VerificationResult(
        success: false,
        message: 'An error occurred: ${e.toString()}',
      );
    }
  }
}

class VerificationResult {
  final bool success;
  final String message;
  
  VerificationResult({
    required this.success,
    required this.message,
  });
}
```

#### 2. Create Email Verification Screen

```dart
import 'package:flutter/material.dart';

class EmailVerificationScreen extends StatefulWidget {
  final String token;
  
  const EmailVerificationScreen({
    Key? key,
    required this.token,
  }) : super(key: key);
  
  @override
  State<EmailVerificationScreen> createState() => _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  final _service = EmailVerificationService(baseUrl: 'https://api.yourdomain.com');
  
  bool _isVerifying = true;
  bool _verificationSuccess = false;
  String _message = 'Verifying your email...';
  
  @override
  void initState() {
    super.initState();
    _verifyEmail();
  }
  
  Future<void> _verifyEmail() async {
    setState(() {
      _isVerifying = true;
      _message = 'Verifying your email...';
    });
    
    final result = await _service.verifyEmail(widget.token);
    
    setState(() {
      _isVerifying = false;
      _verificationSuccess = result.success;
      _message = result.message;
    });
    
    // Auto-navigate to login after success
    if (result.success) {
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil(
          '/login',
          (route) => false,
        );
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Email Verification'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_isVerifying) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                Text(
                  _message,
                  style: const TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ] else ...[
                Icon(
                  _verificationSuccess 
                      ? Icons.check_circle 
                      : Icons.error_outline,
                  size: 80,
                  color: _verificationSuccess ? Colors.green : Colors.red,
                ),
                const SizedBox(height: 24),
                Text(
                  _verificationSuccess 
                      ? 'Email Verified!' 
                      : 'Verification Failed',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  _message,
                  style: const TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                if (!_verificationSuccess) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pushNamedAndRemoveUntil(
                          '/login',
                          (route) => false,
                        );
                      },
                      child: const Text('Go to Login'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () {
                      // Navigate to resend verification email screen
                      Navigator.of(context).pushNamed('/resend-verification');
                    },
                    child: const Text('Resend Verification Email'),
                  ),
                ],
                if (_verificationSuccess) ...[
                  const SizedBox(height: 8),
                  const Text(
                    'Redirecting to login...',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## Password Reset Flow

### Complete Flow Diagram

```
┌─────────────────────┐
│  User Forgets       │
│  Password           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Enter Email        │
│  POST /request-     │
│  password-reset     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Email Sent with    │
│  Reset Link         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  User Opens Email   │
│  Clicks Reset Link  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  App Opens via      │
│  Deep Link          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Extract Token      │
│  from URL           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Verify Token       │
│  GET /verify-token/ │
│  {token}            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Show Password      │
│  Reset Form         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Submit New         │
│  Password           │
│  POST /reset-       │
│  password           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Show Success       │
│  Message            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Navigate to        │
│  Login Screen       │
└─────────────────────┘
```

### Password Reset APIs

#### 1. Request Password Reset

**Endpoint:** `POST /api/users/request-password-reset`

**Description:** Initiates the password reset process by sending a reset link to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

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

**Important Notes:**
- ⚠️ **Security Best Practice**: The API returns success even if the email doesn't exist (to prevent email enumeration attacks)
- Reset token is generated as a 32-byte hexadecimal string
- Token expires in **1 hour** from the request time
- Reset link format: `${CLIENT_URL}/reset-password/{token}`

#### 2. Verify Reset Token

**Endpoint:** `GET /api/users/verify-token/{token}`

**Description:** Checks if a password reset token is valid and has not expired.

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

#### 3. Reset Password

**Endpoint:** `POST /api/users/reset-password`

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

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to reset password",
  "error": "Invalid or expired reset token"
}
```

**Important Notes:**
- Token is **one-time use** - after successful reset, a new security token is generated
- Password is hashed using bcrypt before storage
- A success email is sent to the user with a security reset link
- User can immediately log in with the new password

### Implementation Steps

#### 1. Create Password Reset Service

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class PasswordResetService {
  final String baseUrl;
  
  PasswordResetService({required this.baseUrl});
  
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
        throw PasswordResetException(
          data['error'] ?? 'Failed to send reset email',
        );
      }
    } on http.ClientException {
      throw PasswordResetException(
        'Network error. Please check your connection.',
      );
    } catch (e) {
      if (e is PasswordResetException) rethrow;
      throw PasswordResetException('An error occurred: ${e.toString()}');
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
        throw PasswordResetException(
          data['error'] ?? 'Failed to reset password',
        );
      }
    } on http.ClientException {
      throw PasswordResetException(
        'Network error. Please check your connection.',
      );
    } catch (e) {
      if (e is PasswordResetException) rethrow;
      throw PasswordResetException('An error occurred: ${e.toString()}');
    }
  }
}

class PasswordResetException implements Exception {
  final String message;
  PasswordResetException(this.message);
  
  @override
  String toString() => message;
}
```

#### 2. Create Forgot Password Screen

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
  final _service = PasswordResetService(baseUrl: 'https://api.yourdomain.com');
  
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
    } on PasswordResetException catch (e) {
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
              const Icon(
                Icons.lock_reset,
                size: 80,
                color: Colors.blue,
              ),
              const SizedBox(height: 24),
              const Text(
                'Reset Your Password',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
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
                  prefixIcon: Icon(Icons.email),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error, color: Colors.red),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
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
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.mark_email_read,
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
              'We\'ve sent a password reset link to\n${_emailController.text}',
              style: const TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Please check your email and click the link to reset your password.',
              style: TextStyle(fontSize: 14, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushNamedAndRemoveUntil(
                    '/login',
                    (route) => false,
                  );
                },
                child: const Text('Back to Login'),
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                setState(() {
                  _emailSent = false;
                  _emailController.clear();
                });
              },
              child: const Text('Try another email'),
            ),
          ],
        ),
      ),
    );
  }
}
```

#### 3. Create Reset Password Screen

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
  final _service = PasswordResetService(baseUrl: 'https://api.yourdomain.com');
  
  bool _isLoading = false;
  bool _isVerifying = true;
  bool _tokenValid = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  String? _errorMessage;
  bool _resetSuccess = false;
  
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
    });
    
    try {
      await _service.resetPassword(
        token: widget.token,
        newPassword: _passwordController.text,
      );
      
      setState(() {
        _resetSuccess = true;
        _isLoading = false;
      });
      
      // Navigate to login after 2 seconds
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil(
          '/login',
          (route) => false,
        );
      }
    } on PasswordResetException catch (e) {
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
      return _buildInvalidTokenView();
    }
    
    if (_resetSuccess) {
      return _buildSuccessView();
    }
    
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 32),
              const Icon(
                Icons.lock_reset,
                size: 80,
                color: Colors.blue,
              ),
              const SizedBox(height: 24),
              const Text(
                'Create New Password',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Enter your new password below',
                style: TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextFormField(
                controller: _passwordController,
                obscureText: !_showPassword,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  hintText: 'Enter new password',
                  prefixIcon: const Icon(Icons.lock),
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
                  prefixIcon: const Icon(Icons.lock_outline),
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
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error, color: Colors.red),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Reset Password'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildInvalidTokenView() {
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
            const SizedBox(height: 8),
            const Text(
              'Password reset links are only valid for 1 hour.',
              style: TextStyle(fontSize: 14, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushNamed('/forgot-password');
                },
                child: const Text('Request New Reset Link'),
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                Navigator.of(context).pushNamedAndRemoveUntil(
                  '/login',
                  (route) => false,
                );
              },
              child: const Text('Back to Login'),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSuccessView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Password Reset'),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.check_circle,
              size: 80,
              color: Colors.green,
            ),
            const SizedBox(height: 24),
            const Text(
              'Password Reset Successful!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Your password has been successfully reset.',
              style: TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'You can now log in with your new password.',
              style: TextStyle(fontSize: 14, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            const Text(
              'Redirecting to login...',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## Deep Link Handler Implementation

### Complete Deep Link Service

```dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:uni_links/uni_links.dart';

class DeepLinkService {
  StreamSubscription? _linkSubscription;
  
  /// Initialize deep link handling
  Future<void> initialize(BuildContext context) async {
    // Handle initial link (when app is opened from link)
    await _handleInitialLink(context);
    
    // Listen for links when app is running
    _listenToLinks(context);
  }
  
  /// Handle the initial deep link when app is launched
  Future<void> _handleInitialLink(BuildContext context) async {
    try {
      final initialUri = await getInitialUri();
      if (initialUri != null) {
        // Delay to ensure navigation context is ready
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _handleDeepLink(context, initialUri);
        });
      }
    } catch (e) {
      print('Error handling initial link: $e');
    }
  }
  
  /// Listen for deep links when app is running
  void _listenToLinks(BuildContext context) {
    _linkSubscription = uriLinkStream.listen(
      (Uri? uri) {
        if (uri != null) {
          _handleDeepLink(context, uri);
        }
      },
      onError: (err) {
        print('Error listening to links: $err');
      },
    );
  }
  
  /// Handle deep link navigation
  void _handleDeepLink(BuildContext context, Uri uri) {
    print('Handling deep link: $uri');
    
    final path = uri.path;
    final segments = uri.pathSegments;
    
    // Email verification: /verify-email/{token}
    if (segments.length >= 2 && segments[0] == 'verify-email') {
      final token = segments[1];
      Navigator.of(context).pushNamed(
        '/verify-email',
        arguments: token,
      );
      return;
    }
    
    // Password reset: /reset-password/{token}
    if (segments.length >= 2 && segments[0] == 'reset-password') {
      final token = segments[1];
      Navigator.of(context).pushNamed(
        '/reset-password',
        arguments: token,
      );
      return;
    }
    
    // Package participant signing: /package/{packageId}/participant/{participantId}
    if (segments.length >= 4 && 
        segments[0] == 'package' && 
        segments[2] == 'participant') {
      final packageId = segments[1];
      final participantId = segments[3];
      
      // Check if it's a review link
      if (segments.length >= 5 && segments[4] == 'review') {
        Navigator.of(context).pushNamed(
          '/package-review',
          arguments: {
            'packageId': packageId,
            'participantId': participantId,
          },
        );
      } else {
        Navigator.of(context).pushNamed(
          '/package-signing',
          arguments: {
            'packageId': packageId,
            'participantId': participantId,
          },
        );
      }
      return;
    }
    
    print('Unhandled deep link: $uri');
  }
  
  /// Extract token from URL string
  String? extractToken(String url, String prefix) {
    try {
      final uri = Uri.parse(url);
      final segments = uri.pathSegments;
      
      if (segments.length >= 2 && segments[0] == prefix) {
        return segments[1];
      }
    } catch (e) {
      print('Error extracting token: $e');
    }
    return null;
  }
  
  /// Cancel link subscription
  void dispose() {
    _linkSubscription?.cancel();
  }
}
```

### Integration in Main App

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);
  
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final _deepLinkService = DeepLinkService();
  
  @override
  void initState() {
    super.initState();
    // Initialize deep link handling after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _deepLinkService.initialize(context);
    });
  }
  
  @override
  void dispose() {
    _deepLinkService.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'iSign App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      initialRoute: '/',
      onGenerateRoute: (settings) {
        // Handle routes with arguments
        switch (settings.name) {
          case '/verify-email':
            final token = settings.arguments as String;
            return MaterialPageRoute(
              builder: (context) => EmailVerificationScreen(token: token),
            );
            
          case '/reset-password':
            final token = settings.arguments as String;
            return MaterialPageRoute(
              builder: (context) => ResetPasswordScreen(token: token),
            );
            
          case '/forgot-password':
            return MaterialPageRoute(
              builder: (context) => const ForgotPasswordScreen(),
            );
            
          case '/login':
            return MaterialPageRoute(
              builder: (context) => const LoginScreen(),
            );
            
          case '/':
          default:
            return MaterialPageRoute(
              builder: (context) => const SplashScreen(),
            );
        }
      },
    );
  }
}
```

---

## API Integration

### API Client Setup

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final String baseUrl;
  final _storage = const FlutterSecureStorage();
  
  ApiClient({required this.baseUrl});
  
  /// Get auth token from secure storage
  Future<String?> _getToken() async {
    return await _storage.read(key: 'authToken');
  }
  
  /// Build headers for API requests
  Future<Map<String, String>> _buildHeaders({bool needsAuth = false}) async {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (needsAuth) {
      final token = await _getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    
    return headers;
  }
  
  /// Make GET request
  Future<http.Response> get(
    String endpoint, {
    bool needsAuth = false,
  }) async {
    final headers = await _buildHeaders(needsAuth: needsAuth);
    return await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
    );
  }
  
  /// Make POST request
  Future<http.Response> post(
    String endpoint,
    Map<String, dynamic> body, {
    bool needsAuth = false,
  }) async {
    final headers = await _buildHeaders(needsAuth: needsAuth);
    return await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
  }
}

/// Usage example
class AuthRepository {
  final ApiClient _apiClient;
  
  AuthRepository(this._apiClient);
  
  Future<void> verifyEmail(String token) async {
    final response = await _apiClient.get('/api/users/verify-email/$token');
    // Handle response...
  }
  
  Future<void> requestPasswordReset(String email) async {
    final response = await _apiClient.post(
      '/api/users/request-password-reset',
      {'email': email},
    );
    // Handle response...
  }
  
  Future<bool> verifyResetToken(String token) async {
    final response = await _apiClient.get('/api/users/verify-token/$token');
    final data = jsonDecode(response.body);
    return data['found'] == true;
  }
  
  Future<void> resetPassword(String token, String newPassword) async {
    final response = await _apiClient.post(
      '/api/users/reset-password',
      {
        'resetToken': token,
        'newPassword': newPassword,
      },
    );
    // Handle response...
  }
}
```

---

## UI Components

### Loading Indicator

```dart
class LoadingIndicator extends StatelessWidget {
  final String message;
  
  const LoadingIndicator({
    Key? key,
    this.message = 'Loading...',
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 16),
        Text(
          message,
          style: const TextStyle(fontSize: 16),
        ),
      ],
    );
  }
}
```

### Error Message Widget

```dart
class ErrorMessageWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  
  const ErrorMessageWidget({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.error, color: Colors.red),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            TextButton(
              onPressed: onRetry,
              child: const Text('Try Again'),
            ),
          ],
        ],
      ),
    );
  }
}
```

### Success Message Widget

```dart
class SuccessMessageWidget extends StatelessWidget {
  final String title;
  final String message;
  final IconData icon;
  
  const SuccessMessageWidget({
    Key? key,
    required this.title,
    required this.message,
    this.icon = Icons.check_circle,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          icon,
          size: 80,
          color: Colors.green,
        ),
        const SizedBox(height: 24),
        Text(
          title,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          message,
          style: const TextStyle(fontSize: 16),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
```

---

## Error Handling

### Common Error Scenarios

#### 1. Network Errors

```dart
Future<void> handleApiCall(Future<void> Function() apiCall) async {
  try {
    await apiCall();
  } on SocketException {
    throw AppException('No internet connection. Please check your network.');
  } on TimeoutException {
    throw AppException('Request timed out. Please try again.');
  } on http.ClientException {
    throw AppException('Network error. Please try again.');
  } catch (e) {
    throw AppException('An error occurred: ${e.toString()}');
  }
}
```

#### 2. Token Validation Errors

```dart
Future<void> verifyTokenOrShowError(String token) async {
  final isValid = await _service.verifyToken(token);
  
  if (!isValid) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Invalid Link'),
        content: const Text(
          'This link is invalid or has expired. Please request a new one.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/forgot-password');
            },
            child: const Text('Request New Link'),
          ),
        ],
      ),
    );
  }
}
```

#### 3. Password Validation Errors

```dart
String? validatePassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'Please enter a password';
  }
  if (value.length < 6) {
    return 'Password must be at least 6 characters';
  }
  // Add more validation as needed
  return null;
}

String? validateConfirmPassword(String? value, String password) {
  if (value == null || value.isEmpty) {
    return 'Please confirm your password';
  }
  if (value != password) {
    return 'Passwords do not match';
  }
  return null;
}
```

### Global Error Handler

```dart
class AppException implements Exception {
  final String message;
  AppException(this.message);
  
  @override
  String toString() => message;
}

class ErrorHandler {
  static String getErrorMessage(dynamic error) {
    if (error is AppException) {
      return error.message;
    }
    
    final errorString = error.toString().toLowerCase();
    
    if (errorString.contains('socket') || errorString.contains('network')) {
      return 'Network error. Please check your connection.';
    }
    
    if (errorString.contains('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (errorString.contains('invalid') || errorString.contains('expired')) {
      return 'Invalid or expired link.';
    }
    
    return 'An error occurred. Please try again.';
  }
  
  static void showErrorSnackBar(BuildContext context, dynamic error) {
    final message = getErrorMessage(error);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        action: SnackBarAction(
          label: 'Dismiss',
          textColor: Colors.white,
          onPressed: () {},
        ),
      ),
    );
  }
}
```

---

## Security Considerations

### 1. Token Security

✅ **Best Practices:**
- Tokens are 64-character hexadecimal strings (32 bytes)
- Email verification tokens expire after 1 hour
- Password reset tokens expire after 1 hour
- Tokens are one-time use (deleted/replaced after use)
- Tokens are securely generated on the server

⚠️ **Never:**
- Store tokens in plain text
- Share tokens in logs or error messages
- Reuse expired tokens
- Expose token generation logic

### 2. Secure Storage

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final _storage = const FlutterSecureStorage();
  
  Future<void> saveAuthToken(String token) async {
    await _storage.write(key: 'authToken', value: token);
  }
  
  Future<String?> getAuthToken() async {
    return await _storage.read(key: 'authToken');
  }
  
  Future<void> deleteAuthToken() async {
    await _storage.delete(key: 'authToken');
  }
  
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
```

### 3. HTTPS Only

```dart
class ApiClient {
  final String baseUrl;
  
  ApiClient({required String baseUrl}) 
      : assert(baseUrl.startsWith('https://'), 'API URL must use HTTPS'),
        baseUrl = baseUrl;
}
```

### 4. Input Validation

```dart
class Validators {
  static final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
  static final passwordMinLength = 6;
  
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }
  
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < passwordMinLength) {
      return 'Password must be at least $passwordMinLength characters';
    }
    return null;
  }
}
```

### 5. Sensitive Data Handling

```dart
// ✅ Good: Clear sensitive data after use
void dispose() {
  _passwordController.dispose();
  _confirmPasswordController.dispose();
  super.dispose();
}

// ⚠️ Never: Log sensitive data
// print('Password: $password'); // DON'T DO THIS

// ✅ Good: Generic error messages to users
catch (e) {
  print('Error: $e'); // Log for debugging
  showError('An error occurred. Please try again.'); // Show to user
}
```

### 6. Deep Link Validation

```dart
bool isValidToken(String? token) {
  // Token should be 64-character hexadecimal string
  if (token == null || token.length != 64) {
    return false;
  }
  
  // Check if it's a valid hex string
  final hexRegex = RegExp(r'^[0-9a-fA-F]+$');
  return hexRegex.hasMatch(token);
}

void _handleDeepLink(BuildContext context, Uri uri) {
  final segments = uri.pathSegments;
  
  if (segments.length >= 2) {
    final token = segments[1];
    
    // Validate token format before processing
    if (!isValidToken(token)) {
      showErrorDialog(context, 'Invalid link format');
      return;
    }
    
    // Process valid token...
  }
}
```

---

## Testing Checklist

### Email Verification Testing

- [ ] **Cold Start (App Closed)**
  - [ ] Click email verification link
  - [ ] App opens and navigates to verification screen
  - [ ] Token is extracted correctly
  - [ ] Verification API is called
  - [ ] Success message displayed
  - [ ] Navigates to login screen

- [ ] **Warm Start (App Running)**
  - [ ] Click email verification link
  - [ ] App comes to foreground
  - [ ] Navigates to verification screen
  - [ ] Verification completes successfully

- [ ] **Token Validation**
  - [ ] Valid token verifies successfully
  - [ ] Expired token shows error message
  - [ ] Invalid token shows error message
  - [ ] Used token shows error message

- [ ] **Error Handling**
  - [ ] Network error handled gracefully
  - [ ] Timeout handled gracefully
  - [ ] Server error (500) handled gracefully
  - [ ] Can retry after error

- [ ] **UI/UX**
  - [ ] Loading indicator shown during verification
  - [ ] Success icon and message displayed
  - [ ] Error icon and message displayed
  - [ ] Auto-navigation to login after success
  - [ ] Option to go to login on error

### Password Reset Testing

- [ ] **Request Reset**
  - [ ] Valid email sends request successfully
  - [ ] Invalid email format shows validation error
  - [ ] Empty email shows validation error
  - [ ] Success message always displayed (security)
  - [ ] Loading state shown during request

- [ ] **Deep Link Handling**
  - [ ] Reset link opens app (cold start)
  - [ ] Reset link opens app (warm start)
  - [ ] Token extracted correctly
  - [ ] Token verification called automatically

- [ ] **Token Verification**
  - [ ] Valid token allows password reset
  - [ ] Expired token shows error screen
  - [ ] Invalid token shows error screen
  - [ ] Option to request new link on error

- [ ] **Password Reset Form**
  - [ ] Password minimum length validation (6 chars)
  - [ ] Password confirmation match validation
  - [ ] Password visibility toggle works
  - [ ] Loading state shown during submission
  - [ ] Success message displayed

- [ ] **Post-Reset**
  - [ ] Success message shown
  - [ ] Auto-navigation to login
  - [ ] Can login with new password
  - [ ] Old password no longer works
  - [ ] Security email received

- [ ] **Error Handling**
  - [ ] Network error handled
  - [ ] Invalid token handled
  - [ ] Server error handled
  - [ ] Validation errors displayed

### Platform-Specific Testing

#### Android
- [ ] Universal links work (https://)
- [ ] Custom scheme works (com.isign.app://)
- [ ] Deep links work from Gmail app
- [ ] Deep links work from other email apps
- [ ] App verification (assetlinks.json) works
- [ ] Link opens app if installed
- [ ] Link opens browser if app not installed

#### iOS
- [ ] Universal links work (https://)
- [ ] Custom scheme works (com.isign.app://)
- [ ] Deep links work from Mail app
- [ ] Deep links work from other email apps
- [ ] Associated domains configured correctly
- [ ] Link opens app if installed
- [ ] Link opens Safari if app not installed

### Edge Cases

- [ ] Multiple rapid link clicks
- [ ] App killed during verification
- [ ] Network interruption during request
- [ ] Token with special characters
- [ ] Very long token string
- [ ] Empty token string
- [ ] Malformed URL
- [ ] Wrong domain in URL
- [ ] User presses back during verification
- [ ] User closes app during verification

---

## Troubleshooting

### Issue: Deep Link Not Opening App

**Possible Causes:**
1. AndroidManifest.xml or Info.plist not configured correctly
2. assetlinks.json or apple-app-site-association not accessible
3. Wrong URL scheme or domain
4. App not installed

**Solutions:**

**Android:**
```bash
# Test deep link with adb
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://yourdomain.com/verify-email/abc123" \
  com.isign.app

# Check if assetlinks.json is accessible
curl https://yourdomain.com/.well-known/assetlinks.json

# Verify app links
adb shell pm get-app-links com.isign.app
```

**iOS:**
```bash
# Check if apple-app-site-association is accessible
curl https://yourdomain.com/.well-known/apple-app-site-association

# Test with Safari (open in iOS Simulator)
xcrun simctl openurl booted "https://yourdomain.com/verify-email/abc123"
```

### Issue: Token Verification Always Fails

**Possible Causes:**
1. Token not extracted correctly from URL
2. Token format incorrect
3. API endpoint wrong
4. Token expired
5. Network issues

**Solutions:**
```dart
// Add logging to debug token extraction
void _handleDeepLink(BuildContext context, Uri uri) {
  print('Full URI: $uri');
  print('Path: ${uri.path}');
  print('Segments: ${uri.pathSegments}');
  
  if (uri.pathSegments.length >= 2) {
    final token = uri.pathSegments[1];
    print('Extracted token: $token');
    print('Token length: ${token.length}');
    
    // Verify token format
    if (token.length != 64) {
      print('WARNING: Token length is not 64 characters');
    }
  }
}
```

### Issue: Email Not Received

**Possible Causes:**
1. Email in spam folder
2. Email service not configured on server
3. Invalid email address
4. Email quota exceeded

**Solutions:**
1. Check spam/junk folder
2. Verify email service configuration on backend
3. Check email address is correct
4. Contact backend team to check email logs

### Issue: App Crashes on Deep Link

**Possible Causes:**
1. Null safety issues
2. Navigation context not ready
3. Missing route definition
4. Exception not handled

**Solutions:**
```dart
// Add try-catch to deep link handler
void _handleDeepLink(BuildContext context, Uri uri) {
  try {
    // Your deep link handling code
  } catch (e, stackTrace) {
    print('Error handling deep link: $e');
    print('Stack trace: $stackTrace');
    
    // Show user-friendly error
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: const Text('Failed to process link. Please try again.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
```

### Issue: Password Reset Fails After Verification

**Possible Causes:**
1. Token already used
2. Token expired between verification and reset
3. Password doesn't meet requirements
4. Network interruption

**Solutions:**
```dart
// Handle specific error cases
try {
  await _service.resetPassword(token: token, newPassword: password);
} on PasswordResetException catch (e) {
  if (e.message.contains('Invalid or expired')) {
    showError('This reset link has already been used or has expired. Please request a new one.');
  } else if (e.message.contains('password')) {
    showError('Password does not meet requirements.');
  } else {
    showError(e.message);
  }
}
```

### Debug Mode

Enable debug mode to see detailed logs:

```dart
class Config {
  static const bool debugDeepLinks = true; // Set to true for debugging
}

class DeepLinkService {
  void _log(String message) {
    if (Config.debugDeepLinks) {
      print('[DeepLink] $message');
    }
  }
  
  void _handleDeepLink(BuildContext context, Uri uri) {
    _log('Received URI: $uri');
    _log('Host: ${uri.host}');
    _log('Path: ${uri.path}');
    _log('Segments: ${uri.pathSegments}');
    
    // Rest of your code...
  }
}
```

---

## Conclusion

This guide provides comprehensive coverage of implementing email verification and password reset functionality in your Flutter mobile app using deep linking. The implementation includes:

✅ Secure token-based verification  
✅ Universal link support (iOS & Android)  
✅ Comprehensive error handling  
✅ User-friendly UI components  
✅ Security best practices  
✅ Testing guidelines  
✅ Troubleshooting tips  

### Key Takeaways

1. **Deep linking** allows seamless email verification and password reset from email links
2. **Token security** is critical - tokens expire, are one-time use, and securely stored
3. **Error handling** provides a smooth user experience even when things go wrong
4. **Platform-specific configuration** is required for both Android and iOS
5. **Testing** is essential to ensure deep links work correctly in all scenarios

### Next Steps

1. Implement the deep link service and integrate with your app
2. Configure Android and iOS platform files
3. Set up server-side verification files (see [DEEP_LINKING_SERVER_SETUP_GUIDE.md](./DEEP_LINKING_SERVER_SETUP_GUIDE.md))
4. Test on both Android and iOS devices
5. Test with different email clients
6. Deploy to production

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or contact the development team.

---

**End of Document**


