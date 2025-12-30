# Flutter Push Notifications Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) push notifications in your Flutter mobile app to receive notifications from the e-signature backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Flutter Dependencies](#flutter-dependencies)
4. [Android Configuration](#android-configuration)
5. [iOS Configuration](#ios-configuration)
6. [Implementation](#implementation)
7. [API Integration](#api-integration)
8. [Notification Handling](#notification-handling)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Flutter SDK (3.0 or higher)
- Android Studio / Xcode
- Firebase account
- Access to the backend API
- User authentication token

---

## Firebase Project Setup

### Step 1: Create/Configure Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Add Android and iOS apps to your Firebase project

### Step 2: Download Configuration Files

**For Android:**
- Download `google-services.json`
- Place it in `android/app/` directory

**For iOS:**
- Download `GoogleService-Info.plist`
- Place it in `ios/Runner/` directory

---

## Flutter Dependencies

Add the following dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase Core
  firebase_core: ^2.24.2
  
  # Firebase Cloud Messaging
  firebase_messaging: ^14.7.9
  
  # Local Notifications (for foreground notifications)
  flutter_local_notifications: ^16.3.0
  
  # Permission Handler (for notification permissions)
  permission_handler: ^11.1.0
  
  # HTTP (for API calls)
  http: ^1.1.0
  
  # Shared Preferences (optional, for storing token)
  shared_preferences: ^2.2.2
```

Run:
```bash
flutter pub get
```

---

## Android Configuration

### Step 1: Update `android/build.gradle`

Add Google Services plugin:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### Step 2: Update `android/app/build.gradle`

Apply the plugin at the bottom:

```gradle
apply plugin: 'com.google.gms.google-services'
```

Set minimum SDK version:

```gradle
android {
    defaultConfig {
        minSdkVersion 21  // Required for FCM
    }
}
```

### Step 3: Update `AndroidManifest.xml`

Add permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Internet permission -->
    <uses-permission android:name="android.permission.INTERNET"/>
    
    <!-- Notification permissions (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application
        android:label="Your App Name"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        
        <!-- FCM default notification channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="high_importance_channel" />
            
        <!-- FCM default notification icon -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
            
        <!-- FCM default notification color -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/colorAccent" />
    </application>
</manifest>
```

### Step 4: Create Notification Icon (Optional)

Create `android/app/src/main/res/drawable/ic_notification.xml`:

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2z"/>
</vector>
```

---

## iOS Configuration

### Step 1: Update `ios/Podfile`

Ensure you have the Firebase pods:

```ruby
platform :ios, '12.0'

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end
```

Run:
```bash
cd ios && pod install && cd ..
```

### Step 2: Enable Push Notifications Capability

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select the Runner target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Push Notifications"
6. Add "Background Modes" and enable:
   - Remote notifications
   - Background fetch

### Step 3: Update `ios/Runner/Info.plist`

Add notification permissions:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

### Step 4: Configure APNs (Apple Push Notification Service)

1. In Xcode, go to your Apple Developer account
2. Create an APNs Key or Certificate
3. Upload it to Firebase Console:
   - Firebase Console → Project Settings → Cloud Messaging
   - Upload APNs Authentication Key or Certificate

---

## Implementation

### Step 1: Create Notification Service

Create `lib/services/notification_service.dart`:

```dart
import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_service.dart'; // Your API service

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  StreamController<RemoteMessage> _messageController = 
      StreamController<RemoteMessage>.broadcast();
  
  Stream<RemoteMessage> get messageStream => _messageController.stream;

  /// Initialize notification service
  Future<void> initialize() async {
    // Request permissions
    await _requestPermissions();
    
    // Initialize local notifications
    await _initializeLocalNotifications();
    
    // Get FCM token
    await _getFCMToken();
    
    // Configure message handlers
    _configureMessageHandlers();
    
    // Listen for token refresh
    _firebaseMessaging.onTokenRefresh.listen(_onTokenRefresh);
  }

  /// Request notification permissions
  Future<void> _requestPermissions() async {
    // Request FCM permission
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ User granted notification permission');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      print('⚠️ User granted provisional notification permission');
    } else {
      print('❌ User declined notification permission');
    }

    // Request Android 13+ permission
    if (await Permission.notification.isDenied) {
      await Permission.notification.request();
    }
  }

  /// Initialize local notifications for foreground notifications
  Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channel for Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'This channel is used for important notifications.',
      importance: Importance.high,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  /// Get FCM token and register with backend
  Future<String?> _getFCMToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      
      if (_fcmToken != null) {
        print('📱 FCM Token: $_fcmToken');
        
        // Save token locally
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', _fcmToken!);
        
        // Register token with backend
        await _registerTokenWithBackend(_fcmToken!);
      }
      
      return _fcmToken;
    } catch (e) {
      print('❌ Error getting FCM token: $e');
      return null;
    }
  }

  /// Register FCM token with backend API
  Future<void> _registerTokenWithBackend(String token) async {
    try {
      // Determine platform
      String platform = 'android'; // or 'ios' based on Platform.isIOS
      
      final response = await ApiService().registerDeviceToken(
        deviceToken: token,
        platform: platform,
      );

      if (response.success) {
        print('✅ Device token registered successfully');
      } else {
        print('❌ Failed to register device token: ${response.message}');
      }
    } catch (e) {
      print('❌ Error registering device token: $e');
    }
  }

  /// Handle token refresh
  Future<void> _onTokenRefresh(String newToken) async {
    print('🔄 FCM Token refreshed: $newToken');
    _fcmToken = newToken;
    
    // Save new token
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fcm_token', newToken);
    
    // Re-register with backend
    await _registerTokenWithBackend(newToken);
  }

  /// Configure message handlers
  void _configureMessageHandlers() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📨 Foreground message received: ${message.messageId}');
      _handleForegroundMessage(message);
    });

    // Handle background message taps
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('📨 Notification tapped (app in background): ${message.messageId}');
      _handleNotificationTap(message);
    });

    // Check if app was opened from terminated state
    _firebaseMessaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        print('📨 App opened from notification (terminated state)');
        _handleNotificationTap(message);
      }
    });
  }

  /// Handle foreground messages (show local notification)
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'High Importance Notifications',
            channelDescription: 'This channel is used for important notifications.',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: message.data.toString(),
      );

      // Emit to stream
      _messageController.add(message);
    }
  }

  /// Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    if (response.payload != null) {
      // Parse payload and navigate
      print('📨 Notification tapped: ${response.payload}');
    }
  }

  /// Handle notification tap (from background/terminated)
  void _handleNotificationTap(RemoteMessage message) {
    // Emit to stream for navigation handling
    _messageController.add(message);
    
    // Navigate based on notification data
    _navigateFromNotification(message.data);
  }

  /// Navigate based on notification data
  void _navigateFromNotification(Map<String, dynamic> data) {
    final type = data['type'];
    final packageId = data['packageId'];

    if (type != null && packageId != null) {
      // Use your navigation service/router
      // Example:
      // NavigationService.navigateToDocument(packageId);
      
      print('🧭 Navigate to: type=$type, packageId=$packageId');
    }
  }

  /// Unregister device token (on logout)
  Future<void> unregisterToken() async {
    if (_fcmToken != null) {
      try {
        await ApiService().unregisterDeviceToken(deviceToken: _fcmToken!);
        print('✅ Device token unregistered');
      } catch (e) {
        print('❌ Error unregistering device token: $e');
      }
    }
    
    // Clear local token
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('fcm_token');
    _fcmToken = null;
  }

  /// Get current FCM token
  String? get fcmToken => _fcmToken;

  void dispose() {
    _messageController.close();
  }
}

