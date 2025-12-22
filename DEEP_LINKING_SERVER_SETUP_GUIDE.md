# Deep Linking Setup Guide - Server Side Requirements

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Guide for setting up deep linking between server emails and mobile app

---

## Table of Contents

1. [Overview](#overview)
2. [Current Server Implementation](#current-server-implementation)
3. [How Deep Linking Works](#how-deep-linking-works)
4. [Server-Side Requirements](#server-side-requirements)
5. [Universal Links Setup (iOS)](#universal-links-setup-ios)
6. [App Links Setup (Android)](#app-links-setup-android)
7. [Server Configuration Options](#server-configuration-options)
8. [Testing Deep Links](#testing-deep-links)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Deep linking allows email links to open directly in your mobile app instead of the web browser. This guide explains:

- ✅ How the server currently generates links
- ✅ What server-side configuration is needed
- ✅ How to set up Universal Links (iOS) and App Links (Android)
- ✅ Server requirements for deep linking to work

### Key Concepts

**Universal Links (iOS)** and **App Links (Android)**:
- Use HTTPS URLs (same as web links)
- Automatically open in app if installed, otherwise open in browser
- No custom URL schemes needed
- More secure and user-friendly

**Custom URL Schemes** (Alternative):
- Format: `yourapp://reset-password/{token}`
- Requires server to send different links for mobile
- Less secure, requires user confirmation

---

## Current Server Implementation

### How Links Are Generated

The server uses the `CLIENT_URL` environment variable to generate all email links:

**Password Reset Link:**
```javascript
// api/src/services/EmailService.js
const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
```

**Email Verification Link:**
```javascript
const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
```

**Document Signing Link:**
```javascript
// api/src/services/PackageService.js
const actionLink = `${process.env.CLIENT_URL}/package/${pkg._id}/participant/${participant.id}`;
```

### Current Link Format

All links follow this pattern:
```
https://yourdomain.com/{path}/{token}
```

**Examples:**
- `https://yourdomain.com/reset-password/abc123...`
- `https://yourdomain.com/verify-email/def456...`
- `https://yourdomain.com/package/packageId/participant/participantId`

### Environment Variable

**`.env` file:**
```bash
CLIENT_URL=https://yourdomain.com
```

**Default (development):**
```bash
CLIENT_URL=http://localhost:5173
```

---

## How Deep Linking Works

### Universal Links / App Links Flow

```
┌─────────────┐
│   Email     │
│   Link      │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ User Clicks     │
│ HTTPS Link      │
└──────┬──────────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ App         │  │ Browser     │  │ App Store   │
│ Installed?  │  │ (fallback)  │  │ (if needed) │
└──────┬──────┘  └─────────────┘  └─────────────┘
       │
       ▼
┌─────────────────┐
│ App Opens       │
│ with Token      │
└─────────────────┘
```

### How It Works

1. **Server sends email** with HTTPS link: `https://yourdomain.com/reset-password/{token}`
2. **User clicks link** in email app
3. **System checks**:
   - Is app installed?
   - Does app claim this domain?
   - Is the path registered?
4. **If yes**: Opens in mobile app
5. **If no**: Opens in web browser (fallback)

---

## Server-Side Requirements

### ✅ What You Already Have

1. **HTTPS URLs**: ✅ Server generates HTTPS links
2. **Consistent URL format**: ✅ All links use same pattern
3. **Token in URL**: ✅ Tokens are included in path

### ⚠️ What You Need to Add

1. **Domain Verification Files** (Required for Universal/App Links)
   - `.well-known/apple-app-site-association` (iOS)
   - `.well-known/assetlinks.json` (Android)

2. **HTTPS with Valid SSL Certificate** (Required)
   - Must be valid, trusted certificate
   - Must serve files over HTTPS

3. **Server Configuration** (Optional but Recommended)
   - Content-Type headers for verification files
   - Proper MIME types
   - CORS if needed

---

## Universal Links Setup (iOS)

### Step 1: Create Apple App Site Association File

**File Path:** `/.well-known/apple-app-site-association`

**Location:** Must be served from your web server root (same domain as `CLIENT_URL`)

**File Content:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.yourapp.bundle",
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

**Important:**
- Replace `TEAM_ID` with your Apple Developer Team ID
- Replace `com.yourapp.bundle` with your app's bundle identifier
- No file extension (`.json` is NOT allowed)
- Must be served with `Content-Type: application/json`
- Must be accessible via HTTPS

### Step 2: Server Configuration

**Express.js Example:**
```javascript
// api/src/app.js or web server config

// Serve apple-app-site-association file
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, '../public/.well-known/apple-app-site-association'));
});
```

**Nginx Example:**
```nginx
location /.well-known/apple-app-site-association {
    default_type application/json;
    add_header Content-Type application/json;
    alias /path/to/your/apple-app-site-association;
}
```

### Step 3: Verify File Accessibility

**Test URL:**
```
https://yourdomain.com/.well-known/apple-app-site-association
```

**Requirements:**
- ✅ Returns 200 OK
- ✅ Content-Type: `application/json`
- ✅ No redirects
- ✅ Valid JSON
- ✅ Accessible without authentication

### Step 4: iOS App Configuration

**In Xcode:**
1. Open your project
2. Select your app target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Associated Domains"
6. Add domain: `applinks:yourdomain.com`

**Info.plist (if not using Xcode):**
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:yourdomain.com</string>
</array>
```

---

## App Links Setup (Android)

### Step 1: Generate SHA-256 Fingerprint

**Get your app's signing certificate fingerprint:**

```bash
# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias
```

**Look for:**
```
SHA256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

### Step 2: Create Asset Links File

**File Path:** `/.well-known/assetlinks.json`

**File Content:**
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.yourapp.package",
    "sha256_cert_fingerprints": [
      "XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX"
    ]
  }
}]
```

**Important:**
- Replace `com.yourapp.package` with your app's package name
- Replace SHA-256 fingerprint with your actual fingerprint
- Must be served with `Content-Type: application/json`
- Must be accessible via HTTPS

### Step 3: Server Configuration

**Express.js Example:**
```javascript
// Serve assetlinks.json file
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, '../public/.well-known/assetlinks.json'));
});
```

**Nginx Example:**
```nginx
location /.well-known/assetlinks.json {
    default_type application/json;
    add_header Content-Type application/json;
    alias /path/to/your/assetlinks.json;
}
```

### Step 4: Verify File Accessibility

**Test URL:**
```
https://yourdomain.com/.well-known/assetlinks.json
```

**Requirements:**
- ✅ Returns 200 OK
- ✅ Content-Type: `application/json`
- ✅ No redirects
- ✅ Valid JSON
- ✅ Accessible without authentication

### Step 5: Android App Configuration

**AndroidManifest.xml:**
```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTop">
    
    <!-- Existing intent filter -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
    </intent-filter>
    
    <!-- App Links intent filter -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data
            android:scheme="https"
            android:host="yourdomain.com"
            android:pathPrefix="/reset-password"/>
    </intent-filter>
    
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data
            android:scheme="https"
            android:host="yourdomain.com"
            android:pathPrefix="/verify-email"/>
    </intent-filter>
    
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data
            android:scheme="https"
            android:host="yourdomain.com"
            android:pathPrefix="/package"/>
    </intent-filter>
</activity>
```

---

## Server Configuration Options

### Option 1: Serve Files from Web Server (Recommended)

**Best for:** When web app and API are on same domain

**Setup:**
1. Place verification files in web app's `public/.well-known/` folder
2. Web server automatically serves them
3. No API changes needed

**File Structure:**
```
web/
  public/
    .well-known/
      apple-app-site-association
      assetlinks.json
```

### Option 2: Serve Files from API Server

**Best for:** When API and web app are on different domains

**Setup:**
1. Create `public/.well-known/` folder in API project
2. Add Express route to serve files
3. Ensure files are accessible

**Express.js Route:**
```javascript
// api/src/app.js
const path = require('path');
const express = require('express');

// Serve verification files
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(
    path.join(__dirname, 'public/.well-known/apple-app-site-association')
  );
});

