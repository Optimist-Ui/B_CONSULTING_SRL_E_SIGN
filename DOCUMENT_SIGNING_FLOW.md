# Document Signing Flow - API Documentation

This document describes the complete flow for signing documents in the e-signature system. Use this guide to implement the signing functionality in your Flutter application.

## Table of Contents
1. [Overview](#overview)
2. [Participant Access](#participant-access)
3. [Document Structure](#document-structure)
4. [Signature Flow Steps](#signature-flow-steps)
5. [API Endpoints](#api-endpoints)
6. [OTP Verification Process](#otp-verification-process)
7. [Complete Signing Flow Example](#complete-signing-flow-example)
8. [PDF Generation & Completion](#pdf-generation--completion)
9. [Important Notes for Flutter Development](#important-notes-for-flutter-development)

---

## Overview

The document signing system allows participants to sign documents digitally using a two-factor authentication method (Email OTP or SMS OTP). The flow ensures security and provides a complete audit trail.

**Key Concepts:**
- **Package**: A document that contains fields to be filled/signed
- **Participant**: A person assigned to sign or fill fields in the package
- **Field**: A position on the PDF where data needs to be entered (signature, text, checkbox)
- **Participant ID**: A unique identifier for each participant's assignment to a package
- **Field ID**: A unique identifier for each field in the package

---

## Participant Access

### Access URL Format
Participants access their document via a public URL:
```
/package/{packageId}/participant/{participantId}
```

**No authentication required** - The participantId serves as the authentication token.

### How Participants Get Access
1. Package owner creates a document and assigns participants
2. System sends email to each participant with their unique access link
3. Link format: `${CLIENT_URL}/package/{packageId}/participant/{participantId}`

---

## Document Structure

### Package Object (Simplified)
```json
{
  "_id": "packageId",
  "name": "Document Name",
  "status": "Sent" | "Completed" | "Rejected" | "Revoked",
  "fileUrl": "path/to/pdf",
  "fields": [
    {
      "id": "fieldId",
      "type": "signature" | "text" | "checkbox",
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 50,
      "page": 1,
      "label": "Signature Field",
      "assignedUsers": [
        {
          "id": "participantId",
          "contactId": "contactId",
          "contactName": "John Doe",
          "contactEmail": "john@example.com",
          "role": "Signer" | "FormFiller" | "Approver",
          "signatureMethods": ["Email OTP", "SMS OTP"],
          "signed": false,
          "signedAt": null,
          "signedMethod": null,
          "signedIP": null
        }
      ],
      "value": null | "text value" | { "signedBy": "...", "date": "...", ... }
    }
  ],
  "currentUser": {
    "id": "participantId",
    "contactId": "contactId",
    "contactName": "John Doe",
    "contactEmail": "john@example.com",
    "contactPhone": "+1234567890"
  }
}
```

---

## Signature Flow Steps

### High-Level Flow
1. **Participant accesses document** → Get package data
2. **Review document** → Display PDF with signature fields
3. **Agree to terms** → User must accept terms before signing
4. **Click signature field** → Open signing drawer/modal
5. **Choose signing method** → Email OTP or SMS OTP (if both available)
6. **Enter identity** → Email or phone number
7. **Request OTP** → System sends OTP code
8. **Enter OTP** → Verify code (6 digits, expires in 60 seconds)
9. **Complete signing** → Signature is applied to ALL signature fields assigned to the participant
10. **Document completion** → Check if all participants have signed, mark as "Completed"

---

## API Endpoints

All endpoints are **PUBLIC** (no authentication token required). The `participantId` in the URL acts as authentication.

### Base URL
```
/api/packages/participant/{packageId}/{participantId}
```

### 1. Get Package Data for Participant
**GET** `/api/packages/participant/{packageId}/{participantId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "package": { /* Package object */ }
  }
}
```

**Use this to:**
- Display the PDF document
- Show signature fields and their positions
- Display current user information
- Check if fields are already signed

---

### 2. Send Email OTP
**POST** `/api/packages/participant/{packageId}/{participantId}/send-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "email": "user@example.com"
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

**Validation:**
- Email must match the participant's assigned email
- Field must be a signature type
- Participant must have "Email OTP" in their signatureMethods
- Field must not already be signed
- Package status must be "Sent"

**OTP Details:**
- 6-digit code (100000-999999)
- Expires in 60 seconds
- One active OTP per field/participant (sends new one, deletes old)

---

### 3. Verify Email OTP
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

**Important:** 
- Verifying OTP for ONE field will sign **ALL signature fields** assigned to that participant
- The signature is applied to all matching fields automatically
- Updates all fields with signature metadata

**Validation:**
- OTP must be valid and not expired
- Maximum 4 incorrect attempts (then OTP is deleted)
- After 4 failed attempts, user must request new OTP

---

### 4. Send SMS OTP
**POST** `/api/packages/participant/{packageId}/{participantId}/send-sms-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "phone": "+1234567890"
}
```

**Response:** Same format as Email OTP

**Validation:** Same as Email OTP, but checks for "SMS OTP" in signatureMethods

---

### 5. Verify SMS OTP
**POST** `/api/packages/participant/{packageId}/{participantId}/verify-sms-otp`

**Request Body:**
```json
{
  "fieldId": "fieldId123",
  "otp": "123456"
}
```

**Response:** Same format as Email OTP verification

---

### Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here",
  "statusCode": 400
}
```

**Common Errors:**
- `"Package not found or not active."` - Package doesn't exist or status is not "Sent"
- `"Invalid participant"` - ParticipantId doesn't match
- `"Email does not match assigned participant."` - Email/phone mismatch
- `"Invalid or expired OTP."` - OTP wrong or expired
- `"Incorrect OTP."` - Wrong code entered
- `"Maximum OTP attempts exceeded."` - Too many failed attempts

---

## OTP Verification Process

### OTP Lifecycle
1. **Generation**: Random 6-digit number (100000-999999)
2. **Storage**: Stored in database with expiration (60 seconds)
3. **Delivery**: Sent via email or SMS
4. **Verification**: Compared with user input
5. **Cleanup**: Deleted after successful verification or expiration

### OTP Validation Rules
- ✅ Valid for 60 seconds from creation
- ✅ Maximum 4 incorrect attempts allowed
- ✅ After 4 failed attempts, OTP is deleted
- ✅ One active OTP per field/participant (new request deletes old one)
- ✅ Auto-expires via MongoDB TTL index

### Security Features
- IP address captured during verification
- Timestamp recorded for audit trail
- OTP code stored in signature metadata (for audit)
- Signature method recorded ("Email OTP" or "SMS OTP")

---

## Complete Signing Flow Example

### Step-by-Step Implementation

#### 1. User Opens Document
```
GET /api/packages/participant/abc123/participant456
```

Response contains:
- PDF URL (`fileUrl` or `downloadUrl`)
- All fields with positions (x, y, width, height, page)
- Current user info
- Field assignment status

#### 2. Display Document
- Load PDF from `fileUrl` or `downloadUrl`
- Render signature fields as overlays at positions from field data
- Show signature fields assigned to current participant

#### 3. User Clicks Signature Field
- Check if user agreed to terms (required before signing)
- Find the field by `fieldId`
- Check if field is already signed (check `value.signedBy`)
- Open signing modal/drawer

#### 4. Choose Signing Method
Check `assignedUsers[].signatureMethods`:
- If `["Email OTP"]` → Only email option
- If `["SMS OTP"]` → Only SMS option  
- If `["Email OTP", "SMS OTP"]` → Show both options

#### 5. Enter Identity
**For Email:**
```
POST /api/packages/participant/abc123/participant456/send-otp
{
  "fieldId": "fieldId123",
  "email": "john@example.com"
}
```

**For SMS:**
```
POST /api/packages/participant/abc123/participant456/send-sms-otp
{
  "fieldId": "fieldId123",
  "phone": "+1234567890"
}
```

**Important:** Email/phone must match `currentUser.contactEmail` or `currentUser.contactPhone`

#### 6. Display OTP Input
- Show 6-digit input field
- Display countdown timer (60 seconds)
- Enable "Resend OTP" button when timer expires

#### 7. Verify OTP
```
POST /api/packages/participant/abc123/participant456/verify-otp
{
  "fieldId": "fieldId123",
  "otp": "123456"
}
```

**On Success:**
- All signature fields for this participant are now signed
- Response includes updated package data
- Signature metadata is stored in field `value`:
```json
{
  "signedBy": "John Doe",
  "email": "john@example.com",
  "date": "2024-01-15T10:30:00.000Z",
  "method": "Email OTP",
  "ip": "192.168.1.1",
  "otpCode": "123456"
}
```

#### 8. Update UI
- Refresh package data
- Mark signed fields as completed
- Show signature details in field
- Check if document is completed (all participants signed)

---

## PDF Generation & Completion

### When Package is Completed
When all participants complete their assigned fields:
1. Package status changes to `"Completed"`
2. Completion notifications sent to all parties
3. Final PDF is generated with:
   - All signatures embedded
   - All form field values filled
   - Audit trail page added (last page)

### PDF Modifications
The system automatically:
- Embeds signature text onto PDF at field positions
- Adds signature metadata (name, email, date, method, OTP code)
- Fills text and checkbox fields
- Adds audit trail page with complete transaction history

### Signature Display on PDF
When a signature field is signed, the PDF shows:
```
John Doe
Email: john@example.com
Date: 1/15/2024, 10:30:00 AM
Method: Email OTP
OTP: 123456
Digitally Signed by I-Sign.eu
```

---

## Important Notes for Flutter Development

### 1. Participant Identification
- Use `participantId` from URL parameters - this is the key identifier
- Store `packageId` and `participantId` in your app state
- These IDs are unique per participant assignment (not per user)

### 2. Terms Agreement
- **CRITICAL**: User MUST agree to Terms of Use before any signing
- Check `hasAgreedToTerms` before allowing signature flow
- Display terms checkbox prominently
- Scroll to terms section if user tries to sign without agreement

### 3. Signature Field Display
- Fields have absolute positions: `x`, `y`, `width`, `height`, `page`
- Coordinate system: top-left corner is origin
- Fields may span multiple pages
- Only show fields where `isAssignedToCurrentUser === true`

### 4. Multiple Signature Fields
- One participant can have multiple signature fields
- **Important**: Verifying OTP for ONE field signs ALL signature fields for that participant
- This is intentional - one OTP verification signs all fields
- Update UI to reflect all fields signed after OTP verification

### 5. Field Value Structure
**Unsigned signature field:**
```json
{
  "value": null
}
```

**Signed signature field:**
```json
{
  "value": {
    "signedBy": "John Doe",
    "email": "john@example.com",
    "date": "2024-01-15T10:30:00.000Z",
    "method": "Email OTP",
    "ip": "192.168.1.1",
    "otpCode": "123456"
  }
}
```

### 6. OTP Handling
- OTP is 6 digits, numeric only
- 60-second expiration (implement countdown timer)
- Max 4 incorrect attempts (then must request new OTP)
- Display clear error messages for failed attempts
- Allow resending OTP after expiration

### 7. Error Handling
- All errors return `{ success: false, error: "message" }`
- Handle network errors gracefully
- Show user-friendly error messages
- Validate email/phone format before sending
- Check package expiry status

### 8. Real-time Updates (Optional)
- System supports WebSocket for real-time updates
- Consider polling package data after signing
- Refresh UI after successful OTP verification

### 9. Signature Method Selection
- Check `assignedUsers[].signatureMethods` array
- If only one method, skip selection step
- If both methods, show selection UI
- Validate selected method is available

### 10. Package Status
Valid states:
- `"Draft"` - Not sent, owner can edit
- `"Sent"` - Active, participants can sign
- `"Completed"` - All signatures collected
- `"Rejected"` - Participant rejected document
- `"Revoked"` - Owner revoked document
- `"Expired"` - Package expired

### 11. PDF Rendering
- Use PDF rendering library (e.g., `pdf_flutter`, `syncfusion_flutter_pdfviewer`)
- Render signature fields as overlays
- Match field positions precisely (x, y coordinates)
- Handle multi-page documents

### 12. Network Configuration
- All endpoints are public (no auth token)
- Include CORS headers if needed
- Handle timeout scenarios
- Implement retry logic for network failures

### 13. User Experience Flow
```
1. Load document → Show loading state
2. Display PDF → Show with signature fields
3. Check terms → Require agreement
4. Click field → Open signing modal
5. Select method → (if multiple options)
6. Enter email/phone → Validate format
7. Request OTP → Show loading, disable button
8. Display OTP input → Start 60s timer
9. Verify OTP → Show loading, validate format
10. Success → Close modal, update UI, show confirmation
```

### 14. State Management
Recommended state to track:
- Current package data
- Current user (participant) info
- Terms agreement status
- Active signing field ID
- OTP input value
- Timer countdown
- Loading states
- Error messages

### 15. Testing Checklist
- [ ] Test with Email OTP only
- [ ] Test with SMS OTP only
- [ ] Test with both methods available
- [ ] Test expired OTP handling
- [ ] Test maximum attempt limit
- [ ] Test with multiple signature fields (verify all sign at once)
- [ ] Test terms agreement requirement
- [ ] Test package expiry
- [ ] Test network error scenarios
- [ ] Test with already-signed fields

---

## Summary

The signing flow is a secure, step-by-step process:
1. Participant accesses via unique URL
2. Views document with signature fields
3. Agrees to terms
4. Chooses signing method (if multiple)
5. Enters email/phone
6. Receives and enters OTP
7. Signature applied to all assigned fields
8. Document completes when all participants sign

The system ensures security through OTP verification and maintains a complete audit trail of all signing activities.

---

## Support

For questions or issues:
1. Check API responses for error messages
2. Verify participantId and packageId are correct
3. Ensure package status is "Sent"
4. Confirm email/phone matches participant assignment
5. Check OTP expiration and attempt limits