/// Top-level function for background message handler
/// Must be a top-level function, not a class method
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📨 Background message received: ${message.messageId}');
  // Handle background message if needed
}
```

### Step 2: Update API Service

Add methods to your API service (`lib/api/api_service.dart`):

```dart
class ApiService {
  // ... existing code ...

  /// Register device token
  Future<ApiResponse> registerDeviceToken({
    required String deviceToken,
    required String platform, // 'android' or 'ios'
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/users/device-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await getAuthToken()}',
        },
        body: jsonEncode({
          'deviceToken': deviceToken,
          'platform': platform,
        }),
      );

      if (response.statusCode == 200) {
        return ApiResponse(success: true, data: jsonDecode(response.body));
      } else {
        return ApiResponse(
          success: false,
          message: jsonDecode(response.body)['error'] ?? 'Failed to register token',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: e.toString());
    }
  }

  /// Unregister device token
  Future<ApiResponse> unregisterDeviceToken({
    required String deviceToken,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/users/device-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await getAuthToken()}',
        },
        body: jsonEncode({
          'deviceToken': deviceToken,
        }),
      );

      if (response.statusCode == 200) {
        return ApiResponse(success: true, data: jsonDecode(response.body));
      } else {
        return ApiResponse(
          success: false,
          message: jsonDecode(response.body)['error'] ?? 'Failed to unregister token',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: e.toString());
    }
  }
}
```

### Step 3: Initialize in Main App

Update `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'services/notification_service.dart';