app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(
    path.join(__dirname, 'public/.well-known/assetlinks.json')
  );
});
```

### Option 3: Serve from Static File Server

**Best for:** CDN or separate static file hosting

**Setup:**
1. Upload files to static file server
2. Ensure proper Content-Type headers
3. Verify HTTPS access

---

## Testing Deep Links

### Test Universal Links (iOS)

**1. Verify File Accessibility:**
```bash
curl -I https://yourdomain.com/.well-known/apple-app-site-association
```

**Expected:**
```
HTTP/2 200
content-type: application/json
```

**2. Test Link in Safari:**
- Open Safari on iOS device
- Type URL: `https://yourdomain.com/reset-password/test123`
- Should show banner: "Open in [App Name]"

**3. Test from Email:**
- Send test email with link
- Click link in Mail app
- Should open in app (if installed)

### Test App Links (Android)

**1. Verify File Accessibility:**
```bash
curl -I https://yourdomain.com/.well-known/assetlinks.json
```

**Expected:**
```
HTTP/2 200
content-type: application/json
```

**2. Verify Domain Association:**
```bash
adb shell pm get-app-links com.yourapp.package
```

**Expected output should show your domain.**

**3. Test Link:**
```bash
adb shell am start -a android.intent.action.VIEW -d "https://yourdomain.com/reset-password/test123"
```

**4. Test from Email:**
- Send test email with link
- Click link in Gmail/Email app
- Should open in app (if installed)

### Online Verification Tools

**iOS:**
- Apple's validator: Use Apple's App Site Association validator (internal tool)
- Test in Safari on iOS device

**Android:**
- Google's Digital Asset Links API:
  ```
  https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://yourdomain.com&relation=delegate_permission/common.handle_all_urls
  ```

---

## Troubleshooting

### Issue: Files Not Accessible

**Symptoms:**
- 404 errors when accessing verification files
- Deep links not working

