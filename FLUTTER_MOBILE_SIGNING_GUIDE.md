# Flutter Mobile App - Document Signing Implementation Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Complete guide for implementing document signing functionality in Flutter mobile applications

---

## Table of Contents

1. [Overview](#overview)
2. [Deep Link Handling](#deep-link-handling)
3. [Package Data Fetching](#package-data-fetching)
4. [PDF Display & Field Rendering](#pdf-display--field-rendering)
5. [Text & Checkbox Fields](#text--checkbox-fields)
6. [Signature Flow Implementation](#signature-flow-implementation)
7. [OTP Verification Process](#otp-verification-process)
8. [Submitting Signatures](#submitting-signatures)
9. [Complete Implementation Example](#complete-implementation-example)
10. [Error Handling](#error-handling)
11. [Best Practices](#best-practices)

---

## Overview

This guide explains how to implement document signing in a Flutter mobile app. Currently, participants receive email links that open the web app. This guide shows how to intercept these links and handle the signing flow directly in your mobile app.

### Key Concepts

- **Package**: A document that contains fields to be filled/signed
- **Participant**: A person assigned to sign or fill fields in the package
- **Field**: A position on the PDF where data needs to be entered (signature, text, checkbox)
- **Participant ID**: A unique identifier for each participant's assignment to a package
- **Package ID**: The unique identifier for the document package

### Current Flow (Web)

1. Participant receives email with link: `https://yourdomain.com/package/{packageId}/participant/{participantId}`
2. User clicks link → Opens web browser
3. User signs document in web app

### Target Flow (Mobile App)

1. Participant receives email with link: `https://yourdomain.com/package/{packageId}/participant/{participantId}`
2. User clicks link → Opens mobile app (via deep link)
3. App extracts `packageId` and `participantId` from URL
4. App fetches package data
5. User signs document directly in mobile app

---

## Deep Link Handling

### URL Structure

The email links follow this format:
```
https://yourdomain.com/package/{packageId}/participant/{participantId}
```

### Flutter Deep Link Setup

#### 1. Configure Android (AndroidManifest.xml)

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTop">
    
    <!-- Existing intent filters -->
    
    <!-- Deep link intent filter -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <!-- Handle your domain -->
        <data
            android:scheme="https"
            android:host="yourdomain.com"
            android:pathPrefix="/package" />
    </intent-filter>
    
    <!-- Custom scheme (alternative) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="esign" />
    </intent-filter>
</activity>
```

#### 2. Configure iOS (Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLName</key>
        <string>com.yourapp.esign</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>https</string>
            <string>esign</string>
        </array>
    </dict>
</array>

<key>FlutterDeepLinkingEnabled</key>
<true/>
```

#### 3. Add Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  uni_links: ^0.5.1  # For deep linking
  # OR
  app_links: ^3.3.0  # Modern alternative
```

#### 4. Extract Package ID and Participant ID

```dart
import 'package:uni_links/uni_links.dart';
import 'dart:async';

class DeepLinkHandler {
  StreamSubscription? _linkSubscription;
  
  void initDeepLinks() {
    // Handle app opened from terminated state
    getInitialLink().then((String? initialLink) {
      if (initialLink != null) {
        _handleDeepLink(initialLink);
      }
    });
    
    // Handle app opened from background
    _linkSubscription = linkStream.listen(
      (String link) => _handleDeepLink(link),
      onError: (err) => print('Deep link error: $err'),
    );
  }
  
  void _handleDeepLink(String link) {
    // Parse URL: https://yourdomain.com/package/{packageId}/participant/{participantId}
    final uri = Uri.parse(link);
    
    // Extract path segments
    final segments = uri.pathSegments;
    
    if (segments.length >= 4 && 
        segments[0] == 'package' && 
        segments[2] == 'participant') {
      final packageId = segments[1];
      final participantId = segments[3];
      
      // Navigate to signing screen
      _navigateToSigningScreen(packageId, participantId);
    } else {
      print('Invalid deep link format: $link');
    }
  }
  
  void _navigateToSigningScreen(String packageId, String participantId) {
    // Use your navigation solution (e.g., Navigator, GoRouter, etc.)
    // Example:
    // Navigator.pushNamed(
    //   context,
    //   '/signing',
    //   arguments: {
    //     'packageId': packageId,
    //     'participantId': participantId,
    //   },
    // );
  }
  
  void dispose() {
    _linkSubscription?.cancel();
  }
}
```

---

## Package Data Fetching

### API Endpoint

**GET** `/api/packages/participant/{packageId}/{participantId}`

**No authentication required** - The `participantId` serves as the authentication token.

### Response Structure

```json
{
  "success": true,
  "data": {
    "package": {
      "_id": "packageId123",
      "name": "Contract Agreement",
      "status": "Sent",
      "fileUrl": "https://s3.amazonaws.com/bucket/path/to/document.pdf",
      "downloadUrl": "https://s3.amazonaws.com/bucket/path/to/document.pdf?signature=...",
      "fields": [
        {
          "id": "fieldId1",
          "type": "signature",
          "x": 100,
          "y": 200,
          "width": 200,
          "height": 50,
          "page": 1,
          "label": "Signature",
          "required": true,
          "assignedUsers": [
            {
              "id": "participantId456",
              "contactId": "contactId789",
              "contactName": "John Doe",
              "contactEmail": "john@example.com",
              "contactPhone": "+1234567890",
              "role": "Signer",
              "signatureMethods": ["Email OTP", "SMS OTP"],
              "signed": false,
              "signedAt": null,
              "signedMethod": null
            }
          ],
          "value": null,
          "isAssignedToCurrentUser": true
        },
        {
          "id": "fieldId2",
          "type": "text",
          "x": 150,
          "y": 300,
          "width": 150,
          "height": 30,
          "page": 1,
          "label": "Full Name",
          "required": false,
          "assignedUsers": [...],
          "value": "",
          "isAssignedToCurrentUser": true
        },
        {
          "id": "fieldId3",
          "type": "checkbox",
          "x": 200,
          "y": 350,
          "width": 20,
          "height": 20,
          "page": 1,
          "label": "I agree",
          "required": true,
          "assignedUsers": [...],
          "value": false,
          "isAssignedToCurrentUser": true
        }
      ],
      "currentUser": {
        "id": "participantId456",
        "contactId": "contactId789",
        "contactName": "John Doe",
        "contactEmail": "john@example.com",
        "contactPhone": "+1234567890"
      },
      "hasAgreedToTerms": false
    }
  }
}
```

### Flutter Implementation

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class PackageService {
  final String baseUrl = 'https://your-api-domain.com';
  
  Future<ParticipantPackage> fetchPackageForParticipant(
    String packageId,
    String participantId,
  ) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId'
    );
    
    final response = await http.get(url);
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return ParticipantPackage.fromJson(jsonData['data']['package']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to load document');
    }
  }
}

// Data Models
class ParticipantPackage {
  final String id;
  final String name;
  final String status;
  final String fileUrl;
  final String? downloadUrl;
  final List<DocumentField> fields;
  final CurrentUser currentUser;
  final bool hasAgreedToTerms;
  
  ParticipantPackage({
    required this.id,
    required this.name,
    required this.status,
    required this.fileUrl,
    this.downloadUrl,
    required this.fields,
    required this.currentUser,
    required this.hasAgreedToTerms,
  });
  
  factory ParticipantPackage.fromJson(Map<String, dynamic> json) {
    return ParticipantPackage(
      id: json['_id'],
      name: json['name'],
      status: json['status'],
      fileUrl: json['fileUrl'],
      downloadUrl: json['downloadUrl'],
      fields: (json['fields'] as List)
          .map((f) => DocumentField.fromJson(f))
          .toList(),
      currentUser: CurrentUser.fromJson(json['currentUser']),
      hasAgreedToTerms: json['hasAgreedToTerms'] ?? false,
    );
  }
}

class DocumentField {
  final String id;
  final String type; // 'signature', 'text', 'checkbox'
  final double x;
  final double y;
  final double width;
  final double height;
  final int page;
  final String label;
  final bool required;
  final List<AssignedUser> assignedUsers;
  final dynamic value; // null, string, bool, or SignatureValue
  final bool isAssignedToCurrentUser;
  
  DocumentField({
    required this.id,
    required this.type,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.page,
    required this.label,
    required this.required,
    required this.assignedUsers,
    this.value,
    required this.isAssignedToCurrentUser,
  });
  
  factory DocumentField.fromJson(Map<String, dynamic> json) {
    return DocumentField(
      id: json['id'],
      type: json['type'],
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      width: (json['width'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
      page: json['page'],
      label: json['label'] ?? '',
      required: json['required'] ?? false,
      assignedUsers: (json['assignedUsers'] as List?)
          ?.map((u) => AssignedUser.fromJson(u))
          .toList() ?? [],
      value: json['value'],
      isAssignedToCurrentUser: json['isAssignedToCurrentUser'] ?? false,
    );
  }
  
  bool get isSigned {
    if (type != 'signature') return false;
    if (value == null) return false;
    if (value is Map) {
      return value['signedBy'] != null;
    }
    return false;
  }
  
  SignatureValue? get signatureValue {
    if (type == 'signature' && value is Map) {
      return SignatureValue.fromJson(value as Map<String, dynamic>);
    }
    return null;
  }
}

class AssignedUser {
  final String id;
  final String contactId;
  final String contactName;
  final String contactEmail;
  final String? contactPhone;
  final String role;
  final List<String> signatureMethods;
  final bool signed;
  final DateTime? signedAt;
  final String? signedMethod;
  
  AssignedUser({
    required this.id,
    required this.contactId,
    required this.contactName,
    required this.contactEmail,
    this.contactPhone,
    required this.role,
    required this.signatureMethods,
    required this.signed,
    this.signedAt,
    this.signedMethod,
  });
  
  factory AssignedUser.fromJson(Map<String, dynamic> json) {
    return AssignedUser(
      id: json['id'],
      contactId: json['contactId'],
      contactName: json['contactName'],
      contactEmail: json['contactEmail'],
      contactPhone: json['contactPhone'],
      role: json['role'],
      signatureMethods: List<String>.from(json['signatureMethods'] ?? []),
      signed: json['signed'] ?? false,
      signedAt: json['signedAt'] != null 
          ? DateTime.parse(json['signedAt']) 
          : null,
      signedMethod: json['signedMethod'],
    );
  }
}

class SignatureValue {
  final String signedBy;
  final String email;
  final DateTime date;
  final String method;
  final String? ip;
  final String? otpCode;
  
  SignatureValue({
    required this.signedBy,
    required this.email,
    required this.date,
    required this.method,
    this.ip,
    this.otpCode,
  });
  
  factory SignatureValue.fromJson(Map<String, dynamic> json) {
    return SignatureValue(
      signedBy: json['signedBy'],
      email: json['email'],
      date: DateTime.parse(json['date']),
      method: json['method'],
      ip: json['ip'],
      otpCode: json['otpCode'],
    );
  }
}

class CurrentUser {
  final String id;
  final String contactId;
  final String contactName;
  final String contactEmail;
  final String? contactPhone;
  
  CurrentUser({
    required this.id,
    required this.contactId,
    required this.contactName,
    required this.contactEmail,
    this.contactPhone,
  });
  
  factory CurrentUser.fromJson(Map<String, dynamic> json) {
    return CurrentUser(
      id: json['id'],
      contactId: json['contactId'],
      contactName: json['contactName'],
      contactEmail: json['contactEmail'],
      contactPhone: json['contactPhone'],
    );
  }
}
```

---

## PDF Display & Field Rendering

### PDF Rendering Libraries

Recommended packages:
- `syncfusion_flutter_pdfviewer: ^24.1.0` (Recommended)
- `flutter_pdfview: ^1.3.0`
- `pdfx: ^0.9.0`

### Implementation

```dart
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:flutter/material.dart';

class DocumentSigningScreen extends StatefulWidget {
  final String packageId;
  final String participantId;
  
  const DocumentSigningScreen({
    Key? key,
    required this.packageId,
    required this.participantId,
  }) : super(key: key);
  
  @override
  State<DocumentSigningScreen> createState() => _DocumentSigningScreenState();
}

class _DocumentSigningScreenState extends State<DocumentSigningScreen> {
  final PackageService _packageService = PackageService();
  ParticipantPackage? _package;
  bool _isLoading = true;
  String? _error;
  
  // PDF viewer controller
  final PdfViewerController _pdfController = PdfViewerController();
  
  // Field overlays
  final Map<String, GlobalKey> _fieldKeys = {};
  
  @override
  void initState() {
    super.initState();
    _loadPackage();
  }
  
  Future<void> _loadPackage() async {
    try {
      setState(() => _isLoading = true);
      final package = await _packageService.fetchPackageForParticipant(
        widget.packageId,
        widget.participantId,
      );
      setState(() {
        _package = package;
        _isLoading = false;
      });
      
      // Initialize field keys
      for (var field in package.fields) {
        if (field.isAssignedToCurrentUser) {
          _fieldKeys[field.id] = GlobalKey();
        }
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
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Loading Document...')),
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: Text('Error')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: $_error'),
              ElevatedButton(
                onPressed: _loadPackage,
                child: Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    
    if (_package == null) {
      return Scaffold(
        appBar: AppBar(title: Text('No Document')),
        body: Center(child: Text('No document found')),
      );
    }
    
    return Scaffold(
      appBar: AppBar(
        title: Text(_package!.name),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadPackage,
          ),
        ],
      ),
      body: Stack(
        children: [
          // PDF Viewer
          SfPdfViewer.network(
            _package!.downloadUrl ?? _package!.fileUrl,
            controller: _pdfController,
            onDocumentLoaded: (PdfDocumentLoadedDetails details) {
              // PDF loaded, fields will be rendered as overlays
            },
          ),
          
          // Field Overlays
          ..._buildFieldOverlays(),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }
  
  List<Widget> _buildFieldOverlays() {
    if (_package == null) return [];
    
    return _package!.fields
        .where((field) => field.isAssignedToCurrentUser)
        .map((field) => _buildFieldOverlay(field))
        .toList();
  }
  
  Widget _buildFieldOverlay(DocumentField field) {
    return Positioned(
      left: field.x,
      top: field.y,
      width: field.width,
      height: field.height,
      child: GestureDetector(
        onTap: () => _handleFieldTap(field),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: _getFieldColor(field),
              width: 2,
            ),
            color: _getFieldColor(field).withOpacity(0.1),
          ),
          child: _buildFieldContent(field),
        ),
      ),
    );
  }
  
  Color _getFieldColor(DocumentField field) {
    if (field.isSigned) {
      return Colors.green;
    }
    if (field.required && !field.isSigned) {
      return Colors.red;
    }
    return Colors.blue;
  }
  
  Widget _buildFieldContent(DocumentField field) {
    if (field.type == 'signature') {
      if (field.isSigned && field.signatureValue != null) {
        return _buildSignedSignatureField(field.signatureValue!);
      }
      return Center(
        child: Icon(Icons.draw, color: Colors.blue),
      );
    }
    
    if (field.type == 'text') {
      return Padding(
        padding: EdgeInsets.all(4),
        child: Text(
          field.value?.toString() ?? '',
          style: TextStyle(fontSize: 12),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      );
    }
    
    if (field.type == 'checkbox') {
      return Center(
        child: Icon(
          field.value == true ? Icons.check_box : Icons.check_box_outline_blank,
          color: Colors.blue,
        ),
      );
    }
    
    return SizedBox.shrink();
  }
  
  Widget _buildSignedSignatureField(SignatureValue signature) {
    return Padding(
      padding: EdgeInsets.all(4),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            signature.signedBy,
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            'Signed: ${_formatDate(signature.date)}',
            style: TextStyle(fontSize: 8),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
  
  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
  
  void _handleFieldTap(DocumentField field) {
    if (field.type == 'signature') {
      _handleSignatureFieldTap(field);
    } else if (field.type == 'text') {
      _handleTextFieldTap(field);
    } else if (field.type == 'checkbox') {
      _handleCheckboxFieldTap(field);
    }
  }
  
  void _handleSignatureFieldTap(DocumentField field) {
    if (field.isSigned) {
      // Show signature details
      _showSignatureDetails(field.signatureValue!);
      return;
    }
    
    // Check if user agreed to terms
    if (!_package!.hasAgreedToTerms) {
      _showTermsAgreementDialog();
      return;
    }
    
    // Open signing modal
    _openSigningModal(field);
  }
  
  void _handleTextFieldTap(DocumentField field) {
    _showTextInputDialog(field);
  }
  
  void _handleCheckboxFieldTap(DocumentField field) {
    // Toggle checkbox value
    setState(() {
      // Update field value locally
      // You'll need to maintain local state for unsaved changes
    });
  }
  
  Widget _buildBottomBar() {
    if (_package == null) return SizedBox.shrink();
    
    final hasUnsavedChanges = false; // Track this in your state
    final hasSignatureFields = _package!.fields
        .any((f) => f.type == 'signature' && f.isAssignedToCurrentUser);
    
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          if (hasUnsavedChanges)
            Expanded(
              child: ElevatedButton(
                onPressed: _saveFields,
                child: Text('Save Changes'),
              ),
            ),
          if (hasSignatureFields && _package!.hasAgreedToTerms)
            Expanded(
              child: ElevatedButton(
                onPressed: _openSigningModal,
                child: Text('Sign Document'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  void _showTermsAgreementDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Terms of Use'),
        content: Text('You must agree to the Terms of Use before signing.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              // Navigate to terms agreement screen
              Navigator.pop(context);
              // TODO: Navigate to terms screen
            },
            child: Text('View Terms'),
          ),
        ],
      ),
    );
  }
  
  void _openSigningModal([DocumentField? field]) {
    // Will be implemented in Signature Flow section
  }
  
  void _saveFields() {
    // Will be implemented in Text & Checkbox Fields section
  }
  
  void _showTextInputDialog(DocumentField field) {
    // Will be implemented in Text & Checkbox Fields section
  }
  
  void _showSignatureDetails(SignatureValue signature) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Signature Details'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Signed by: ${signature.signedBy}'),
            Text('Email: ${signature.email}'),
            Text('Date: ${_formatDate(signature.date)}'),
            Text('Method: ${signature.method}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close'),
          ),
        ],
      ),
    );
  }
}
```

### Coordinate System Notes

- **Origin**: Top-left corner (0, 0)
- **X-axis**: Left to right
- **Y-axis**: Top to bottom
- **Units**: Points (1 point = 1/72 inch)
- **Page numbering**: Starts at 1

**Important**: PDF coordinate systems may differ. You may need to adjust coordinates based on your PDF rendering library.

---

## Text & Checkbox Fields

### Field Value Management

Participants can fill text and checkbox fields before signing. These values are saved separately from signatures.

### Submit Fields Endpoint

**POST** `/api/packages/participant/{packageId}/{participantId}/submit-fields`

**Request Body:**
```json
{
  "fieldValues": {
    "fieldId1": "John Doe",
    "fieldId2": true,
    "fieldId3": "Some text value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your responses have been submitted successfully",
  "data": {
    "message": "Your changes have been saved.",
    "package": { /* Updated package object */ }
  }
}
```

### Flutter Implementation

```dart
class FieldValueService {
  final String baseUrl = 'https://your-api-domain.com';
  
  Future<ParticipantPackage> submitFields({
    required String packageId,
    required String participantId,
    required Map<String, dynamic> fieldValues,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/submit-fields'
    );
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'fieldValues': fieldValues}),
    );
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return ParticipantPackage.fromJson(jsonData['data']['package']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to save fields');
    }
  }
}

// In your DocumentSigningScreen
class _DocumentSigningScreenState extends State<DocumentSigningScreen> {
  final FieldValueService _fieldService = FieldValueService();
  final Map<String, dynamic> _localFieldValues = {};
  
  void _updateFieldValue(String fieldId, dynamic value) {
    setState(() {
      _localFieldValues[fieldId] = value;
    });
  }
  
  Future<void> _saveFields() async {
    if (_localFieldValues.isEmpty) return;
    
    try {
      final updatedPackage = await _fieldService.submitFields(
        packageId: widget.packageId,
        participantId: widget.participantId,
        fieldValues: _localFieldValues,
      );
      
      setState(() {
        _package = updatedPackage;
        _localFieldValues.clear();
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Changes saved successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }
  
  void _showTextInputDialog(DocumentField field) {
    final currentValue = _localFieldValues[field.id] ?? field.value ?? '';
    
    showDialog(
      context: context,
      builder: (context) {
        final controller = TextEditingController(text: currentValue.toString());
        
        return AlertDialog(
          title: Text(field.label),
          content: TextField(
            controller: controller,
            decoration: InputDecoration(
              hintText: 'Enter ${field.label}',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                _updateFieldValue(field.id, controller.text);
                Navigator.pop(context);
              },
              child: Text('Save'),
            ),
          ],
        );
      },
    );
  }
  
  void _handleCheckboxFieldTap(DocumentField field) {
    final currentValue = _localFieldValues[field.id] ?? field.value ?? false;
    _updateFieldValue(field.id, !currentValue);
  }
}
```

---

## Signature Flow Implementation

### Overview

The signature flow involves:
1. User clicks signature field
2. Check terms agreement (if not agreed)
3. Choose signing method (Email OTP or SMS OTP)
4. Enter email/phone
5. Request OTP
6. Enter OTP code
7. Verify OTP
8. Signature applied to ALL signature fields for that participant

### Signing Method Selection

Check `assignedUsers[].signatureMethods`:
- If `["Email OTP"]` → Only email option
- If `["SMS OTP"]` → Only SMS option
- If `["Email OTP", "SMS OTP"]` → Show both options

### Send OTP Endpoints

#### Email OTP

**POST** `/api/packages/participant/{packageId}/{participantId}/send-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email.",
  "data": {
    "message": "OTP sent to your email."
  }
}
```

#### SMS OTP

**POST** `/api/packages/participant/{packageId}/{participantId}/send-sms-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "phone": "+1234567890"
}
```

**Response:** Same format as Email OTP

### Verify OTP Endpoints

#### Email OTP Verification

**POST** `/api/packages/participant/{packageId}/{participantId}/verify-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signature completed for 2 field(s).",
  "data": {
    "message": "Signature completed for 2 field(s).",
    "package": { /* Updated package object */ },
    "fieldsSignedCount": 2
  }
}
```

#### SMS OTP Verification

**POST** `/api/packages/participant/{packageId}/{participantId}/verify-sms-otp`

**Request Body:** Same as Email OTP verification

**Response:** Same format as Email OTP verification

### Flutter Implementation

```dart
class SignatureService {
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

// Signing Modal Widget
class SigningModal extends StatefulWidget {
  final DocumentField field;
  final CurrentUser currentUser;
  final Function(ParticipantPackage) onSuccess;
  
  const SigningModal({
    Key? key,
    required this.field,
    required this.currentUser,
    required this.onSuccess,
  }) : super(key: key);
  
  @override
  State<SigningModal> createState() => _SigningModalState();
}

class _SigningModalState extends State<SigningModal> {
  final SignatureService _signatureService = SignatureService();
  
  // Get available signing methods from the first assigned user
  List<String> get _availableMethods {
    if (widget.field.assignedUsers.isEmpty) return [];
    return widget.field.assignedUsers[0].signatureMethods;
  }
  
  String? _selectedMethod; // 'email' or 'sms'
  String _identityInput = '';
  String _otpInput = '';
  bool _isLoading = false;
  bool _otpSent = false;
  int _otpTimer = 60; // 60 seconds
  Timer? _timer;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    // Auto-select if only one method
    if (_availableMethods.length == 1) {
      _selectedMethod = _availableMethods[0].contains('Email') ? 'email' : 'sms';
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
      
      // Email must match current user's email
      if (_identityInput.toLowerCase() != widget.currentUser.contactEmail.toLowerCase()) {
        setState(() => _error = 'Email must match your assigned email');
        return;
      }
    } else {
      if (!_isValidPhone(_identityInput)) {
        setState(() => _error = 'Please enter a valid phone number');
        return;
      }
      
      // Phone must match current user's phone
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
      if (_selectedMethod == 'email') {
        await _signatureService.sendEmailOtp(
          packageId: widget.field.id, // You'll need packageId from parent
          participantId: widget.currentUser.id,
          fieldId: widget.field.id,
          email: _identityInput,
        );
      } else {
        await _signatureService.sendSmsOtp(
          packageId: widget.field.id, // You'll need packageId from parent
          participantId: widget.currentUser.id,
          fieldId: widget.field.id,
          phone: _identityInput,
        );
      }
      
      setState(() {
        _otpSent = true;
        _isLoading = false;
      });
      
      _startOtpTimer();
    } catch (e) {
      setState(() {
        _error = e.toString();
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
      ParticipantPackage updatedPackage;
      
      if (_selectedMethod == 'email') {
        updatedPackage = await _signatureService.verifyEmailOtp(
          packageId: widget.field.id, // You'll need packageId from parent
          participantId: widget.currentUser.id,
          fieldId: widget.field.id,
          otp: _otpInput,
        );
      } else {
        updatedPackage = await _signatureService.verifySmsOtp(
          packageId: widget.field.id, // You'll need packageId from parent
          participantId: widget.currentUser.id,
          fieldId: widget.field.id,
          otp: _otpInput,
        );
      }
      
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
        _error = e.toString();
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
              // Method Selection (if multiple)
              if (_availableMethods.length > 1) ...[
                Text('Select signing method:'),
                SizedBox(height: 8),
                RadioListTile<String>(
                  title: Text('Email OTP'),
                  value: 'email',
                  groupValue: _selectedMethod,
                  onChanged: (value) => setState(() => _selectedMethod = value),
                ),
                RadioListTile<String>(
                  title: Text('SMS OTP'),
                  value: 'sms',
                  groupValue: _selectedMethod,
                  onChanged: (value) => setState(() => _selectedMethod = value),
                ),
                SizedBox(height: 16),
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
                    ? CircularProgressIndicator()
                    : Text('Send OTP'),
              ),
            ] else ...[
              // OTP Input
              Text('Enter the 6-digit OTP code:'),
              SizedBox(height: 8),
              TextField(
                decoration: InputDecoration(
                  labelText: 'OTP Code',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                maxLength: 6,
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
                      child: _isLoading 
                          ? CircularProgressIndicator()
                          : Text('Verify & Sign'),
                    ),
                  ),
                ],
              ),
            ],
            
            SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## OTP Verification Process

### OTP Details

- **Format**: 6-digit numeric code (100000-999999)
- **Expiration**: 60 seconds from creation
- **Max Attempts**: 4 incorrect attempts allowed
- **After 4 Failed Attempts**: OTP is deleted, user must request new one
- **One Active OTP**: New request deletes old OTP

### OTP Lifecycle

1. **Generation**: Random 6-digit number generated
2. **Storage**: Stored in database with expiration timestamp
3. **Delivery**: Sent via email or SMS
4. **Verification**: User enters code, system validates
5. **Cleanup**: Deleted after successful verification or expiration

### Security Features

- IP address captured during verification
- Timestamp recorded for audit trail
- OTP code stored in signature metadata
- Signature method recorded ("Email OTP" or "SMS OTP")

---

## Submitting Signatures

### Important Notes

1. **One OTP Signs All**: Verifying OTP for ONE signature field signs **ALL signature fields** assigned to that participant
2. **Automatic Application**: The signature is applied to all matching fields automatically
3. **No Separate Submission**: Signatures are submitted automatically upon OTP verification
4. **Package Update**: After verification, fetch updated package data to reflect signed status

### Implementation Flow

```dart
// In your DocumentSigningScreen
void _openSigningModal([DocumentField? field]) {
  if (_package == null) return;
  
  // Find first unsigned signature field if none provided
  final signatureField = field ?? _package!.fields.firstWhere(
    (f) => f.type == 'signature' && 
          f.isAssignedToCurrentUser && 
          !f.isSigned,
  );
  
  showDialog(
    context: context,
    builder: (context) => SigningModal(
      field: signatureField,
      currentUser: _package!.currentUser,
      onSuccess: (updatedPackage) {
        setState(() {
          _package = updatedPackage;
        });
        
        // Check if document is completed
        if (updatedPackage.status == 'Completed') {
          _showCompletionDialog();
        }
      },
    ),
  );
}

void _showCompletionDialog() {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Document Completed'),
      content: Text('All participants have signed the document.'),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            Navigator.pop(context); // Close signing screen
          },
          child: Text('OK'),
        ),
      ],
    ),
  );
}
```

---

## Complete Implementation Example

### Main App Structure

```dart
import 'package:flutter/material.dart';
import 'package:uni_links/uni_links.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'E-Sign App',
      theme: ThemeData(primarySwatch: Colors.blue),
      initialRoute: '/',
      routes: {
        '/': (context) => HomeScreen(),
        '/signing': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map;
          return DocumentSigningScreen(
            packageId: args['packageId'],
            participantId: args['participantId'],
          );
        },
      },
    );
  }
}

class HomeScreen extends StatefulWidget {
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DeepLinkHandler _deepLinkHandler = DeepLinkHandler();
  
  @override
  void initState() {
    super.initState();
    _deepLinkHandler.initDeepLinks();
  }
  
  @override
  void dispose() {
    _deepLinkHandler.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('E-Sign App')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Waiting for document signing link...'),
            SizedBox(height: 16),
            Text(
              'Click a link in your email to open a document for signing',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## Error Handling

### Common Errors

#### 1. Package Not Found
```
Error: "Package not found or not active."
```
**Solution**: Verify `packageId` and `participantId` are correct. Check package status is "Sent".

#### 2. Invalid Participant
```
Error: "Invalid participant"
```
**Solution**: Verify `participantId` matches the participant assigned to the package.

#### 3. Email/Phone Mismatch
```
Error: "Email does not match assigned participant."
```
**Solution**: Ensure the email/phone entered matches `currentUser.contactEmail` or `currentUser.contactPhone`.

#### 4. Invalid or Expired OTP
```
Error: "Invalid or expired OTP."
```
**Solution**: Request a new OTP. OTPs expire after 60 seconds.

#### 5. Incorrect OTP
```
Error: "Incorrect OTP."
```
**Solution**: Verify the OTP code. Maximum 4 attempts allowed.

#### 6. Maximum Attempts Exceeded
```
Error: "Maximum OTP attempts exceeded."
```
**Solution**: Request a new OTP after 4 failed attempts.

#### 7. Package Expired
```
Error: "Package has expired."
```
**Solution**: Contact the package owner to resend the document.

#### 8. Terms Not Agreed
```
Error: "You must agree to the Terms of Use before signing."
```
**Solution**: Display terms agreement screen before allowing signing.

### Error Handling Implementation

```dart
Future<void> _handleApiError(dynamic error) {
  String errorMessage = 'An error occurred';
  
  if (error is Exception) {
    errorMessage = error.toString().replaceFirst('Exception: ', '');
  } else if (error is String) {
    errorMessage = error;
  }
  
  // Show user-friendly error
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(errorMessage),
      backgroundColor: Colors.red,
      duration: Duration(seconds: 5),
    ),
  );
}
```

---

## Best Practices

### 1. State Management

Use a state management solution (Provider, Riverpod, Bloc, etc.) to manage:
- Current package data
- Field values (local changes)
- Loading states
- Error states
- Terms agreement status

### 2. Network Handling

- Implement retry logic for network failures
- Show loading indicators during API calls
- Handle timeout scenarios
- Cache package data locally if needed

### 3. PDF Rendering

- Use a reliable PDF rendering library
- Handle multi-page documents
- Adjust coordinate system if needed
- Optimize PDF loading (caching, progressive loading)

### 4. User Experience

- Show clear loading states
- Provide helpful error messages
- Display progress indicators
- Confirm actions (especially signing)
- Show success/error feedback

### 5. Security

- Validate all inputs client-side
- Never store sensitive data locally
- Use HTTPS for all API calls
- Implement proper error handling (don't expose sensitive info)

### 6. Testing

Test scenarios:
- ✅ Email OTP flow
- ✅ SMS OTP flow
- ✅ Both methods available
- ✅ Expired OTP handling
- ✅ Maximum attempt limit
- ✅ Multiple signature fields (verify all sign at once)
- ✅ Terms agreement requirement
- ✅ Package expiry
- ✅ Network error scenarios
- ✅ Already-signed fields
- ✅ Text/checkbox field submission
- ✅ Deep link handling

### 7. Performance

- Lazy load PDF pages if possible
- Optimize field overlay rendering
- Debounce field value updates
- Cache API responses when appropriate

### 8. Accessibility

- Add semantic labels to fields
- Support screen readers
- Ensure sufficient color contrast
- Provide keyboard navigation

---

## Summary

This guide provides a complete implementation path for document signing in Flutter mobile apps:

1. **Deep Link Handling**: Intercept email links and extract package/participant IDs
2. **Package Fetching**: Retrieve document data using public API endpoints
3. **PDF Display**: Render PDF with interactive field overlays
4. **Field Management**: Handle text, checkbox, and signature fields
5. **OTP Flow**: Implement Email/SMS OTP verification
6. **Signature Submission**: Automatically submit signatures upon OTP verification
7. **Error Handling**: Gracefully handle all error scenarios

The system ensures security through OTP verification and maintains a complete audit trail of all signing activities.

---

## Support

For questions or issues:
1. Check API responses for error messages
2. Verify `participantId` and `packageId` are correct
3. Ensure package status is "Sent"
4. Confirm email/phone matches participant assignment
5. Check OTP expiration and attempt limits
6. Review deep link configuration

---

**Version:** 1.0  
**Last Updated:** 2024