// Background message handler
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('📨 Background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Set up background message handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  
  // Initialize notification service
  await NotificationService().initialize();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'E-Signature App',
      home: HomeScreen(),
    );
  }
}
```

### Step 4: Handle Notifications in App

Create a notification handler widget or service:

```dart
import 'package:flutter/material.dart';
import 'services/notification_service.dart';

class NotificationHandler extends StatefulWidget {
  final Widget child;
  
  const NotificationHandler({required this.child, Key? key}) : super(key: key);

  @override
  State<NotificationHandler> createState() => _NotificationHandlerState();
}

class _NotificationHandlerState extends State<NotificationHandler> {
  @override
  void initState() {
    super.initState();
    _setupNotificationListener();
  }

  void _setupNotificationListener() {
    NotificationService().messageStream.listen((RemoteMessage message) {
      _handleNotification(message);
    });
  }

  void _handleNotification(RemoteMessage message) {
    final data = message.data;
    final type = data['type'];
    final packageId = data['packageId'];

    if (type != null && packageId != null) {
      // Navigate based on notification type
      switch (type) {
        case 'document_invitation':
        case 'document_reminder':
        case 'document_signing':
        case 'document_signed':
        case 'document_rejected':
        case 'document_revoked':
        case 'document_expiring':
        case 'participant_added':
        case 'participant_reassigned':
          _navigateToDocument(packageId);
          break;
        default:
          print('Unknown notification type: $type');
      }
    }
  }

  void _navigateToDocument(String packageId) {
    // Use your navigation method
    // Example: Navigator.pushNamed(context, '/document/$packageId');
    print('Navigate to document: $packageId');
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
```

---

## API Integration

### Register Device Token

**Endpoint:** `POST /api/users/device-token`

**Headers:**
```
Authorization: Bearer <your_auth_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceToken": "fcm_token_here",
  "platform": "android" // or "ios"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device token registered successfully"
}
```

### Unregister Device Token

**Endpoint:** `DELETE /api/users/device-token`

**Headers:**
```
Authorization: Bearer <your_auth_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceToken": "fcm_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device token unregistered successfully"
}
```

---

## Notification Handling

### Notification Types

The backend sends notifications with the following types:

- `document_invitation` - New document sent for signing
- `document_reminder` - Reminder to sign a document
- `document_signing` - Someone signed your document
- `document_signed` - Document completed by all participants
- `document_rejected` - Document was rejected
- `document_revoked` - Document was revoked
- `document_expiring` - Document is expiring soon
- `participant_added` - New participant added to document
- `participant_reassigned` - Participant was reassigned

### Notification Data Structure

```json
{
  "notification": {
    "title": "Document Reminder",
    "body": "John Doe sent you a reminder for Contract Agreement"
  },
  "data": {
    "type": "document_reminder",
    "packageId": "507f1f77bcf86cd799439011"
  }
}
```

### Handling Notification Taps

When a user taps a notification, navigate to the appropriate screen:

```dart
void handleNotificationTap(RemoteMessage message) {
  final data = message.data;
  final type = data['type'];
  final packageId = data['packageId'];

  if (packageId != null) {
    switch (type) {
      case 'document_invitation':
      case 'document_reminder':
        // Navigate to document signing screen
        Navigator.pushNamed(
          context,
          '/document/$packageId/sign',
        );
        break;
        
      case 'document_signing':
      case 'document_signed':
        // Navigate to document details
        Navigator.pushNamed(
          context,
          '/document/$packageId',
        );
        break;
        
      default:
        // Navigate to document list or details
        Navigator.pushNamed(
          context,
          '/document/$packageId',
        );
    }
  }
}
```

---

## Testing

### Test Token Registration

1. Run your app
2. Log in
3. Check console logs for FCM token
4. Verify token is registered in backend

### Test Notifications

**Using Firebase Console:**
1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Enter your FCM token
4. Send notification

**Using cURL:**
```bash
curl -X POST https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "FCM_TOKEN",
      "notification": {
        "title": "Test Notification",
        "body": "This is a test message"
      },
      "data": {
        "type": "document_invitation",
        "packageId": "test123"
      }
    }
  }'
