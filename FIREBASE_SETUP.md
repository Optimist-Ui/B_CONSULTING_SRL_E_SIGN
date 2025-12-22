# Firebase Service Account Configuration Guide

This guide explains how to configure Firebase Admin SDK for push notifications in the backend.

## Option 1: Environment Variable (JSON String) - Recommended for Development

### Step 1: Get Your Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file (e.g., `firebase-service-account.json`)

### Step 2: Convert to Single-Line JSON String

**Method A: Using Node.js (Recommended)**

```bash
# In your terminal, run:
node -e "console.log(JSON.stringify(require('./firebase-service-account.json')))"
```

Copy the output (it will be a single-line JSON string).

**Method B: Manual (for small files)**

Remove all newlines and extra spaces from the JSON file, making it a single line.

### Step 3: Add to Environment Variables

**For `.env` file (local development):**

```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'
```

**Important Notes:**
- Use single quotes `'...'` around the JSON string in `.env` files
- Or escape double quotes: `FIREBASE_SERVICE_ACCOUNT="{\"type\":\"service_account\",...}"`

**For production (GitHub Secrets, AWS, etc.):**

```bash
# Set as environment variable
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'
```

---

## Option 2: Base64 Encoded (Recommended for Production)

This method is more reliable for special characters and multi-line JSON.

### Step 1: Encode Your JSON File

**Using Node.js:**

```bash
node -e "console.log(require('fs').readFileSync('./firebase-service-account.json').toString('base64'))"
```

**Using command line (Linux/Mac):**

```bash
base64 -i firebase-service-account.json
```

**Using PowerShell (Windows):**

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\firebase-service-account.json"))
```

### Step 2: Add to Environment Variables

```env
FIREBASE_SERVICE_ACCOUNT=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InlvdXItcHJvamVjdC1pZCIs...
```

The service will automatically detect and decode base64 encoded values.

---

## Option 3: File Path (Recommended for Local Development)

If you prefer to keep the JSON file in your project:

### Step 1: Store the File Securely

```bash
# Create a secure directory (add to .gitignore!)
mkdir -p api/config/secrets
mv firebase-service-account.json api/config/secrets/
```

**Add to `.gitignore`:**

```
api/config/secrets/
*.json
!package.json
!package-lock.json
```

### Step 2: Set Environment Variable

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/secrets/firebase-service-account.json
```

Or use absolute path:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
```

---

## Example Service Account JSON Structure

Your Firebase service account JSON should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

---

## Verification

After setting up, start your server and look for one of these messages:

- ✅ `Firebase Admin SDK initialized from environment variable`
- ✅ `Firebase Admin SDK initialized from file path`
- ⚠️ `Firebase Admin SDK not initialized` (if configuration is missing)

---

## Security Best Practices

1. **Never commit service account files to Git**
   - Add to `.gitignore`
   - Use environment variables in production

2. **Use different service accounts for different environments**
   - Development, UAT, Production should have separate accounts

3. **Rotate keys regularly**
   - Generate new keys periodically
   - Update environment variables

4. **Limit permissions**
   - Service account should only have necessary Firebase permissions
   - Use IAM roles to restrict access

5. **Use secrets management in production**
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager
   - GitHub Secrets (for CI/CD)

---

## Troubleshooting

### Error: "Invalid FIREBASE_SERVICE_ACCOUNT format"

**Solution:**
- Check that JSON is valid (use a JSON validator)
- Ensure all quotes are properly escaped
- Try base64 encoding method instead

### Error: "Failed to parse FIREBASE_SERVICE_ACCOUNT"

**Solution:**
- Verify the JSON string is complete (not truncated)
- Check for special characters that need escaping
- Try using base64 encoding

### Firebase not initializing

**Solution:**
- Check environment variable is set: `echo $FIREBASE_SERVICE_ACCOUNT`
- Verify the service account has correct permissions
- Check Firebase project is active

---

## Quick Setup Script

Create a helper script to encode your service account:

```javascript
// scripts/encode-firebase-credentials.js
const fs = require('fs');
const path = require('path');

const serviceAccountPath = process.argv[2] || './firebase-service-account.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

console.log('\n=== Firebase Service Account Configuration ===\n');
console.log('Option 1: JSON String (single line):');
console.log(JSON.stringify(serviceAccount));
console.log('\n\nOption 2: Base64 Encoded:');
console.log(Buffer.from(JSON.stringify(serviceAccount)).toString('base64'));
console.log('\n');
```

Usage:
```bash
node scripts/encode-firebase-credentials.js firebase-service-account.json
```

