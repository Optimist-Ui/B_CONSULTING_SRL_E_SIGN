# Flutter Profile Settings & Language Support Guide

Complete documentation for implementing profile settings update and language selection in Flutter. This guide covers all features used in the web application.

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**For:** Flutter App Development

## Table of Contents

1. [Overview](#overview)
2. [Profile Update Flow](#profile-update-flow)
3. [API Endpoints](#api-endpoints)
4. [Supported Languages](#supported-languages)
5. [Data Models](#data-models)
6. [Complete Implementation Flow](#complete-implementation-flow)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Overview

The profile settings system allows users to:
1. **Update Profile Information**: First name, last name, phone number
2. **Change Language**: Select from supported languages
3. **Upload Profile Image**: Upload and manage profile pictures
4. **View Profile**: Get current user profile information

### Key Concepts

- **Profile Update**: Updates user's personal information (name, phone, language, image)
- **Language Selection**: Changes the application language preference
- **Profile Image**: User's avatar stored in S3 cloud storage
- **Email Update**: Separate flow (not part of profile update - requires OTP verification)

### Important Notes

- **Email cannot be updated** through profile update endpoint
- Email changes require a separate OTP verification flow
- Profile image is uploaded to S3 and old images are automatically deleted
- Language preference is stored in user profile and affects app localization

---

## Profile Update Flow

### Step 1: Get Current User Profile

Before updating, fetch the current user profile to populate the form.

**API Endpoint:**
```
GET /api/users/profile
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
    "_id": "userId123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "language": "en",
    "profileImage": "/public/uploads/avatars/...",
    "profileImageUrl": "https://s3.../signed-url?expires=...",
    "s3Key": "avatars/user123/uuid-123-456.jpg",
    "isVerified": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Implementation:**
```dart
Future<UserProfile> getUserProfile() async {
  final response = await api.get(
    '/api/users/profile',
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
    ),
  );
  return UserProfile.fromJson(response.data['data']);
}
```

---

### Step 2: Update Profile

**API Endpoint:**
```
PUT /api/users/profile
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
firstName: "John"
lastName: "Doe"
phone: "+1234567890"
language: "en"
email: "john@example.com"  // Required but cannot be changed
profileImage: [File] (optional)
```

**Important:**
- `email` is **required** in the request but **cannot be changed** through this endpoint
- If you try to change email, the API will return an error
- `profileImage` is optional - only include if user is uploading a new image
- All other fields are optional but at least one should be provided

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "userId123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "language": "en",
    "profileImage": "/public/uploads/avatars/...",
    "profileImageUrl": "https://s3.../signed-url?expires=...",
    "s3Key": "avatars/user123/uuid-123-456.jpg",
    "isVerified": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Implementation:**
```dart
Future<UserProfile> updateProfile({
  required String firstName,
  required String lastName,
  String? phone,
  required String language,
  required String email, // Required but cannot be changed
  File? profileImage,
}) async {
  final formData = FormData.fromMap({
    'firstName': firstName,
    'lastName': lastName,
    'phone': phone ?? '',
    'language': language,
    'email': email, // Must match current email
    if (profileImage != null)
      'profileImage': await MultipartFile.fromFile(
        profileImage.path,
        filename: profileImage.path.split('/').last,
      ),
  });

  final response = await api.put(
    '/api/users/profile',
    formData,
    options: Options(
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'multipart/form-data',
      },
    ),
  );

  return UserProfile.fromJson(response.data['data']);
}
```

---

### Step 3: Handle Profile Image

**Image Requirements:**
- **Formats**: JPG, JPEG, PNG, GIF
- **Max Size**: 5MB
- **Field Name**: `profileImage` (in FormData)

**Image Upload Process:**
1. User selects image from device
2. Validate image format and size
3. Include in FormData when updating profile
4. Server uploads to S3
5. Old profile image is automatically deleted from S3
6. New image URL is returned in response

**Implementation:**
```dart
Future<void> updateProfileWithImage({
  required String firstName,
  required String lastName,
  String? phone,
  required String language,
  required String email,
  required File imageFile,
}) async {
  // Validate image
  final fileSize = await imageFile.length();
  if (fileSize > 5 * 1024 * 1024) {
    throw Exception('Image size must be less than 5MB');
  }

  // Check file extension
  final extension = imageFile.path.split('.').last.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'gif'].contains(extension)) {
    throw Exception('Only JPG, JPEG, PNG, and GIF images are allowed');
  }

  // Update profile with image
  await updateProfile(
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    language: language,
    email: email,
    profileImage: imageFile,
  );
}
```

---

## API Endpoints

### Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get current user profile | Yes |
| PUT | `/api/users/profile` | Update user profile | Yes |

### Request/Response Format

**Get Profile:**
```
GET /api/users/profile
Authorization: Bearer {token}
```

**Update Profile:**
```
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
  firstName: string (required)
  lastName: string (required)
  phone: string (optional)
  language: string (required)
  email: string (required, but cannot be changed)
  profileImage: File (optional)
```

---

## Supported Languages

### Total Languages: 17

The system supports **17 languages** for localization. However, the profile form currently shows **6 languages** in the dropdown. You can implement all 17 languages in your Flutter app.

### Complete Language List

| Code | Language Name | Native Name |
|------|---------------|-------------|
| `ae` | Arabic | العربية |
| `da` | Danish | Dansk |
| `de` | German | Deutsch |
| `el` | Greek | Ελληνικά |
| `en` | English | English |
| `es` | Spanish | Español |
| `fr` | French | Français |
| `hu` | Hungarian | Magyar |
| `it` | Italian | Italiano |
| `ja` | Japanese | 日本語 |
| `pl` | Polish | Polski |
| `pt` | Portuguese | Português |
| `ru` | Russian | Русский |
| `sv` | Swedish | Svenska |
| `tr` | Turkish | Türkçe |
| `zh` | Chinese | 中文 |

### Profile Form Languages (Currently Shown)

The profile form in the web app currently shows these 6 languages:

1. `en` - English
2. `es` - Español (Spanish)
3. `fr` - Français (French)
4. `de` - Deutsch (German)
5. `it` - Italiano (Italian)
6. `el` - Ελληνικά (Greek)

### Language Validation

**Valid Language Codes:**
The API accepts any of the 17 language codes listed above. The validation in the API is:
- Language must be a non-empty string
- No specific enum validation (accepts any string, but recommended to use the codes above)

**Recommended Implementation:**
```dart
class Language {
  final String code;
  final String name;
  final String nativeName;

  const Language({
    required this.code,
    required this.name,
    required this.nativeName,
  });
}

const List<Language> supportedLanguages = [
  Language(code: 'en', name: 'English', nativeName: 'English'),
  Language(code: 'es', name: 'Spanish', nativeName: 'Español'),
  Language(code: 'fr', name: 'French', nativeName: 'Français'),
  Language(code: 'de', name: 'German', nativeName: 'Deutsch'),
  Language(code: 'it', name: 'Italian', nativeName: 'Italiano'),
  Language(code: 'el', name: 'Greek', nativeName: 'Ελληνικά'),
  Language(code: 'ae', name: 'Arabic', nativeName: 'العربية'),
  Language(code: 'da', name: 'Danish', nativeName: 'Dansk'),
  Language(code: 'hu', name: 'Hungarian', nativeName: 'Magyar'),
  Language(code: 'ja', name: 'Japanese', nativeName: '日本語'),
  Language(code: 'pl', name: 'Polish', nativeName: 'Polski'),
  Language(code: 'pt', name: 'Portuguese', nativeName: 'Português'),
  Language(code: 'ru', name: 'Russian', nativeName: 'Русский'),
  Language(code: 'sv', name: 'Swedish', nativeName: 'Svenska'),
  Language(code: 'tr', name: 'Turkish', nativeName: 'Türkçe'),
  Language(code: 'zh', name: 'Chinese', nativeName: '中文'),
];
```

### Language Files Location

Translation files are located in:
```
web/public/locales/{languageCode}/translation.json
```

**Available Translation Files:**
- `ae/translation.json` - Arabic
- `da/translation.json` - Danish
- `de/translation.json` - German
- `el/translation.json` - Greek
- `en/translation.json` - English
- `es/translation.json` - Spanish
- `fr/translation.json` - French
- `hu/translation.json` - Hungarian
- `it/translation.json` - Italian
- `ja/translation.json` - Japanese
- `pl/translation.json` - Polish
- `pt/translation.json` - Portuguese
- `ru/translation.json` - Russian
- `sv/translation.json` - Swedish
- `tr/translation.json` - Turkish
- `zh/translation.json` - Chinese

**Note:** You can fetch these translation files from the web app's public folder or implement your own translation system in Flutter.

---

## Data Models

### User Profile Model

```dart
class UserProfile {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String language; // Language code (e.g., 'en', 'es', 'fr')
  final String? profileImage; // S3 URL path
  final String? profileImageUrl; // Signed URL (temporary, expires)
  final String? s3Key; // S3 object key
  final bool isVerified;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserProfile({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    required this.language,
    this.profileImage,
    this.profileImageUrl,
    this.s3Key,
    required this.isVerified,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['_id'] ?? json['id'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      phone: json['phone'],
      language: json['language'] ?? 'en',
      profileImage: json['profileImage'],
      profileImageUrl: json['profileImageUrl'],
      s3Key: json['s3Key'],
      isVerified: json['isVerified'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'language': language,
      'profileImage': profileImage,
      'profileImageUrl': profileImageUrl,
      's3Key': s3Key,
      'isVerified': isVerified,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
```

### Update Profile Request Model

```dart
class UpdateProfileRequest {
  final String firstName;
  final String lastName;
  final String? phone;
  final String language;
  final String email; // Required but cannot be changed
  final File? profileImage;

  UpdateProfileRequest({
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.language,
    required this.email,
    this.profileImage,
  });
}
```

---

## Complete Implementation Flow

### Scenario 1: Update Profile Without Image

```
1. User opens Profile Settings screen
   ↓
2. Fetch current profile: GET /api/users/profile
   ↓
3. Display form with current values:
   - First Name: user.firstName
   - Last Name: user.lastName
   - Phone: user.phone
   - Language: user.language
   - Email: user.email (read-only)
   ↓
4. User edits fields
   ↓
5. User clicks "Save"
   ↓
6. Validate form:
   - First name required, 2-50 characters
   - Last name required, 2-50 characters
   - Phone optional, valid format
   - Language required
   ↓
7. Update profile: PUT /api/users/profile
   - Include all fields in FormData
   - Exclude profileImage
   ↓
8. Show success message
   ↓
9. Update local state with new profile data
```

### Scenario 2: Update Profile With New Image

```
1. User opens Profile Settings screen
   ↓
2. Fetch current profile: GET /api/users/profile
   ↓
3. Display form with current values
   ↓
4. User clicks "Change Photo"
   ↓
5. Open image picker (camera/gallery)
   ↓
6. User selects image
   ↓
7. Validate image:
   - Format: JPG, JPEG, PNG, GIF
   - Size: Max 5MB
   ↓
8. Show image preview
   ↓
9. User edits other fields (optional)
   ↓
10. User clicks "Save"
    ↓
11. Update profile: PUT /api/users/profile
    - Include all fields in FormData
    - Include profileImage file
    ↓
12. Server processes:
    - Uploads new image to S3
    - Deletes old image from S3
    - Updates user profile
    ↓
13. Show success message
    ↓
14. Update local state with new profile data
    ↓
15. Display new profile image
```

### Scenario 3: Change Language

```
1. User opens Profile Settings screen
   ↓
2. Fetch current profile: GET /api/users/profile
   ↓
3. Display language dropdown with current selection
   ↓
4. User selects new language
   ↓
5. User clicks "Save"
   ↓
6. Update profile: PUT /api/users/profile
   - Include language in FormData
   ↓
7. Update app language preference
   ↓
8. Reload translations for new language
   ↓
9. Show success message
```

---

## Error Handling

### Common Errors

#### 1. Validation Error
```json
{
  "success": false,
  "error": "First name is required",
  "statusCode": 400
}
```
**Handling:** Show validation error message to user

#### 2. Email Change Attempt
```json
{
  "success": false,
  "error": "To change your email, please use the email verification process.",
  "statusCode": 400
}
```
**Handling:** Show message that email cannot be changed through profile update

#### 3. Invalid Image Format
```json
{
  "success": false,
  "error": "Only image files (jpg, jpeg, png, gif) are allowed!",
  "statusCode": 400
}
```
**Handling:** Validate image format before upload

#### 4. Image Too Large
```json
{
  "success": false,
  "error": "File size exceeds limit",
  "statusCode": 400
}
```
**Handling:** Validate file size (max 5MB) before upload

#### 5. Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "statusCode": 401
}
```
**Handling:** Redirect to login or refresh token

### Error Handling Best Practices

```dart
Future<void> updateProfile(UpdateProfileRequest request) async {
  try {
    // Validate before API call
    if (request.firstName.trim().isEmpty) {
      throw Exception('First name is required');
    }
    if (request.lastName.trim().isEmpty) {
      throw Exception('Last name is required');
    }
    if (request.language.isEmpty) {
      throw Exception('Language is required');
    }

    // Validate image if provided
    if (request.profileImage != null) {
      final fileSize = await request.profileImage!.length();
      if (fileSize > 5 * 1024 * 1024) {
        throw Exception('Image size must be less than 5MB');
      }
    }

    // Make API call
    final response = await api.put('/api/users/profile', formData);
    
    // Handle success
    showSuccess('Profile updated successfully');
  } on DioException catch (e) {
    if (e.response != null) {
      final error = e.response!.data['error'];
      showError(error ?? 'Failed to update profile');
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

### 1. Form Validation

**Client-Side Validation:**
```dart
String? validateFirstName(String? value) {
  if (value == null || value.trim().isEmpty) {
    return 'First name is required';
  }
  if (value.length < 2) {
    return 'First name must be at least 2 characters';
  }
  if (value.length > 50) {
    return 'First name must be less than 50 characters';
  }
  return null;
}

String? validatePhone(String? value) {
  if (value == null || value.isEmpty) {
    return null; // Phone is optional
  }
  // Use phone validation library
  if (!isValidPhoneNumber(value)) {
    return 'Please enter a valid phone number';
  }
  return null;
}
```

### 2. Image Handling

**Image Picker:**
```dart
Future<File?> pickProfileImage() async {
  final ImagePicker picker = ImagePicker();
  final XFile? image = await picker.pickImage(
    source: ImageSource.gallery,
    maxWidth: 1024,
    maxHeight: 1024,
    imageQuality: 85,
  );
  
  if (image != null) {
    return File(image.path);
  }
  return null;
}

Future<void> compressImage(File imageFile) async {
  // Compress image before upload
  final compressedFile = await FlutterImageCompress.compressAndGetFile(
    imageFile.absolute.path,
    '${imageFile.path}_compressed.jpg',
    quality: 85,
    minWidth: 800,
    minHeight: 800,
  );
  // Use compressedFile for upload
}
```

### 3. Language Selection UI

**Language Dropdown:**
```dart
DropdownButtonFormField<String>(
  value: selectedLanguage,
  decoration: InputDecoration(
    labelText: 'Language',
    border: OutlineInputBorder(),
  ),
  items: supportedLanguages.map((lang) {
    return DropdownMenuItem(
      value: lang.code,
      child: Text('${lang.nativeName} (${lang.name})'),
    );
  }).toList(),
  onChanged: (String? newValue) {
    if (newValue != null) {
      setState(() {
        selectedLanguage = newValue;
      });
    }
  },
)
```

### 4. Profile Image Display

**Display Profile Image:**
```dart
Widget buildProfileImage(String? imageUrl, String? signedUrl) {
  if (signedUrl != null) {
    // Use signed URL (temporary, expires)
    return CachedNetworkImage(
      imageUrl: signedUrl,
      placeholder: (context, url) => CircularProgressIndicator(),
      errorWidget: (context, url, error) => Icon(Icons.person),
      fit: BoxFit.cover,
    );
  } else if (imageUrl != null) {
    // Use regular URL
    return Image.network(imageUrl);
  } else {
    // Default avatar
    return Icon(Icons.person, size: 100);
  }
}
```

### 5. State Management

**Recommended:** Use state management (Provider, Riverpod, Bloc, etc.)

```dart
class ProfileProvider extends ChangeNotifier {
  UserProfile? _profile;
  bool _loading = false;
  String? _error;

  UserProfile? get profile => _profile;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> fetchProfile() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _profile = await profileService.getProfile();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile(UpdateProfileRequest request) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _profile = await profileService.updateProfile(request);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
```

### 6. Phone Number Formatting

**Use Phone Number Package:**
```dart
import 'package:phone_numbers_parser/phone_numbers_parser.dart';

String formatPhoneNumber(String phone) {
  try {
    final phoneNumber = PhoneNumber.parse(phone);
    return phoneNumber.international;
  } catch (e) {
    return phone; // Return original if parsing fails
  }
}

bool isValidPhone(String phone) {
  try {
    final phoneNumber = PhoneNumber.parse(phone);
    return phoneNumber.isValid();
  } catch (e) {
    return false;
  }
}
```

### 7. Signed URL Handling

**Handle Expired URLs:**
```dart
class UserProfile {
  String? profileImageUrl;
  DateTime? profileImageUrlExpires;

  bool get isProfileImageUrlValid {
    if (profileImageUrlExpires == null) return false;
    return DateTime.now().isBefore(profileImageUrlExpires!);
  }

  Future<String?> getValidProfileImageUrl() async {
    if (isProfileImageUrlValid && profileImageUrl != null) {
      return profileImageUrl;
    }
    // Fetch profile again to get new signed URL
    final profile = await profileService.getProfile();
    return profile.profileImageUrl;
  }
}
```

---

## Summary

### Key Takeaways

1. **Profile Update:**
   - Use `PUT /api/users/profile` with FormData
   - Include all required fields (firstName, lastName, language, email)
   - Email is required but cannot be changed
   - Profile image is optional

2. **Language Support:**
   - 17 languages supported in the system
   - Language code stored in user profile
   - Update language through profile update endpoint

3. **Profile Image:**
   - Max size: 5MB
   - Formats: JPG, JPEG, PNG, GIF
   - Uploaded to S3
   - Old images automatically deleted

4. **Important Restrictions:**
   - Email cannot be changed through profile update
   - Email changes require separate OTP verification flow

### Implementation Checklist

- [ ] Implement get profile endpoint
- [ ] Implement update profile endpoint
- [ ] Add form validation
- [ ] Implement image picker
- [ ] Add image validation (format, size)
- [ ] Implement language selection dropdown
- [ ] Add all 17 languages to language list
- [ ] Handle profile image display
- [ ] Handle signed URL expiration
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Implement state management

---

## Support

For questions or issues:
1. Check API responses for error messages
2. Verify all required fields are included
3. Ensure email matches current user email
4. Validate image format and size before upload
5. Check authentication token is valid

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**For:** Flutter App Development

