# Tutorial: How to Decrypt Emails

This tutorial teaches you how to decrypt encrypted email addresses in your application.

---

## 📚 Table of Contents
1. [Understanding the Encryption](#understanding-the-encryption)
2. [Method 1: In Your Code (API Routes)](#method-1-in-your-code-api-routes)
3. [Method 2: In Scripts](#method-2-in-scripts)
4. [Method 3: Quick Command Line](#method-3-quick-command-line)
5. [Method 4: MongoDB Compass/Atlas](#method-4-mongodb-compassatlas)
6. [Common Use Cases](#common-use-cases)
7. [Security Best Practices](#security-best-practices)

---

## Understanding the Encryption

### What's Stored in Database:
```javascript
{
  emailEncrypted: "6e6bc3cd583cda8d5593d5856f92b852:87bda13d98d961c32...",
  emailHash: "2df31f6dafa7f5befc117d056883bd8ad1dc9ee80ffcbac6a9..."
}
```

### Format Breakdown:
```
emailEncrypted = "IV:AuthTag:EncryptedData"
                  ↓    ↓         ↓
                  16   16      Variable
                 bytes bytes    length
```

- **IV** (Initialization Vector): Random 16 bytes for each encryption
- **AuthTag**: Authentication tag for AES-GCM (prevents tampering)
- **EncryptedData**: The actual encrypted email

---

## Method 1: In Your Code (API Routes)

### Step 1: Import the Function
```javascript
import { decryptEmail } from '@/utils/secureOTP';
```

### Step 2: Get User from Database
```javascript
// Search by email hash (you can't search by encrypted email)
const emailHash = hashEmailForSearch('user@example.com');
const user = await User.findOne({ emailHash });
```

### Step 3: Decrypt the Email
```javascript
const plainEmail = decryptEmail(user.emailEncrypted);
console.log(plainEmail); // Output: "user@example.com"
```

### Full Example (Login Route):
```javascript
import { decryptEmail, hashEmailForSearch } from '@/utils/secureOTP';
import User from '@/models/User';

export async function POST(req) {
  const { email, password } = await req.json();
  
  // 1. Hash the email to search
  const emailHash = hashEmailForSearch(email);
  
  // 2. Find user by hash
  const user = await User.findOne({ emailHash });
  
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  
  // 3. Decrypt email for response
  const decryptedEmail = decryptEmail(user.emailEncrypted);
  
  // 4. Return to client
  return NextResponse.json({
    user: {
      id: user._id,
      name: user.name,
      email: decryptedEmail, // ← Decrypted email
      role: user.role
    }
  });
}
```

---

## Method 2: In Scripts

### Create a Decryption Script:

**File: `scripts/decrypt-email.js`**
```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { decryptEmail } from '../src/utils/secureOTP.js';

dotenv.config();

async function decryptUserEmail(userId) {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findById(userId);
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const decrypted = decryptEmail(user.emailEncrypted);
  console.log('Decrypted Email:', decrypted);
  
  await mongoose.disconnect();
}

// Usage: node scripts/decrypt-email.js
const userId = process.argv[2] || '689f8fcd12345678'; // Replace with actual ID
decryptUserEmail(userId);
```

### Run the Script:
```bash
node scripts/decrypt-email.js 689f8fcd12345678
```

---

## Method 3: Quick Command Line

### Decrypt a Single Email:
```bash
node -e "
require('dotenv').config();
const { decryptEmail } = require('./src/utils/secureOTP.js');
const encrypted = '6e6bc3cd583cda8d5593d5856f92b852:87bda13d98d961c32...';
console.log(decryptEmail(encrypted));
"
```

### Decrypt All Users' Emails:
```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const { decryptEmail } = require('./src/utils/secureOTP.js');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find().limit(10);
  
  users.forEach(user => {
    const email = decryptEmail(user.emailEncrypted);
    console.log(user._id, '→', email);
  });
  
  mongoose.disconnect();
});
"
```

---

## Method 4: MongoDB Compass/Atlas

You **cannot** decrypt directly in MongoDB Compass or Atlas because:
- The ENCRYPTION_KEY is in your `.env` file (not in the database)
- Decryption requires Node.js crypto library

### Workaround: Create a View Script

**File: `scripts/view-users-with-emails.js`**
```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { decryptEmail } from '../src/utils/secureOTP.js';

dotenv.config();

async function viewUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find().select('_id name emailEncrypted role').limit(20);
  
  console.log('\n📋 Users List:\n');
  console.log('ID'.padEnd(25), 'Name'.padEnd(20), 'Email'.padEnd(30), 'Role');
  console.log('='.repeat(100));
  
  users.forEach(user => {
    const email = decryptEmail(user.emailEncrypted);
    console.log(
      user._id.toString().padEnd(25),
      (user.name || 'N/A').padEnd(20),
      email.padEnd(30),
      user.role || 'student'
    );
  });
  
  await mongoose.disconnect();
}

viewUsers();
```

### Run:
```bash
node scripts/view-users-with-emails.js
```

**Output:**
```
📋 Users List:

ID                        Name                 Email                          Role
====================================================================================================
689f8fcd12345678          John Doe             john@example.com               student
689f917212345678          Jane Smith           jane@example.com               teacher
...
```

---

## Common Use Cases

### 1. **Sending Emails** (Most Common)
```javascript
import { decryptEmail } from '@/utils/secureOTP';
import nodemailer from 'nodemailer';

// Get user
const user = await User.findOne({ emailHash });

// Decrypt email for sending
const recipientEmail = decryptEmail(user.emailEncrypted);

// Send email
await transporter.sendMail({
  to: recipientEmail, // ← Use decrypted email
  subject: 'Welcome!',
  html: '<p>Hello!</p>'
});
```

### 2. **Displaying in UI**
```javascript
// API Route
const user = await User.findById(userId);
const decryptedEmail = decryptEmail(user.emailEncrypted);

return NextResponse.json({
  user: {
    email: decryptedEmail // ← Send to frontend
  }
});
```

### 3. **Admin Dashboard**
```javascript
// Admin route to view all users
const users = await User.find().limit(50);

const usersWithEmails = users.map(user => ({
  id: user._id,
  name: user.name,
  email: decryptEmail(user.emailEncrypted), // ← Decrypt for admin view
  role: user.role
}));

return NextResponse.json({ users: usersWithEmails });
```

### 4. **Debugging/Testing**
```javascript
// In your test file
import { decryptEmail } from '@/utils/secureOTP';

test('should decrypt email correctly', () => {
  const encrypted = encryptEmail('test@example.com');
  const decrypted = decryptEmail(encrypted);
  expect(decrypted).toBe('test@example.com');
});
```

### 5. **Data Export**
```javascript
// Export users to CSV
const users = await User.find();

const csvData = users.map(user => ({
  id: user._id,
  name: user.name,
  email: decryptEmail(user.emailEncrypted), // ← Decrypt for export
  role: user.role
}));

// Convert to CSV and download
```

---

## Security Best Practices

### ✅ DO:
1. **Decrypt only when needed** (sending emails, displaying to user)
2. **Decrypt in backend** (never send ENCRYPTION_KEY to frontend)
3. **Use HTTPS** when sending decrypted emails to frontend
4. **Log carefully** (don't log decrypted emails in production)
5. **Limit access** (only authorized routes can decrypt)

### ❌ DON'T:
1. **Don't store decrypted emails** in variables longer than needed
2. **Don't send ENCRYPTION_KEY** to frontend
3. **Don't decrypt in frontend** (keep encryption key server-side only)
4. **Don't log decrypted emails** in production logs
5. **Don't cache decrypted emails** without encryption

---

## Example: Complete User Profile API

```javascript
import { NextResponse } from 'next/server';
import User from '@/models/User';
import { decryptEmail } from '@/utils/secureOTP';
import { verifyToken } from '@/utils/auth';

export async function GET(req) {
  try {
    // 1. Verify user is authenticated
    const token = req.cookies.get('token')?.value;
    const decoded = verifyToken(token);
    
    // 2. Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // 3. Decrypt email for response
    const decryptedEmail = decryptEmail(user.emailEncrypted);
    
    // 4. Return user profile
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: decryptedEmail, // ← Decrypted email
        role: user.role,
        photoURL: user.photoURL,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
```

---

## Troubleshooting

### Error: "Encryption key not configured"
**Solution**: Make sure ENCRYPTION_KEY is in your `.env` file
```bash
# Check if key exists
node -e "require('dotenv').config(); console.log('Key exists:', !!process.env.ENCRYPTION_KEY);"
```

### Error: "Invalid encrypted data format"
**Solution**: The encrypted data is corrupted or wrong format
```javascript
// Check format
const parts = encryptedEmail.split(':');
console.log('Parts:', parts.length); // Should be 3
```

### Error: "Failed to decrypt email"
**Solution**: Wrong ENCRYPTION_KEY or corrupted data
```javascript
// Verify you're using the same key that encrypted the data
// If you changed ENCRYPTION_KEY, old data cannot be decrypted
```

---

## Quick Reference

| Task | Function | Example |
|------|----------|---------|
| Encrypt email | `encryptEmail(email)` | `encryptEmail('user@example.com')` |
| Decrypt email | `decryptEmail(encrypted)` | `decryptEmail(user.emailEncrypted)` |
| Search by email | `hashEmailForSearch(email)` | `User.findOne({ emailHash })` |

---

## Summary

**To decrypt an email:**
1. Import `decryptEmail` from `@/utils/secureOTP`
2. Get user from database (has `emailEncrypted` field)
3. Call `decryptEmail(user.emailEncrypted)`
4. Use the plain text email

**Remember**: Only decrypt when you need to display or send the email. Keep it encrypted in the database at all times!

---

Need help? Check:
- `src/utils/secureOTP.js` - Encryption/decryption functions
- `docs/SECURITY_UPDATES_README.md` - Full security documentation
- `QUICK_START_SECURITY.md` - Quick reference guide
