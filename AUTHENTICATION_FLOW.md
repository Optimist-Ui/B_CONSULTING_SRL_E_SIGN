# Authentication Flow - Registration & Login API Documentation

This document describes the complete authentication system including registration, login, email verification, and password reset flows. Use this guide to implement authentication in your Flutter application.

## Table of Contents
1. [Overview](#overview)
2. [Registration Flow](#registration-flow)
3. [Email Verification](#email-verification)
4. [Login Flow](#login-flow)
5. [Password Reset Flow](#password-reset-flow)
6. [Account Management](#account-management)
7. [API Endpoints](#api-endpoints)
8. [Token Management](#token-management)
9. [Error Handling](#error-handling)
10. [Important Notes for Flutter Development](#important-notes-for-flutter-development)

---

## Overview

The authentication system uses:
- **JWT (JSON Web Tokens)** for session management
- **Email verification** required before login
- **Password hashing** with bcrypt
- **Token-based authentication** for protected routes

**Key Concepts:**
- Users must verify their email before logging in
- Tokens expire after 24 hours
- All authenticated requests require a Bearer token in the Authorization header
- Password reset uses time-limited tokens (1 hour)

---

## Registration Flow

### Step-by-Step Process

1. User submits registration form
2. System validates input
3. System checks if email already exists
4. Password is hashed and stored
5. Verification token is generated and sent via email
6. User receives email with verification link
7. User clicks link to verify email
8. User can now log in

### Important Notes

**⚠️ Registration does NOT return a token** - User must verify email first!

If a user with the same email exists but is not verified:
- Old unverified account is deleted
- New account is created
- New verification email is sent

---

## Email Verification

### Verification Process

1. User receives email with verification link
2. Link format: `${CLIENT_URL}/verify-email/{token}`
3. User clicks link or app opens the link
4. App calls verification endpoint
5. If token is valid, account is marked as verified
6. Welcome email is automatically sent
7. User can now log in

### Token Details
- **Format**: 32-byte hexadecimal string
- **Expiration**: 1 hour from registration
- **One-time use**: Token is deleted after successful verification

---

## Login Flow

### Step-by-Step Process

1. User enters email and password
2. System validates input format
3. System checks if user exists
4. **GATEKEEPER Check**: User must be verified (`isVerified: true`)
5. **GATEKEEPER Check**: User must not be deactivated (`isDeactivated: false`)
6. System verifies password
7. JWT token is generated and returned
8. User can now access protected routes

### Login Requirements

**User must have:**
- ✅ Verified email (`isVerified: true`)
- ✅ Active account (`isDeactivated: false`)
- ✅ Correct password

**If email is not verified:**
```
Error: "Account not verified. Please check your email for the verification link."
```

**If account is deactivated:**
```
Error: "Account is deactivated. Check your email for reactivation instructions."
```

---

## Password Reset Flow

### Step-by-Step Process

1. User clicks "Forgot Password"
2. User enters email address
3. System generates reset token (expires in 1 hour)
4. Reset link is sent to email
5. User clicks link
6. User enters new password
7. Password is updated
8. Success email is sent with security reset link
9. User can log in with new password

### Reset Token Details
- **Format**: 32-byte hexadecimal string
- **Expiration**: 1 hour from request
- **One-time use**: Token is replaced after password reset

---

## Account Management

### Account Deactivation
- User can request account deletion
- Account is marked as `isDeactivated: true`
- Reactivation link sent (valid for 14 days)
- Account is permanently deleted after 14 days if not reactivated
- Subscription is maintained during grace period

### Email Change Flow
1. User requests email change
2. 6-digit OTP sent to CURRENT email
3. User enters OTP
4. Email is updated
5. Confirmation sent to new email
6. Notification sent to old email

---

## API Endpoints

### Base URL
All authentication endpoints are under: `/api/users`

---

### 1. Register User

**POST** `/api/users/signup`

**Public Endpoint** - No authentication required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `firstName`: Required, non-empty string
- `lastName`: Required, non-empty string
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

**Error Responses:**

**409 Conflict** - Email already exists (and verified):
```json
{
  "success": false,
  "message": "Failed to create user",
  "error": "An account with this email already exists."
}
```

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "message": "Failed to create user",
  "error": "First name is required"
}
```

---

### 2. Verify Email

**GET** `/api/users/verify-email/{token}`

**Public Endpoint** - No authentication required

**URL Parameters:**
- `token`: The verification token from email link

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

**Important:**
- Token expires after 1 hour
- After successful verification, welcome email is sent automatically
- User can now log in

---

### 3. Login

**POST** `/api/users/login`

**Public Endpoint** - No authentication required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required, non-empty string

**Success Response (200):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "_id": "userId123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "isVerified": true,
      "isDeactivated": false,
      "subscription": { /* subscription data */ },
      "profileImage": "https://...",
      /* Other user fields (password NOT included) */
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

**401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "message": "Failed to log in",
  "error": "Invalid email or password"
}
```

**401 Unauthorized** - Email not verified:
```json
{
  "success": false,
  "message": "Failed to log in",
  "error": "Account not verified. Please check your email for the verification link."
}
```

**401 Unauthorized** - Account deactivated:
```json
{
  "success": false,
  "message": "Failed to log in",
  "error": "Account is deactivated. Check your email for reactivation instructions."
}
```

---

### 4. Request Password Reset

**POST** `/api/users/request-password-reset`

**Public Endpoint** - No authentication required

**Request Body:**
```json
{
  "email": "john@example.com"
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

**Note:** Returns success even if email doesn't exist (security best practice)

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to send password reset email",
  "error": "Valid email is required"
}
```

---

### 5. Verify Reset Token

**GET** `/api/users/verify-token/{token}`

**Public Endpoint** - No authentication required

**URL Parameters:**
- `token`: The reset token from email link

**Success Response (200):**
```json
{
  "found": true
}
```

**Error Response (200):**
```json
{
  "found": false
}
```

**Use this to:**
- Check if reset token is valid before showing password reset form
- Verify token hasn't expired

---

### 6. Reset Password

**POST** `/api/users/reset-password`

**Public Endpoint** - No authentication required

**Request Body:**
```json
{
  "resetToken": "tokenFromEmail",
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

---

### 7. Get User Profile

**GET** `/api/users/profile`

**Protected Endpoint** - Requires authentication

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": {
    "_id": "userId123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "language": "en",
    "profileImage": "https://...",
    "profileImageUrl": "https://signed-url...",
    "isVerified": true,
    "subscription": { /* subscription data */ }
    /* Other user fields (password NOT included) */
  }
}
```

---

### 8. Update User Profile

**PUT** `/api/users/profile`

**Protected Endpoint** - Requires authentication

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data (if uploading image)
```

**Request Body (Form Data):**
```
firstName: "John"
lastName: "Doe"
phone: "+1234567890"
language: "en"
profileImage: (optional file upload)
```

**Note:** Email cannot be changed via profile update. Use email change flow instead.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* Updated user object */ }
}
```

---

### 9. Change Password

**PUT** `/api/users/password`

**Protected Endpoint** - Requires authentication

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Validation Rules:**
- `currentPassword`: Required, must match user's current password
- `newPassword`: Required, minimum 6 characters, must be different from current

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Your password has been changed successfully."
  }
}
```

**Error Responses:**

**401 Unauthorized** - Wrong current password:
```json
{
  "success": false,
  "message": "Failed to change password",
  "error": "The current password you entered is incorrect."
}
```

**400 Bad Request** - Same password:
```json
{
  "success": false,
  "message": "Failed to change password",
  "error": "The new password cannot be the same as the old one."
}
```

---

### 10. Request Email Change

**POST** `/api/users/request-email-change`

**Protected Endpoint** - Requires authentication

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "newEmail": "newemail@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your current email",
  "data": {
    "message": "OTP sent to your current email address.",
    "currentEmail": "oldemail@example.com"
  }
}
```

**Error Responses:**

**400 Bad Request** - Email already in use:
```json
{
  "success": false,
  "message": "Failed to send OTP",
  "error": "This email is already in use by another account."
}
```

**400 Bad Request** - Same email:
```json
{
  "success": false,
  "message": "Failed to send OTP",
  "error": "This is already your current email address."
}
```

---

### 11. Verify Email Change

**POST** `/api/users/verify-email-change`

**Protected Endpoint** - Requires authentication

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "otp": "123456",
  "newEmail": "newemail@example.com"
}
```

**Validation Rules:**
- `otp`: Required, 6 digits, numeric only
- `newEmail`: Required, valid email format, must match requested email

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email updated successfully",
  "data": { /* Updated user object */ }
}
```

**Error Responses:**

**400 Bad Request** - Invalid OTP:
```json
{
  "success": false,
  "message": "Failed to update email",
  "error": "Invalid OTP. You have 4 attempt(s) remaining."
}
```

**400 Bad Request** - Expired OTP:
```json
{
  "success": false,
  "message": "Failed to update email",
  "error": "OTP has expired. Please request a new one."
}
```

**400 Bad Request** - Max attempts:
```json
{
  "success": false,
  "message": "Failed to update email",
  "error": "Too many failed attempts. Please request a new OTP."
}
```

**OTP Details:**
- 6-digit numeric code
- Expires in 5 minutes
- Maximum 5 incorrect attempts allowed

---

### 12. Delete Account

**POST** `/api/users/delete-account`

**Protected Endpoint** - Requires authentication

**Headers:**
```
Authorization: Bearer {token}
```

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

**Notes:**
- Account is marked as deactivated (not deleted immediately)
- Reactivation link sent (valid for 14 days)
- Subscription maintained during grace period
- Permanent deletion after 14 days if not reactivated

---

### 13. Reactivate Account

**GET** `/api/users/reactivate/{token}`

**Public Endpoint** - No authentication required

**URL Parameters:**
- `token`: The reactivation token from email link

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

**Token Details:**
- Valid for 14 days from deactivation
- One-time use

---

## Token Management

### JWT Token Details

**Format:**
```
Bearer {token}
```

**Token Contents:**
```json
{
  "id": "userId123",
  "email": "john@example.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Properties:**
- **Expiration**: 24 hours from generation
- **Algorithm**: HS256 (HMAC SHA-256)
- **Secret**: Stored in `JWT_SECRET` environment variable

### Using Tokens

**For Protected Endpoints:**
Add to request headers:
```
Authorization: Bearer {token}
```

**Token Storage:**
- Store token securely (Flutter: `flutter_secure_storage` or similar)
- Do NOT store in plain text or SharedPreferences without encryption
- Clear token on logout

**Token Refresh:**
- Tokens expire after 24 hours
- User must log in again to get new token
- No automatic refresh endpoint

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Descriptive message",
  "error": "Specific error details"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Validation error or invalid input
- **401 Unauthorized**: Missing/invalid token or credentials
- **403 Forbidden**: Valid token but insufficient permissions
- **409 Conflict**: Resource already exists (duplicate email)
- **500 Internal Server Error**: Server error

### Error Handling Best Practices

1. **Always check `success` field** in response
2. **Display user-friendly messages** from `error` field
3. **Handle network errors** gracefully
4. **Validate input** before sending requests
5. **Show loading states** during API calls
6. **Handle token expiration** by redirecting to login

---

## Important Notes for Flutter Development

### 1. Registration Flow

**Steps:**
1. Collect user input (firstName, lastName, email, password)
2. Validate input (client-side validation)
3. Call `/api/users/signup`
4. **Do NOT expect token in response**
5. Show success message
6. Redirect to "Pending Verification" or "Check Email" screen
7. Prompt user to check email

**Important:**
- Registration does NOT return auth token
- User cannot log in until email is verified
- Show clear instructions to check email

### 2. Email Verification

**Handling Verification Links:**

**Option A: Deep Link Handling**
1. Register deep link handler: `yourapp://verify-email/{token}`
2. When link is opened, extract token
3. Call `GET /api/users/verify-email/{token}`
4. Show success/error message
5. Redirect to login screen

**Option B: Universal Link/App Link**
1. Register universal link: `https://yourdomain.com/verify-email/{token}`
2. App opens automatically when link is clicked
3. Extract token from URL
4. Call verification endpoint
5. Show result

**Implementation:**
```dart
// Extract token from URL
String? token = extractTokenFromUrl(url);
if (token != null) {
  // Call API
  await verifyEmail(token);
}
```

### 3. Login Implementation

**Steps:**
1. Collect email and password
2. Validate input
3. Call `POST /api/users/login`
4. **On success:**
   - Extract `token` from `data.token`
   - Extract `user` from `data.user`
   - Store token securely
   - Store user ID for future use
   - Navigate to main app screen

**Token Storage:**
```dart
// Use secure storage
await secureStorage.write(key: 'authToken', value: token);
await secureStorage.write(key: 'userId', value: user._id);
```

**Error Handling:**
- Check for "Account not verified" - redirect to verification screen
- Check for "Account deactivated" - show reactivation message
- Check for "Invalid credentials" - show error message

### 4. Protected API Calls

**Add Authorization Header:**
```dart
final token = await secureStorage.read(key: 'authToken');
headers['Authorization'] = 'Bearer $token';
```

**Handle Token Expiration:**
```dart
if (response.statusCode == 401) {
  // Token expired or invalid
  // Clear stored token
  await secureStorage.delete(key: 'authToken');
  // Redirect to login
  Navigator.pushReplacementNamed(context, '/login');
}
```

### 5. Password Reset Flow

**Steps:**
1. User enters email on "Forgot Password" screen
2. Call `POST /api/users/request-password-reset`
3. Show success message (always show success for security)
4. Handle reset link (similar to verification link)
5. Extract token from URL
6. Optionally verify token with `GET /api/users/verify-token/{token}`
7. Show password reset form
8. Call `POST /api/users/reset-password` with token and new password
9. Show success message
10. Redirect to login

### 6. State Management

**Recommended State to Track:**
- `isAuthenticated`: Boolean
- `authToken`: String?
- `currentUser`: User object?
- `isLoading`: Boolean
- `error`: String?

**Example State Model:**
```dart
class AuthState {
  final bool isAuthenticated;
  final String? token;
  final User? user;
  final bool isLoading;
  final String? error;
}
```

### 7. Persistent Login

**On App Launch:**
1. Check if token exists in secure storage
2. Optionally validate token with server (if you add validation endpoint)
3. If token exists and valid, set `isAuthenticated = true`
4. Load user profile if needed
5. Navigate to appropriate screen

**Token Validation:**
You can validate token by making a protected API call (e.g., get profile):
```dart
try {
  final user = await getUserProfile();
  // Token is valid
  setAuthenticated(user);
} catch (e) {
  // Token invalid
  clearAuthState();
  navigateToLogin();
}
```

### 8. Input Validation

**Client-Side Validation:**
```dart
// Email validation
bool isValidEmail(String email) {
  return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
}

// Password validation
bool isValidPassword(String password) {
  return password.length >= 6;
}
```

**Show validation errors before API call:**
- Better user experience
- Reduces unnecessary API calls
- Follows same rules as server validation

### 9. Email Verification Status

**Check if user is verified:**
- After login, check `user.isVerified`
- If false, show verification prompt
- Allow resending verification email (if endpoint available)

### 10. Error Messages

**User-Friendly Error Messages:**
```dart
String getErrorMessage(dynamic error) {
  final errorString = error.toString().toLowerCase();
  
  if (errorString.contains('not verified')) {
    return 'Please verify your email before logging in.';
  } else if (errorString.contains('deactivated')) {
    return 'Your account is deactivated. Check your email for reactivation link.';
  } else if (errorString.contains('invalid') || errorString.contains('incorrect')) {
    return 'Invalid email or password. Please try again.';
  } else {
    return 'An error occurred. Please try again.';
  }
}
```

### 11. Security Best Practices

1. **Never store password in plain text**
2. **Use secure storage for tokens** (`flutter_secure_storage`)
3. **Clear sensitive data on logout**
4. **Validate input before sending**
5. **Handle errors gracefully without exposing system details**
6. **Use HTTPS only** for API calls
7. **Implement certificate pinning** (production)

### 12. Logout Implementation

**Steps:**
1. Clear stored token
2. Clear user data
3. Set `isAuthenticated = false`
4. Navigate to login screen

```dart
Future<void> logout() async {
  await secureStorage.delete(key: 'authToken');
  await secureStorage.delete(key: 'userId');
  // Clear state
  setAuthenticated(false, null);
  // Navigate
  Navigator.pushReplacementNamed(context, '/login');
}
```

### 13. Testing Checklist

- [ ] Register new user
- [ ] Register with existing email (verified)
- [ ] Register with existing email (unverified)
- [ ] Verify email with valid token
- [ ] Verify email with expired token
- [ ] Verify email with invalid token
- [ ] Login with verified account
- [ ] Login with unverified account
- [ ] Login with wrong password
- [ ] Login with deactivated account
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Get profile with valid token
- [ ] Get profile with invalid token
- [ ] Get profile with expired token
- [ ] Update profile
- [ ] Change password
- [ ] Change password with wrong current password
- [ ] Logout and clear state

### 14. API Base Configuration

**Base URL:**
```dart
const String baseUrl = 'https://your-api-domain.com';
```

**API Client Setup:**
```dart
class ApiClient {
  final Dio dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  ));

  // Add interceptor for auth token
  void setupInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await secureStorage.read(key: 'authToken');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            // Handle token expiration
          }
          return handler.next(error);
        },
      ),
    );
  }
}
```

---

## Summary

### Registration → Verification → Login Flow

1. **Register** → User creates account → Email sent
2. **Verify** → User clicks email link → Account verified
3. **Login** → User logs in → Token received
4. **Use Token** → Token added to requests → Access protected resources

### Key Points

- ✅ Email verification is **required** before login
- ✅ Tokens expire after **24 hours**
- ✅ Protected endpoints require **Bearer token**
- ✅ Password reset tokens expire in **1 hour**
- ✅ Account deactivation has **14-day grace period**
- ✅ Email changes require **OTP verification**

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation message",
  "data": { /* response data */ }
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
2. Verify token format: `Bearer {token}`
3. Confirm email verification status
4. Check account deactivation status
5. Validate input format before sending
6. Ensure secure token storage