**Solutions:**
1. Check file paths are correct
2. Verify web server configuration
3. Ensure files are in correct location
4. Check file permissions
5. Verify HTTPS is working

### Issue: Wrong Content-Type

**Symptoms:**
- Files accessible but deep links don't work
- Browser downloads file instead of displaying

**Solutions:**
1. Set `Content-Type: application/json` header
2. Verify in response headers
3. Check server configuration

### Issue: Redirects

**Symptoms:**
- Files redirect to another URL
- Deep links fail verification

**Solutions:**
1. Ensure files are served directly (no redirects)
2. Check for trailing slashes
3. Verify URL structure

### Issue: iOS Not Opening App

**Symptoms:**
- Link opens in Safari instead of app
- No "Open in App" banner

**Solutions:**
1. Verify Associated Domains capability is added
2. Check bundle identifier matches
3. Verify Team ID is correct
4. Ensure app is installed
5. Try reinstalling app
6. Check iOS version (Universal Links require iOS 9+)

### Issue: Android Not Opening App

**Symptoms:**
- Link opens in browser instead of app
- App chooser appears

**Solutions:**
1. Verify `android:autoVerify="true"` is set
2. Check package name matches
3. Verify SHA-256 fingerprint is correct
4. Clear app data and reinstall
5. Check Android version (App Links require Android 6.0+)
6. Verify domain association:
   ```bash
   adb shell pm verify-app-links --re-verify com.yourapp.package
   ```

### Issue: HTTPS Certificate Problems

**Symptoms:**
- Verification files not accessible
- Browser shows security warnings

**Solutions:**
1. Ensure valid SSL certificate
2. Check certificate chain is complete
3. Verify certificate is not expired
4. Test with SSL Labs: https://www.ssllabs.com/ssltest/

---

## Server-Side Checklist

### ✅ Required Setup

- [ ] **HTTPS Enabled**: Valid SSL certificate on domain
- [ ] **CLIENT_URL Configured**: Environment variable set correctly
- [ ] **Verification Files Created**:
  - [ ] `.well-known/apple-app-site-association` (iOS)
  - [ ] `.well-known/assetlinks.json` (Android)
- [ ] **Files Accessible**: Both files return 200 OK via HTTPS
- [ ] **Content-Type Headers**: Both files served with `application/json`
- [ ] **No Redirects**: Files served directly, no redirects

### ✅ Optional Enhancements

- [ ] **Multiple Environments**: Different files for dev/staging/prod
- [ ] **Monitoring**: Log deep link clicks
- [ ] **Analytics**: Track app opens vs web opens
- [ ] **Fallback Handling**: Web page for when app not installed

---

## Example Server Implementation

### Complete Express.js Setup

```javascript
// api/src/app.js
const express = require('express');
const path = require('path');

const app = express();

// Serve Apple App Site Association (iOS Universal Links)
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  const association = {
    applinks: {
      apps: [],
      details: [
        {
          appID: process.env.IOS_TEAM_ID + '.' + process.env.IOS_BUNDLE_ID,
          paths: [
            '/reset-password/*',
            '/verify-email/*',
            '/package/*/participant/*',
            '/package/*/participant/*/review'
          ]
        }
      ]
    }
  };
  
  res.json(association);
});

// Serve Android Asset Links (Android App Links)
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: process.env.ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: [
          process.env.ANDROID_SHA256_FINGERPRINT
        ]
      }
    }
  ];
  
  res.json(assetLinks);
});

// Health check for verification files
app.get('/.well-known/health', (req, res) => {
  res.json({
    status: 'ok',
    files: {
      'apple-app-site-association': 'configured',
      'assetlinks.json': 'configured'
    }
  });
});
```

### Environment Variables

**.env file:**
```bash
# Existing
CLIENT_URL=https://yourdomain.com

# New (for deep linking)
IOS_TEAM_ID=ABC123XYZ
IOS_BUNDLE_ID=com.yourapp.bundle
ANDROID_PACKAGE_NAME=com.yourapp.package
ANDROID_SHA256_FINGERPRINT=XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

---

## Summary

### What the Server Needs to Do

1. ✅ **Continue using `CLIENT_URL`** - No changes needed to email generation
2. ✅ **Serve verification files** - Add routes for `.well-known` files
3. ✅ **Ensure HTTPS** - Valid SSL certificate required
4. ✅ **Set Content-Type** - `application/json` for verification files

### What the Mobile App Needs to Do

1. ✅ **Configure Associated Domains** (iOS) or **App Links** (Android)
2. ✅ **Handle incoming URLs** - Extract tokens and navigate
3. ✅ **Test deep links** - Verify app opens from email links

### Key Points

- ✅ **No server code changes needed** for email generation
- ✅ **Same URLs work for web and mobile** (Universal/App Links)
- ✅ **Automatic fallback** to web if app not installed
- ✅ **More secure** than custom URL schemes
- ✅ **Better user experience** - seamless app opening

---

## Additional Resources

- [Apple Universal Links Documentation](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [Digital Asset Links API](https://developers.google.com/digital-asset-links/v1/getting-started)

---

**End of Document**

