# Flutter App - Package Listing & Document Viewing Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Complete guide for implementing package listing, details viewing, and PDF document display in Flutter mobile applications

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Package List](#getting-package-list)
3. [Getting Package Details](#getting-package-details)
4. [Displaying PDF Documents](#displaying-pdf-documents)
5. [Package Status Handling](#package-status-handling)
6. [Downloading Documents](#downloading-documents)
7. [Complete Implementation Examples](#complete-implementation-examples)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## Overview

This guide covers how to:
- **List Packages**: Fetch and display all packages with filtering and pagination
- **View Package Details**: Get detailed information about a specific package
- **Display PDF**: Load and render PDF documents in the app
- **Handle Status**: Work with different package statuses (Draft, Sent, Completed, etc.)
- **Download Documents**: Download PDF documents for offline viewing

### Key Concepts

- **Package**: A document that has been created and may be sent for signing
- **Package Status**: Current state of the package (Draft, Sent, Completed, etc.)
- **Download URL**: Temporary signed URL for accessing PDF (expires in 1 hour)
- **File URL**: Permanent URL to the PDF file (may require authentication)
- **S3 Key**: AWS S3 object key for direct file access

### Package Statuses

- **Draft**: Package is being created/edited, not sent yet
- **Sent**: Package has been sent to participants for signing
- **Completed**: All participants have completed their required actions
- **Rejected**: A participant rejected the document
- **Revoked**: Owner revoked the document
- **Expired**: Package expired
- **Archived**: Package has been archived

---

## Getting Package List

### API Endpoint

**GET** `/api/packages`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `status` (optional): Filter by status (`All`, `Draft`, `Pending`, `Finished`, `Rejected`, `Expired`, `Revoked`)
- `name` (optional): Search by package name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortKey` (optional): Sort by (`name`, `status`, `addedOn`)
- `sortDirection` (optional): Sort direction (`asc`, `desc`)

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "packageId123",
        "name": "Employment Contract - John Doe",
        "status": "Sent",
        "fileUrl": "https://s3.amazonaws.com/bucket/path/to/document.pdf",
        "downloadUrl": "https://s3.amazonaws.com/bucket/path/to/document.pdf?signature=...&expires=...",
        "s3Key": "packages/user123/uuid-123-456.pdf",
        "attachment_uuid": "uuid-123-456",
        "templateId": "templateId123",
        "fields": [
          {
            "id": "fieldId1",
            "type": "signature",
            "page": 1,
            "x": 100,
            "y": 200,
            "width": 200,
            "height": 50,
            "required": true,
            "label": "Employee Signature",
            "assignedUsers": [
              {
                "id": "participantId1",
                "contactId": "contactId1",
                "contactName": "John Doe",
                "contactEmail": "john@example.com",
                "role": "Signer",
                "signatureMethods": ["Email OTP", "SMS OTP"],
                "signed": false,
                "signedAt": null,
                "signedMethod": null
              }
            ]
          }
        ],
        "receivers": [
          {
            "id": "receiverId1",
            "contactId": "contactId1",
            "contactName": "John Doe",
            "contactEmail": "john@example.com"
          }
        ],
        "options": {
          "expiresAt": "2024-12-31T23:59:59.000Z",
          "sendExpirationReminders": true,
          "reminderPeriod": "1_day_before",
          "sendAutomaticReminders": true,
          "firstReminderDays": 3,
          "repeatReminderDays": 2,
          "allowDownloadUnsigned": true,
          "allowReassign": true,
          "allowReceiversToAdd": true
        },
        "customMessage": "Please review and sign this document",
        "participants": [
          {
            "contactId": "contactId1",
            "contactName": "John Doe",
            "contactEmail": "john@example.com",
            "phone": "+1234567890",
            "roles": ["Signer"],
            "status": "In Progress"
          }
        ],
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalDocuments": 50,
      "limit": 10
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
  final String? authToken;
  
  PackageService({this.authToken});
  
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };
  
  Future<PackageListResponse> getPackages({
    String? status,
    String? name,
    int page = 1,
    int limit = 10,
    String? sortKey,
    String? sortDirection,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (status != null && status.isNotEmpty && status != 'All') {
      queryParams['status'] = status;
    }
    if (name != null && name.isNotEmpty) {
      queryParams['name'] = name;
    }
    if (sortKey != null) {
      queryParams['sortKey'] = sortKey;
    }
    if (sortDirection != null) {
      queryParams['sortDirection'] = sortDirection;
    }
    
    final uri = Uri.parse('$baseUrl/api/packages').replace(
      queryParameters: queryParams,
    );
    
    final response = await http.get(uri, headers: _headers);
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return PackageListResponse.fromJson(jsonData['data']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch packages');
    }
  }
}

// Data Models
class PackageListResponse {
  final List<PackageListItem> documents;
  final PaginationInfo pagination;
  
  PackageListResponse({
    required this.documents,
    required this.pagination,
  });
  
  factory PackageListResponse.fromJson(Map<String, dynamic> json) {
    return PackageListResponse(
      documents: (json['documents'] as List)
          .map((d) => PackageListItem.fromJson(d))
          .toList(),
      pagination: PaginationInfo.fromJson(json['pagination']),
    );
  }
}

class PackageListItem {
  final String id;
  final String name;
  final String status;
  final String fileUrl;
  final String? downloadUrl;
  final String? s3Key;
  final String? attachmentUuid;
  final String? templateId;
  final List<DocumentField> fields;
  final List<Receiver> receivers;
  final PackageOptions options;
  final String? customMessage;
  final List<ParticipantInfo> participants;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  PackageListItem({
    required this.id,
    required this.name,
    required this.status,
    required this.fileUrl,
    this.downloadUrl,
    this.s3Key,
    this.attachmentUuid,
    this.templateId,
    required this.fields,
    required this.receivers,
    required this.options,
    this.customMessage,
    required this.participants,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory PackageListItem.fromJson(Map<String, dynamic> json) {
    return PackageListItem(
      id: json['_id'],
      name: json['name'],
      status: json['status'],
      fileUrl: json['fileUrl'],
      downloadUrl: json['downloadUrl'],
      s3Key: json['s3Key'],
      attachmentUuid: json['attachment_uuid'],
      templateId: json['templateId'],
      fields: (json['fields'] as List?)
          ?.map((f) => DocumentField.fromJson(f))
          .toList() ?? [],
      receivers: (json['receivers'] as List?)
          ?.map((r) => Receiver.fromJson(r))
          .toList() ?? [],
      options: PackageOptions.fromJson(json['options'] ?? {}),
      customMessage: json['customMessage'],
      participants: (json['participants'] as List?)
          ?.map((p) => ParticipantInfo.fromJson(p))
          .toList() ?? [],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
  
  // Helper methods
  int get totalParticipants => participants.length;
  int get completedParticipants => participants.where((p) => p.status == 'Completed').length;
  bool get isInProgress => status == 'Sent';
  bool get isCompleted => status == 'Completed';
  bool get isDraft => status == 'Draft';
  bool get isExpired => status == 'Expired';
  bool get isRevoked => status == 'Revoked';
  
  String get statusDisplayText {
    switch (status) {
      case 'Draft':
        return 'Draft';
      case 'Sent':
        return 'In Progress';
      case 'Completed':
        return 'Completed';
      case 'Rejected':
        return 'Rejected';
      case 'Revoked':
        return 'Revoked';
      case 'Expired':
        return 'Expired';
      case 'Archived':
        return 'Archived';
      default:
        return status;
    }
  }
}

class ParticipantInfo {
  final String contactId;
  final String contactName;
  final String contactEmail;
  final String? phone;
  final List<String> roles;
  final String status; // 'Pending', 'In Progress', 'Completed', 'Not Sent'
  
  ParticipantInfo({
    required this.contactId,
    required this.contactName,
    required this.contactEmail,
    this.phone,
    required this.roles,
    required this.status,
  });
  
  factory ParticipantInfo.fromJson(Map<String, dynamic> json) {
    return ParticipantInfo(
      contactId: json['contactId'],
      contactName: json['contactName'],
      contactEmail: json['contactEmail'],
      phone: json['phone'],
      roles: (json['roles'] as List?)?.map((r) => r.toString()).toList() ?? [],
      status: json['status'] ?? 'Not Sent',
    );
  }
}

class PaginationInfo {
  final int currentPage;
  final int totalPages;
  final int totalDocuments;
  final int limit;
  
  PaginationInfo({
    required this.currentPage,
    required this.totalPages,
    required this.totalDocuments,
    required this.limit,
  });
  
  factory PaginationInfo.fromJson(Map<String, dynamic> json) {
    return PaginationInfo(
      currentPage: json['currentPage'],
      totalPages: json['totalPages'],
      totalDocuments: json['totalDocuments'],
      limit: json['limit'],
    );
  }
  
  bool get hasNextPage => currentPage < totalPages;
  bool get hasPreviousPage => currentPage > 1;
}
```

---

## Getting Package Details

### API Endpoint

**GET** `/api/packages/{packageId}`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "_id": "packageId123",
    "name": "Employment Contract - John Doe",
    "status": "Sent",
    "fileUrl": "https://s3.amazonaws.com/bucket/path/to/document.pdf",
    "downloadUrl": "https://s3.amazonaws.com/bucket/path/to/document.pdf?signature=...&expires=...",
    "s3Key": "packages/user123/uuid-123-456.pdf",
    "attachment_uuid": "uuid-123-456",
    "templateId": {
      "_id": "templateId123",
      "name": "Employment Contract Template",
      "attachment_uuid": "uuid-123-456",
      "fileUrl": "https://s3.amazonaws.com/bucket/template.pdf"
    },
    "fields": [
      {
        "id": "fieldId1",
        "type": "signature",
        "page": 1,
        "x": 100,
        "y": 200,
        "width": 200,
        "height": 50,
        "required": true,
        "label": "Employee Signature",
        "placeholder": "",
        "options": [],
        "assignedUsers": [
          {
            "id": "participantId1",
            "contactId": "contactId1",
            "contactName": "John Doe",
            "contactEmail": "john@example.com",
            "role": "Signer",
            "signatureMethods": ["Email OTP", "SMS OTP"],
            "signed": false,
            "signedAt": null,
            "signedMethod": null
          }
        ],
        "value": null
      }
    ],
    "receivers": [
      {
        "id": "receiverId1",
        "contactId": "contactId1",
        "contactName": "John Doe",
        "contactEmail": "john@example.com"
      }
    ],
    "options": {
      "expiresAt": "2024-12-31T23:59:59.000Z",
      "sendExpirationReminders": true,
      "reminderPeriod": "1_day_before",
      "sendAutomaticReminders": true,
      "firstReminderDays": 3,
      "repeatReminderDays": 2,
      "allowDownloadUnsigned": true,
      "allowReassign": true,
      "allowReceiversToAdd": true
    },
    "customMessage": "Please review and sign this document",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Flutter Implementation

```dart
class PackageService {
  // ... previous code ...
  
  Future<PackageDetail> getPackageById(String packageId) async {
    final url = Uri.parse('$baseUrl/api/packages/$packageId');
    
    final response = await http.get(url, headers: _headers);
    
    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      return PackageDetail.fromJson(jsonData['data']);
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch package details');
    }
  }
}

class PackageDetail {
  final String id;
  final String name;
  final String status;
  final String fileUrl;
  final String? downloadUrl;
  final String? s3Key;
  final String? attachmentUuid;
  final TemplateInfo? templateId;
  final List<DocumentField> fields;
  final List<Receiver> receivers;
  final PackageOptions options;
  final String? customMessage;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  PackageDetail({
    required this.id,
    required this.name,
    required this.status,
    required this.fileUrl,
    this.downloadUrl,
    this.s3Key,
    this.attachmentUuid,
    this.templateId,
    required this.fields,
    required this.receivers,
    required this.options,
    this.customMessage,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory PackageDetail.fromJson(Map<String, dynamic> json) {
    return PackageDetail(
      id: json['_id'],
      name: json['name'],
      status: json['status'],
      fileUrl: json['fileUrl'],
      downloadUrl: json['downloadUrl'],
      s3Key: json['s3Key'],
      attachmentUuid: json['attachment_uuid'],
      templateId: json['templateId'] != null
          ? TemplateInfo.fromJson(json['templateId'])
          : null,
      fields: (json['fields'] as List?)
          ?.map((f) => DocumentField.fromJson(f))
          .toList() ?? [],
      receivers: (json['receivers'] as List?)
          ?.map((r) => Receiver.fromJson(r))
          .toList() ?? [],
      options: PackageOptions.fromJson(json['options'] ?? {}),
      customMessage: json['customMessage'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
  
  // Helper methods
  String? get pdfUrl => downloadUrl ?? fileUrl;
  bool get canViewPdf => pdfUrl != null;
  bool get hasExpiration => options.expiresAt != null;
  bool get isExpired {
    if (!hasExpiration) return false;
    return options.expiresAt!.isBefore(DateTime.now());
  }
  
  int get totalFields => fields.length;
  int get totalReceivers => receivers.length;
  int get completedFields => fields.where((f) => f.isCompleted).length;
}

class TemplateInfo {
  final String id;
  final String name;
  final String attachmentUuid;
  final String fileUrl;
  
  TemplateInfo({
    required this.id,
    required this.name,
    required this.attachmentUuid,
    required this.fileUrl,
  });
  
  factory TemplateInfo.fromJson(Map<String, dynamic> json) {
    return TemplateInfo(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      attachmentUuid: json['attachment_uuid'],
      fileUrl: json['fileUrl'],
    );
  }
}
```

---

## Displaying PDF Documents

### Overview

To display PDF documents in Flutter, you need to:
1. Download the PDF from the URL
2. Load it into a PDF viewer
3. Render the PDF pages

### Recommended PDF Viewer Libraries

- **syncfusion_flutter_pdfviewer** (Recommended)
- **flutter_pdfview**
- **pdfx**
- **pdf_render**

### Implementation

```dart
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:typed_data';

class DocumentViewerScreen extends StatefulWidget {
  final PackageDetail package;
  
  const DocumentViewerScreen({
    Key? key,
    required this.package,
  }) : super(key: key);
  
  @override
  State<DocumentViewerScreen> createState() => _DocumentViewerScreenState();
}

class _DocumentViewerScreenState extends State<DocumentViewerScreen> {
  final PdfViewerController _pdfController = PdfViewerController();
  Uint8List? _pdfBytes;
  bool _isLoading = true;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _loadPdf();
  }
  
  Future<void> _loadPdf() async {
    if (!widget.package.canViewPdf) {
      setState(() {
        _error = 'PDF URL not available';
        _isLoading = false;
      });
      return;
    }
    
    try {
      setState(() => _isLoading = true);
      
      // Use downloadUrl if available (signed URL), otherwise use fileUrl
      final pdfUrl = widget.package.downloadUrl ?? widget.package.fileUrl;
      
      final response = await http.get(Uri.parse(pdfUrl!));
      
      if (response.statusCode == 200) {
        setState(() {
          _pdfBytes = response.bodyBytes;
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load PDF: ${response.statusCode}');
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
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.package.name),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadPdf,
            tooltip: 'Reload PDF',
          ),
          IconButton(
            icon: Icon(Icons.download),
            onPressed: _downloadPdf,
            tooltip: 'Download PDF',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }
  
  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading document...'),
          ],
        ),
      );
    }
    
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red),
            SizedBox(height: 16),
            Text(
              'Error loading PDF',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadPdf,
              child: Text('Retry'),
            ),
          ],
        ),
      );
    }
    
    if (_pdfBytes == null) {
      return Center(
        child: Text('No PDF data available'),
      );
    }
    
    return SfPdfViewer.memory(
      _pdfBytes!,
      controller: _pdfController,
      onDocumentLoaded: (PdfDocumentLoadedDetails details) {
        print('PDF loaded: ${details.document.pages.count} pages');
      },
      onDocumentLoadFailed: (PdfDocumentLoadFailedDetails details) {
        setState(() {
          _error = details.error;
        });
      },
    );
  }
  
  Future<void> _downloadPdf() async {
    // Implementation for downloading PDF
    // You can use path_provider and file saving
  }
}
```

### Alternative: Using Network URL Directly

If you prefer to load PDF directly from URL without downloading first:

```dart
Widget _buildPdfViewer() {
  final pdfUrl = widget.package.downloadUrl ?? widget.package.fileUrl;
  
  if (pdfUrl == null) {
    return Center(child: Text('PDF URL not available'));
  }
  
  return SfPdfViewer.network(
    pdfUrl,
    controller: _pdfController,
    onDocumentLoaded: (PdfDocumentLoadedDetails details) {
      print('PDF loaded: ${details.document.pages.count} pages');
    },
    onDocumentLoadFailed: (PdfDocumentLoadFailedDetails details) {
      setState(() {
        _error = details.error;
      });
    },
  );
}
```

---

## Package Status Handling

### Status-Based UI

Different statuses require different UI elements:

```dart
class PackageListItemWidget extends StatelessWidget {
  final PackageListItem package;
  final VoidCallback onTap;
  
  const PackageListItemWidget({
    Key? key,
    required this.package,
    required this.onTap,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: _buildStatusIcon(),
        title: Text(package.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(package.statusDisplayText),
            if (package.isInProgress)
              Text(
                '${package.completedParticipants}/${package.totalParticipants} completed',
                style: TextStyle(fontSize: 12),
              ),
            if (package.hasExpiration)
              Text(
                'Expires: ${DateFormat('MMM dd, yyyy').format(package.options.expiresAt!)}',
                style: TextStyle(fontSize: 12),
              ),
          ],
        ),
        trailing: Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
  
  Widget _buildStatusIcon() {
    Color statusColor;
    IconData statusIcon;
    
    switch (package.status) {
      case 'Draft':
        statusColor = Colors.grey;
        statusIcon = Icons.edit;
        break;
      case 'Sent':
        statusColor = Colors.blue;
        statusIcon = Icons.send;
        break;
      case 'Completed':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        break;
      case 'Rejected':
        statusColor = Colors.orange;
        statusIcon = Icons.cancel;
        break;
      case 'Revoked':
        statusColor = Colors.red;
        statusIcon = Icons.block;
        break;
      case 'Expired':
        statusColor = Colors.red.shade300;
        statusIcon = Icons.access_time;
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.description;
    }
    
    return Container(
      padding: EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(statusIcon, color: statusColor, size: 24),
    );
  }
}
```

---

## Downloading Documents

### API Endpoint for Download

**GET** `/api/packages/{packageId}/download`

**Authentication:** Required (Bearer token)

**Response:** PDF file binary stream

### Flutter Implementation

```dart
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';

class PackageService {
  // ... previous code ...
  
  Future<File> downloadPackagePdf(String packageId) async {
    final url = Uri.parse('$baseUrl/api/packages/$packageId/download');
    
    final response = await http.get(url, headers: _headers);
    
    if (response.statusCode == 200) {
      // Get download directory
      final directory = await _getDownloadDirectory();
      
      // Get package name for filename
      final package = await getPackageById(packageId);
      final fileName = _sanitizeFileName(package.name);
      
      // Save file
      final file = File('${directory.path}/$fileName.pdf');
      await file.writeAsBytes(response.bodyBytes);
      
      return file;
    } else {
      final errorData = json.decode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to download PDF');
    }
  }
  
  Future<Directory> _getDownloadDirectory() async {
    if (Platform.isAndroid) {
      // Request storage permission
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        throw Exception('Storage permission denied');
      }
      
      // Use external storage for downloads
      final directory = Directory('/storage/emulated/0/Download');
      if (!await directory.exists()) {
        await directory.create(recursive: true);
      }
      return directory;
    } else if (Platform.isIOS) {
      // iOS downloads directory
      final directory = await getApplicationDocumentsDirectory();
      return Directory('${directory.path}/Downloads');
    }
    
    // Fallback
    return await getApplicationDocumentsDirectory();
  }
  
  String _sanitizeFileName(String name) {
    return name
        .replaceAll(RegExp(r'[<>:"/\\|?*]'), '')
        .replaceAll(' ', '_')
        .substring(0, name.length > 80 ? 80 : name.length);
  }
}
```

---

## Complete Implementation Examples

### Package List Screen

```dart
class PackageListScreen extends StatefulWidget {
  @override
  State<PackageListScreen> createState() => _PackageListScreenState();
}

class _PackageListScreenState extends State<PackageListScreen> {
  final PackageService _packageService = PackageService(authToken: 'your_token');
  
  List<PackageListItem> _packages = [];
  bool _isLoading = false;
  String? _error;
  String _selectedStatus = 'All';
  String _searchQuery = '';
  int _currentPage = 1;
  bool _hasMorePages = true;
  
  @override
  void initState() {
    super.initState();
    _loadPackages();
  }
  
  Future<void> _loadPackages({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _packages.clear();
    }
    
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final response = await _packageService.getPackages(
        status: _selectedStatus != 'All' ? _selectedStatus : null,
        name: _searchQuery.isNotEmpty ? _searchQuery : null,
        page: _currentPage,
        limit: 10,
        sortKey: 'addedOn',
        sortDirection: 'desc',
      );
      
      setState(() {
        _packages.addAll(response.documents);
        _hasMorePages = response.pagination.hasNextPage;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }
  
  Future<void> _loadMore() async {
    if (!_hasMorePages || _isLoading) return;
    
    _currentPage++;
    await _loadPackages();
  }
  
  void _onPackageTap(PackageListItem package) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PackageDetailScreen(packageId: package.id),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Documents'),
        actions: [
          IconButton(
            icon: Icon(Icons.search),
            onPressed: () {
              // Show search dialog
              _showSearchDialog();
            },
          ),
          IconButton(
            icon: Icon(Icons.filter_list),
            onPressed: () {
              // Show filter dialog
              _showFilterDialog();
            },
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to package creation
        },
        child: Icon(Icons.add),
      ),
    );
  }
  
  Widget _buildBody() {
    if (_isLoading && _packages.isEmpty) {
      return Center(child: CircularProgressIndicator());
    }
    
    if (_error != null && _packages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red),
            SizedBox(height: 16),
            Text('Error: $_error'),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadPackages(refresh: true),
              child: Text('Retry'),
            ),
          ],
        ),
      );
    }
    
    if (_packages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.description, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No documents found'),
          ],
        ),
      );
    }
    
    return RefreshIndicator(
      onRefresh: () => _loadPackages(refresh: true),
      child: ListView.builder(
        itemCount: _packages.length + (_hasMorePages ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _packages.length) {
            return Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          
          final package = _packages[index];
          return PackageListItemWidget(
            package: package,
            onTap: () => _onPackageTap(package),
          );
        },
      ),
    );
  }
  
  void _showSearchDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Search Documents'),
        content: TextField(
          decoration: InputDecoration(
            hintText: 'Enter document name',
            border: OutlineInputBorder(),
          ),
          onChanged: (value) {
            _searchQuery = value;
          },
        ),
        actions: [
          TextButton(
            onPressed: () {
              _searchQuery = '';
              Navigator.pop(context);
            },
            child: Text('Clear'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _loadPackages(refresh: true);
            },
            child: Text('Search'),
          ),
        ],
      ),
    );
  }
  
  void _showFilterDialog() {
    final statuses = ['All', 'Draft', 'Sent', 'Completed', 'Rejected', 'Revoked', 'Expired'];
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Filter by Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: statuses.map((status) {
            return RadioListTile<String>(
              title: Text(status),
              value: status,
              groupValue: _selectedStatus,
              onChanged: (value) {
                setState(() => _selectedStatus = value!);
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _loadPackages(refresh: true);
            },
            child: Text('Apply'),
          ),
        ],
      ),
    );
  }
}
```

### Package Detail Screen

```dart
class PackageDetailScreen extends StatefulWidget {
  final String packageId;
  
  const PackageDetailScreen({
    Key? key,
    required this.packageId,
  }) : super(key: key);
  
  @override
  State<PackageDetailScreen> createState() => _PackageDetailScreenState();
}

class _PackageDetailScreenState extends State<PackageDetailScreen> {
  final PackageService _packageService = PackageService(authToken: 'your_token');
  
  PackageDetail? _package;
  bool _isLoading = true;
  String? _error;
  int _selectedTab = 0; // 0: Details, 1: PDF View
  
  @override
  void initState() {
    super.initState();
    _loadPackageDetails();
  }
  
  Future<void> _loadPackageDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final package = await _packageService.getPackageById(widget.packageId);
      setState(() {
        _package = package;
        _isLoading = false;
      });
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
        appBar: AppBar(title: Text('Loading...')),
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
              Icon(Icons.error_outline, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text('Error: $_error'),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadPackageDetails,
                child: Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    
    if (_package == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Not Found')),
        body: Center(child: Text('Package not found')),
      );
    }
    
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(_package!.name),
          bottom: TabBar(
            onTap: (index) {
              setState(() => _selectedTab = index);
            },
            tabs: [
              Tab(icon: Icon(Icons.info), text: 'Details'),
              Tab(icon: Icon(Icons.picture_as_pdf), text: 'PDF'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildDetailsTab(),
            _package!.canViewPdf
                ? DocumentViewerScreen(package: _package!)
                : Center(child: Text('PDF not available')),
          ],
        ),
      ),
    );
  }
  
  Widget _buildDetailsTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStatusCard(),
          SizedBox(height: 16),
          _buildInfoCard(),
          SizedBox(height: 16),
          _buildParticipantsCard(),
          SizedBox(height: 16),
          _buildFieldsCard(),
        ],
      ),
    );
  }
  
  Widget _buildStatusCard() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Status',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Chip(
              label: Text(_package!.statusDisplayText),
              backgroundColor: _getStatusColor().withOpacity(0.1),
              labelStyle: TextStyle(color: _getStatusColor()),
            ),
            if (_package!.hasExpiration) ...[
              SizedBox(height: 8),
              Text(
                'Expires: ${DateFormat('MMM dd, yyyy HH:mm').format(_package!.options.expiresAt!)}',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ],
        ),
      ),
    );
  }
  
  Widget _buildInfoCard() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Information',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            _buildInfoRow('Created', DateFormat('MMM dd, yyyy HH:mm').format(_package!.createdAt)),
            _buildInfoRow('Last Updated', DateFormat('MMM dd, yyyy HH:mm').format(_package!.updatedAt)),
            _buildInfoRow('Total Fields', _package!.totalFields.toString()),
            _buildInfoRow('Receivers', _package!.totalReceivers.toString()),
            if (_package!.customMessage != null)
              _buildInfoRow('Message', _package!.customMessage!),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
  
  Widget _buildParticipantsCard() {
    // Build participants list
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Participants',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            // List participants
          ],
        ),
      ),
    );
  }
  
  Widget _buildFieldsCard() {
    // Build fields list
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Fields',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            // List fields
          ],
        ),
      ),
    );
  }
  
  Color _getStatusColor() {
    switch (_package!.status) {
      case 'Draft':
        return Colors.grey;
      case 'Sent':
        return Colors.blue;
      case 'Completed':
        return Colors.green;
      case 'Rejected':
        return Colors.orange;
      case 'Revoked':
        return Colors.red;
      case 'Expired':
        return Colors.red.shade300;
      default:
        return Colors.grey;
    }
  }
}
```

---

## Error Handling

### Common Errors

#### 1. Package Not Found
```
Error: "Package not found or you do not have permission to view it."
```
**Solution**: Verify package ID and user authentication.

#### 2. PDF Load Failed
```
Error: "Failed to load PDF: 404"
```
**Solution**: Check if downloadUrl is valid and not expired (expires in 1 hour).

#### 3. Network Error
```
Error: "Network error"
```
**Solution**: Check internet connection and retry.

### Error Handling Implementation

```dart
String _getUserFriendlyError(String error) {
  if (error.contains('not found')) {
    return 'Document not found or you do not have permission to view it.';
  }
  
  if (error.contains('Failed to load PDF')) {
    return 'Failed to load PDF document. The link may have expired. Please refresh.';
  }
  
  if (error.contains('Network')) {
    return 'Network error. Please check your internet connection.';
  }
  
  return error;
}
```

---

## Best Practices

### 1. Caching PDF Documents

Cache downloaded PDFs to reduce network usage:

```dart
class PdfCache {
  static final Map<String, Uint8List> _cache = {};
  
  static Uint8List? get(String url) {
    return _cache[url];
  }
  
  static void put(String url, Uint8List data) {
    _cache[url] = data;
  }
  
  static void clear() {
    _cache.clear();
  }
}
```

### 2. Signed URL Expiration

Signed URLs expire after 1 hour. Handle expiration:

```dart
DateTime? _urlExpirationTime;
Uint8List? _cachedPdfBytes;

Future<void> _loadPdfWithExpiration() async {
  // Check if URL is still valid
  if (_urlExpirationTime != null && 
      DateTime.now().isAfter(_urlExpirationTime!)) {
    // URL expired, reload package to get new URL
    await _loadPackageDetails();
  }
  
  // Use cached PDF if available
  if (_cachedPdfBytes != null) {
    setState(() => _pdfBytes = _cachedPdfBytes);
    return;
  }
  
  // Download PDF
  await _loadPdf();
}
```

### 3. Pagination

Implement infinite scroll or pagination for package lists:

```dart
ScrollController _scrollController = ScrollController();

@override
void initState() {
  super.initState();
  _scrollController.addListener(_onScroll);
}

void _onScroll() {
  if (_scrollController.position.pixels >= 
      _scrollController.position.maxScrollExtent * 0.9) {
    _loadMore();
  }
}
```

### 4. Refresh on Pull

Implement pull-to-refresh:

```dart
RefreshIndicator(
  onRefresh: () async {
    await _loadPackages(refresh: true);
  },
  child: ListView.builder(...),
)
```

---

## Summary

### Key Points

1. **Package Listing**:
   - Use GET `/api/packages` with filters and pagination
   - Handle different package statuses
   - Implement search and filtering

2. **Package Details**:
   - Use GET `/api/packages/{packageId}` for full details
   - Includes downloadUrl (signed URL, expires in 1 hour)
   - Contains all fields, receivers, and options

3. **PDF Display**:
   - Use `syncfusion_flutter_pdfviewer` or similar library
   - Download PDF bytes or use network URL
   - Handle loading and error states

4. **Download**:
   - Use GET `/api/packages/{packageId}/download` for owner
   - Save to device storage with proper permissions

5. **Status Handling**:
   - Different UI for different statuses
   - Show progress indicators for "Sent" packages
   - Handle expired/revoked states

---

**Version:** 1.0  
**Last Updated:** 2024