```

### Test Scenarios

1. **Foreground Notification:**
   - App is open
   - Should show local notification
   - Should handle tap

2. **Background Notification:**
   - App is in background
   - Should show system notification
   - Tap should open app and navigate

3. **Terminated State:**
   - App is closed
   - Should show system notification
   - Tap should open app and navigate

---

## Troubleshooting

### Token Not Received

**Issue:** FCM token is null

**Solutions:**
- Check Firebase configuration files are in correct locations
- Verify `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
- Ensure Firebase project is properly configured
- Check internet connection

### Notifications Not Received

**Issue:** Notifications not appearing

**Solutions:**
- Verify device token is registered with backend
- Check notification permissions are granted
- Ensure app is not in battery optimization mode
- Check Firebase Console for delivery status
- Verify backend is sending notifications correctly

### iOS Notifications Not Working

**Issue:** iOS notifications not received

**Solutions:**
- Verify APNs certificate/key is uploaded to Firebase
- Check Push Notifications capability is enabled
- Ensure app is signed with proper provisioning profile
- Test on physical device (notifications don't work on simulator)

### Android Notifications Not Working

**Issue:** Android notifications not received

**Solutions:**
- Check `google-services.json` is in `android/app/`
- Verify AndroidManifest.xml permissions
- Check notification channel is created
- Ensure app is not in Do Not Disturb mode
- Test on physical device for better results

### Token Registration Fails

**Issue:** Backend returns error when registering token

**Solutions:**
- Verify authentication token is valid
- Check API endpoint URL is correct
- Ensure request body format is correct
- Check backend logs for errors
- Verify user account exists

### Background Notifications Not Working

**Issue:** Notifications only work when app is in foreground

**Solutions:**
- Ensure background message handler is registered
- Check `firebaseMessagingBackgroundHandler` is top-level function
- Verify background modes are enabled (iOS)
- Check app is not being killed by system

---

## Best Practices

1. **Token Management:**
   - Register token after user login
   - Re-register on token refresh
   - Unregister on logout
   - Handle token refresh automatically

2. **Permission Handling:**
   - Request permissions at appropriate time
   - Explain why permissions are needed
   - Handle permission denial gracefully

3. **Notification Handling:**
   - Handle all notification types
   - Navigate to correct screen based on type
   - Show appropriate UI feedback

4. **Error Handling:**
   - Handle network errors gracefully
   - Retry token registration on failure
   - Log errors for debugging

5. **Testing:**
   - Test on both Android and iOS
   - Test all notification types
   - Test in all app states (foreground, background, terminated)

---

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Flutter Firebase Messaging Package](https://pub.dev/packages/firebase_messaging)
- [Flutter Local Notifications](https://pub.dev/packages/flutter_local_notifications)
- [Permission Handler](https://pub.dev/packages/permission_handler)

---

## Support

If you encounter issues:

1. Check the troubleshooting section
2. Review Firebase Console logs
3. Check backend server logs
4. Verify all configuration files are correct
5. Test with Firebase Console test message feature

For backend API issues, refer to the backend API documentation.

