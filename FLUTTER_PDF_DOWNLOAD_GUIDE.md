# Flutter App - PDF Download Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Guide for implementing PDF download functionality in Flutter mobile applications (for both participants and owners)

---

## Table of Contents

1. [Overview](#overview)
2. [Participant Download](#participant-download)
3. [Owner Download](#owner-download)
4. [Download Permissions](#download-permissions)
5. [PDF Content](#pdf-content)
6. [File Naming](#file-naming)
7. [Implementation Examples](#implementation-examples)
8. [Error Handling](#error-handling)

---

## Overview

The system allows both participants and package owners to download PDF documents. The downloaded PDF includes:
- Original document content
- All signatures (if signed)
- All filled form fields
- Complete audit trail page

### Key Features

- **Before Signing**: Participants can download if `allowDownloadUnsigned` is enabled
- **After Signing**: Always available for completed/rejected documents
- **Owner Access**: Owners can always download their packages
- **Processed PDF**: Includes signatures, field values, and audit trail

---

## Participant Download

### API Endpoint

**GET** `/api/packages/participant/{packageId}/{participantId}/download`

**Authentication:** Not required (public endpoint)

**Request Headers:**
```
Content-Type: application/json
```

**Response:**
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="{filename}"`
- **Body**: PDF file binary data

### Download Rules

1. **Always Allowed**: If document is finalized (status = "Completed" or "Rejected")
2. **Conditional**: If document is not finalized, requires `allowDownloadUnsigned: true`
3. **Blocked**: If document is not finalized and `allowDownloadUnsigned: false`

### Flutter Implementation

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

class ParticipantDownloadService {
  final String baseUrl = 'https://your-api-domain.com';
  
  Future<String> downloadPackage({
    required String packageId,
    required String participantId,
    Function(int, int)? onProgress, // (downloaded, total)
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/packages/participant/$packageId/$participantId/download'
    );
    
    final request = http.Request('GET', url);
    final streamedResponse = await http.Client().send(request);
    
    if (streamedResponse.statusCode != 200) {
      // Handle error response (might be JSON)
      final errorBody = await streamedResponse.stream.bytesToString();
      try {
        final errorJson = json.decode(errorBody);
        throw Exception(errorJson['error'] ?? 'Failed to download document');
      } catch (e) {
        throw Exception('Failed to download document: ${streamedResponse.statusCode}');
      }
    }
    
    // Extract filename from Content-Disposition header
    String fileName = 'document.pdf';
    final contentDisposition = streamedResponse.headers['content-disposition'];
    if (contentDisposition != null) {
      final match = RegExp(r'filename="(.+)"').firstMatch(contentDisposition);
      if (match != null && match.groupCount >= 1) {
        fileName = match.group(1)!;
      }
    }
    
    // Get total content length for progress tracking
    final contentLength = streamedResponse.contentLength ?? 0;
    
    // Request storage permission (Android)
    if (Platform.isAndroid) {
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        throw Exception('Storage permission denied');
      }
    }
    
    // Get download directory
    final directory = Platform.isAndroid
        ? await getExternalStorageDirectory()
        : await getApplicationDocumentsDirectory();
    
    if (directory == null) {
      throw Exception('Could not access storage directory');
    }
    
    final filePath = '${directory.path}/$fileName';
    final file = File(filePath);
    
    // Download and save file
    final sink = file.openWrite();
    int downloaded = 0;
    
    try {
      await for (final chunk in streamedResponse.stream) {
        sink.add(chunk);
        downloaded += chunk.length;
        
        if (onProgress != null && contentLength > 0) {
          onProgress(downloaded, contentLength);
        }
      }
      
      await sink.flush();
      await sink.close();
      
      return filePath;
    } catch (e) {
      await sink.close();
      if (await file.exists()) {
        await file.delete();
      }
      rethrow;
    }
  }
}
```

### UI Example

```dart
class DownloadButton extends StatefulWidget {
  final String packageId;
  final String participantId;
  final bool canDownload;
  
  const DownloadButton({
    Key? key,
    required this.packageId,
    required this.participantId,
    required this.canDownload,
  }) : super(key: key);
  
  @override
  State<DownloadButton> createState() => _DownloadButtonState();
}

class _DownloadButtonState extends State<DownloadButton> {
  final ParticipantDownloadService _downloadService = ParticipantDownloadService();
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  
  Future<void> _downloadDocument() async {
    if (!widget.canDownload) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Download is not available for this document.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });
    
    try {
      final filePath = await _downloadService.downloadPackage(
        packageId: widget.packageId,
        participantId: widget.participantId,
        onProgress: (downloaded, total) {
          setState(() {
            _downloadProgress = downloaded / total;
          });
        },
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Document downloaded successfully!'),
            backgroundColor: Colors.green,
            action: SnackBarAction(
              label: 'Open',
              onPressed: () {
                // Open file using file viewer
                // You can use packages like 'open_file' or 'file_picker'
              },
            ),
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
        setState(() {
          _isDownloading = false;
          _downloadProgress = 0.0;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        IconButton(
          icon: _isDownloading
              ? SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    value: _downloadProgress > 0 ? _downloadProgress : null,
                  ),
                )
              : Icon(Icons.download),
          tooltip: 'Download Document',
          onPressed: widget.canDownload && !_isDownloading ? _downloadDocument : null,
        ),
        if (_isDownloading && _downloadProgress > 0)
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: LinearProgressIndicator(value: _downloadProgress),
          ),
      ],
    );
  }
}
```

---

## Owner Download

### API Endpoint

**GET** `/api/packages/{packageId}/download`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Response:**
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="{filename}"`
- **Body**: PDF file binary data

### Download Rules

- **Always Allowed**: Owners can always download their packages regardless of status
- **No Restrictions**: Not affected by `allowDownloadUnsigned` setting

### Flutter Implementation

```dart
class OwnerDownloadService {
  final String baseUrl = 'https://your-api-domain.com';
  final String? authToken;
  
  Future<String> downloadPackage({
    required String packageId,
    Function(int, int)? onProgress,
  }) async {
    final url = Uri.parse('$baseUrl/api/packages/$packageId/download');
    
    final request = http.Request('GET', url);
    request.headers['Authorization'] = 'Bearer $authToken';
    
    final streamedResponse = await http.Client().send(request);
    
    if (streamedResponse.statusCode != 200) {
      final errorBody = await streamedResponse.stream.bytesToString();
      try {
        final errorJson = json.decode(errorBody);
        throw Exception(errorJson['error'] ?? 'Failed to download document');
      } catch (e) {
        throw Exception('Failed to download document: ${streamedResponse.statusCode}');
      }
    }
    
    // Extract filename from Content-Disposition header
    String fileName = 'document.pdf';
    final contentDisposition = streamedResponse.headers['content-disposition'];
    if (contentDisposition != null) {
      final match = RegExp(r'filename="(.+)"').firstMatch(contentDisposition);
      if (match != null && match.groupCount >= 1) {
        fileName = match.group(1)!;
      }
    }
    
    final contentLength = streamedResponse.contentLength ?? 0;
    
    // Request storage permission (Android)
    if (Platform.isAndroid) {
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        throw Exception('Storage permission denied');
      }
    }
    
    // Get download directory
    final directory = Platform.isAndroid
        ? await getExternalStorageDirectory()
        : await getApplicationDocumentsDirectory();
    
    if (directory == null) {
      throw Exception('Could not access storage directory');
    }
    
    final filePath = '${directory.path}/$fileName';
    final file = File(filePath);
    
    // Download and save file
    final sink = file.openWrite();
    int downloaded = 0;
    
    try {
      await for (final chunk in streamedResponse.stream) {
        sink.add(chunk);
        downloaded += chunk.length;
        
        if (onProgress != null && contentLength > 0) {
          onProgress(downloaded, contentLength);
        }
      }
      
      await sink.flush();
      await sink.close();
      
      return filePath;
    } catch (e) {
      await sink.close();
      if (await file.exists()) {
        await file.delete();
      }
      rethrow;
    }
  }
}
```

---

## Download Permissions

### `allowDownloadUnsigned` Setting

This setting controls whether participants can download documents before they are completed or rejected.

**Default Value**: `true`

**Behavior:**
- **`true`**: Participants can download at any time (before or after signing)
- **`false`**: Participants can only download after document is finalized (Completed/Rejected)

**Note**: This setting only affects participants. Owners can always download.

### Checking Download Availability

```dart
bool canParticipantDownload({
  required String packageStatus,
  required bool allowDownloadUnsigned,
}) {
  // Always allowed if document is finalized
  final isFinalized = packageStatus == 'Completed' || 
                      packageStatus == 'Rejected';
  
  if (isFinalized) {
    return true;
  }
  
  // For non-finalized documents, check allowDownloadUnsigned
  return allowDownloadUnsigned;
}
```

### UI Example

```dart
class DocumentDownloadSection extends StatelessWidget {
  final String packageStatus;
  final bool allowDownloadUnsigned;
  final String packageId;
  final String? participantId; // null if owner
  final String? authToken; // null if participant
  
  const DocumentDownloadSection({
    Key? key,
    required this.packageStatus,
    required this.allowDownloadUnsigned,
    required this.packageId,
    this.participantId,
    this.authToken,
  }) : super(key: key);
  
  bool get canDownload {
    if (participantId == null) {
      // Owner - always can download
      return true;
    }
    
    // Participant - check rules
    return canParticipantDownload(
      packageStatus: packageStatus,
      allowDownloadUnsigned: allowDownloadUnsigned,
    );
  }
  
  @override
  Widget build(BuildContext context) {
    if (!canDownload) {
      return Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: Colors.orange),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Download will be available after the document is completed or rejected.',
                  style: TextStyle(color: Colors.orange),
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    return DownloadButton(
      packageId: packageId,
      participantId: participantId,
      authToken: authToken,
      canDownload: canDownload,
    );
  }
}
```

---

## PDF Content

### What's Included in Downloaded PDF

The downloaded PDF is processed and includes:

1. **Original Document**: The base PDF file
2. **Signatures**: All signature fields with:
   - Signer name
   - Email address
   - Signing date and time
   - Signing method (Email OTP / SMS OTP)
   - OTP code (for audit)
   - IP address
3. **Form Fields**: All text, checkbox, and other field values filled in
4. **Audit Trail Page**: Last page contains:
   - Document creation date
   - All participants and their roles
   - Signing history with timestamps
   - Rejection/revocation details (if applicable)
   - Complete transaction log

### PDF Processing

The PDF is processed server-side using `pdfModifier.generatePdf()` which:
- Embeds signature text at field positions
- Fills form field values
- Adds audit trail page
- Maintains document integrity

---

## File Naming

### File Name Format

Downloaded files follow this naming convention:

```
{packageName}_{status}_{date}.pdf
```

**Example:**
```
Contract_Agreement_completed_2024-01-15.pdf
```

### File Name Components

1. **Package Name**: Sanitized (removes special characters, max 80 chars)
2. **Status**: Lowercase package status (e.g., "sent", "completed", "rejected")
3. **Date**: ISO date format (YYYY-MM-DD)

### Sanitization Rules

- Removes special characters: `<>:"/\|?*` and control characters
- Replaces spaces with underscores
- Truncates to 80 characters if needed
- Defaults to "document" if name is empty

### Flutter Implementation

```dart
String extractFileName(String? contentDisposition) {
  if (contentDisposition == null) {
    return 'document.pdf';
  }
  
  final match = RegExp(r'filename="(.+)"').firstMatch(contentDisposition);
  if (match != null && match.groupCount >= 1) {
    return match.group(1)!;
  }
  
  // Fallback: try unquoted filename
  final unquotedMatch = RegExp(r'filename=([^;]+)').firstMatch(contentDisposition);
  if (unquotedMatch != null && unquotedMatch.groupCount >= 1) {
    return unquotedMatch.group(1)!.trim();
  }
  
  return 'document.pdf';
}
```

---

## Implementation Examples

### Complete Service Class

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

class DocumentDownloadService {
  final String baseUrl = 'https://your-api-domain.com';
  final String? authToken;
  final bool isOwner;
  
  DocumentDownloadService({
    this.authToken,
    this.isOwner = false,
  });
  
  Future<String> downloadPackage({
    required String packageId,
    String? participantId,
    Function(int, int)? onProgress,
  }) async {
    // Build URL based on user type
    final Uri url;
    if (isOwner) {
      url = Uri.parse('$baseUrl/api/packages/$packageId/download');
    } else {
      if (participantId == null) {
        throw Exception('Participant ID is required for participant downloads');
      }
      url = Uri.parse(
        '$baseUrl/api/packages/participant/$packageId/$participantId/download'
      );
    }
    
    // Create request
    final request = http.Request('GET', url);
    if (authToken != null) {
      request.headers['Authorization'] = 'Bearer $authToken';
    }
    
    // Send request
    final streamedResponse = await http.Client().send(request);
    
    // Handle errors
    if (streamedResponse.statusCode != 200) {
      final errorBody = await streamedResponse.stream.bytesToString();
      try {
        final errorJson = json.decode(errorBody);
        throw Exception(errorJson['error'] ?? 'Failed to download document');
      } catch (e) {
        throw Exception(
          'Failed to download document: ${streamedResponse.statusCode}'
        );
      }
    }
    
    // Extract filename
    final fileName = _extractFileName(
      streamedResponse.headers['content-disposition']
    );
    
    // Request permissions
    if (Platform.isAndroid) {
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        throw Exception('Storage permission denied');
      }
    }
    
    // Get download directory
    final directory = Platform.isAndroid
        ? await getExternalStorageDirectory()
        : await getApplicationDocumentsDirectory();
    
    if (directory == null) {
      throw Exception('Could not access storage directory');
    }
    
    final filePath = '${directory.path}/$fileName';
    final file = File(filePath);
    
    // Download file
    final contentLength = streamedResponse.contentLength ?? 0;
    final sink = file.openWrite();
    int downloaded = 0;
    
    try {
      await for (final chunk in streamedResponse.stream) {
        sink.add(chunk);
        downloaded += chunk.length;
        
        if (onProgress != null && contentLength > 0) {
          onProgress(downloaded, contentLength);
        }
      }
      
      await sink.flush();
      await sink.close();
      
      return filePath;
    } catch (e) {
      await sink.close();
      if (await file.exists()) {
        await file.delete();
      }
      rethrow;
    }
  }
  
  String _extractFileName(String? contentDisposition) {
    if (contentDisposition == null) {
      return 'document.pdf';
    }
    
    final match = RegExp(r'filename="(.+)"').firstMatch(contentDisposition);
    if (match != null && match.groupCount >= 1) {
      return match.group(1)!;
    }
    
    return 'document.pdf';
  }
}
```

### Complete UI Component

```dart
class DocumentDownloadWidget extends StatefulWidget {
  final String packageId;
  final String packageName;
  final String packageStatus;
  final bool allowDownloadUnsigned;
  final bool isOwner;
  final String? participantId;
  final String? authToken;
  
  const DocumentDownloadWidget({
    Key? key,
    required this.packageId,
    required this.packageName,
    required this.packageStatus,
    required this.allowDownloadUnsigned,
    this.isOwner = false,
    this.participantId,
    this.authToken,
  }) : super(key: key);
  
  @override
  State<DocumentDownloadWidget> createState() => _DocumentDownloadWidgetState();
}

class _DocumentDownloadWidgetState extends State<DocumentDownloadWidget> {
  final DocumentDownloadService _downloadService = DocumentDownloadService();
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  
  bool get canDownload {
    if (widget.isOwner) {
      return true; // Owners can always download
    }
    
    final isFinalized = widget.packageStatus == 'Completed' || 
                        widget.packageStatus == 'Rejected';
    
    return isFinalized || widget.allowDownloadUnsigned;
  }
  
  Future<void> _downloadDocument() async {
    if (!canDownload) {
      _showMessage(
        'Download is not available for this document.',
        Colors.orange,
      );
      return;
    }
    
    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });
    
    try {
      final service = DocumentDownloadService(
        authToken: widget.authToken,
        isOwner: widget.isOwner,
      );
      
      final filePath = await service.downloadPackage(
        packageId: widget.packageId,
        participantId: widget.participantId,
        onProgress: (downloaded, total) {
          setState(() {
            _downloadProgress = downloaded / total;
          });
        },
      );
      
      if (mounted) {
        _showMessage(
          'Document downloaded successfully!\nLocation: $filePath',
          Colors.green,
        );
      }
    } catch (e) {
      if (mounted) {
        _showMessage('Error: ${e.toString()}', Colors.red);
      }
    } finally {
      if (mounted) {
        setState(() {
          _isDownloading = false;
          _downloadProgress = 0.0;
        });
      }
    }
  }
  
  void _showMessage(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: Duration(seconds: 3),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.description, color: Colors.blue),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.packageName,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            if (!canDownload)
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Download will be available after the document is completed or rejected.',
                        style: TextStyle(color: Colors.orange.shade900),
                      ),
                    ),
                  ],
                ),
              )
            else ...[
              ElevatedButton.icon(
                onPressed: _isDownloading ? null : _downloadDocument,
                icon: _isDownloading
                    ? SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          value: _downloadProgress > 0 ? _downloadProgress : null,
                        ),
                      )
                    : Icon(Icons.download),
                label: Text(_isDownloading ? 'Downloading...' : 'Download PDF'),
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 12),
                ),
              ),
              if (_isDownloading && _downloadProgress > 0) ...[
                SizedBox(height: 8),
                LinearProgressIndicator(value: _downloadProgress),
                SizedBox(height: 4),
                Text(
                  '${(_downloadProgress * 100).toStringAsFixed(1)}%',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ],
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

#### 1. Download Not Allowed
```
Error: "This document cannot be downloaded until it is completed or rejected."
```
**Solution**: Check `allowDownloadUnsigned` setting and document status.

#### 2. Package Not Found
```
Error: "Package not found."
```
**Solution**: Verify package ID is correct.

#### 3. Invalid Participant
```
Error: "You are not a valid participant for this package."
```
**Solution**: Verify participant ID matches the package assignment.

#### 4. Storage Permission Denied
```
Error: "Storage permission denied"
```
**Solution**: Request storage permission before downloading.

#### 5. File Not Found in S3
```
Error: "Package file not found in S3."
```
**Solution**: Contact support - this indicates a system issue.

### Error Handling Implementation

```dart
String _getUserFriendlyError(String error) {
  if (error.contains('cannot be downloaded')) {
    return 'Download is not available. The document must be completed or rejected first.';
  }
  
  if (error.contains('not found')) {
    return 'Document not found. Please check the document ID.';
  }
  
  if (error.contains('not a valid participant')) {
    return 'You do not have access to download this document.';
  }
  
  if (error.contains('permission denied')) {
    return 'Storage permission is required to download files. Please grant permission in settings.';
  }
  
  if (error.contains('S3')) {
    return 'Unable to access document file. Please try again later or contact support.';
  }
  
  return error;
}
```

---

## Summary

### Participant Download
- **Endpoint**: `GET /api/packages/participant/{packageId}/{participantId}/download`
- **Auth**: Not required
- **Rules**: Depends on `allowDownloadUnsigned` and document status
- **Always Allowed**: When document is Completed or Rejected

### Owner Download
- **Endpoint**: `GET /api/packages/{packageId}/download`
- **Auth**: Required (Bearer token)
- **Rules**: Always allowed regardless of status

### Key Points
1. **PDF Processing**: Downloaded PDF includes signatures, field values, and audit trail
2. **File Naming**: Automatic naming with status and date
3. **Permissions**: Check `allowDownloadUnsigned` for participant downloads
4. **Progress Tracking**: Implement progress indicators for better UX
5. **Error Handling**: Provide clear, user-friendly error messages

---

**Version:** 1.0  
**Last Updated:** 2024

