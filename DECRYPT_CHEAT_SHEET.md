# Email Decryption Cheat Sheet 🔓

Quick reference for decrypting emails in your application.

---

## 🚀 Quick Start

### 1. Import the Function
```javascript
import { decryptEmail } from '@/utils/secureOTP';
```

### 2. Decrypt an Email
```javascript
const plainEmail = decryptEmail(user.emailEncrypted);
```

That's it! 🎉

---

## 📖 Common Patterns

### Pattern 1: Get User and Decrypt
```javascript
const user = await User.findById(userId);
const email = decryptEmail(user.emailEncrypted);
console.log(email); // "user@example.com"
```

### Pattern 2: Search by Email, Then Decrypt
```javascript
import { hashEmailForSearch, decryptEmail } from '@/utils/secureOTP';

// Hash email to search
const emailHash = hashEmailForSearch('user@example.com');

// Find user
const user = await User.findOne({ emailHash });

// Decrypt for display
const email = decryptEmail(user.emailEncrypted);
```

### Pattern 3: Decrypt for Email Sending
```javascript
const user = await User.findOne({ emailHash });
const recipientEmail = decryptEmail(user.emailEncrypted);

await transporter.sendMail({
  to: recipientEmail, // ← Use decrypted email
  subject: 'Hello!',
  html: '<p>Message</p>'
});
```

### Pattern 4: Decrypt for API Response
```javascript
const user = await User.findById(userId);

return NextResponse.json({
  user: {
    id: user._id,
    name: user.name,
    email: decryptEmail(user.emailEncrypted), // ← Decrypt for client
    role: user.role
  }
});
```

---

## 🛠️ Command Line Tools

### View One User's Email
```bash
node -e "
require('dotenv').config();
const { decryptEmail } = require('./src/utils/secureOTP.js');
const encrypted = 'PASTE_ENCRYPTED_EMAIL_HERE';
console.log(decryptEmail(encrypted));
"
```

### View All Users (Interactive)
```bash
node scripts/practice-decrypt.js
```

### View Specific User by ID
```bash
node scripts/view-users-with-emails.js
```

---

## 🎯 Real Examples from Your Code

### Example 1: Login Route
**File**: `src/app/api/auth/login/route.js`
```javascript
// After finding user...
const decryptedEmail = decryptEmail(user.emailEncrypted);

return NextResponse.json({
  user: {
    email: decryptedEmail // ← Sent to frontend
  }
});
```

### Example 2: Forgot Password
**File**: `src/app/api/auth/forgot-password/route.js`
```javascript
// Decrypt email for sending reset link
const decryptedEmail = decryptEmail(user.emailEncrypted);

await transporter.sendMail({
  to: decryptedEmail, // ← Send to decrypted email
  subject: 'Password Reset',
  html: resetEmailTemplate(resetToken)
});
```

### Example 3: Resend OTP
**File**: `src/app/api/auth/resend-otp/route.js`
```javascript
// Decrypt email for sending OTP
const decryptedEmail = decryptEmail(user.emailEncrypted);

await transporter.sendMail({
  to: decryptedEmail,
  subject: 'Your OTP Code',
  html: otpEmailTemplate(otp)
});
```

---

## ⚠️ Important Notes

### ✅ DO:
- Decrypt only when needed (display, send email)
- Decrypt in backend only
- Use HTTPS when sending to frontend

### ❌ DON'T:
- Don't send ENCRYPTION_KEY to frontend
- Don't store decrypted emails in database
- Don't log decrypted emails in production

---

## 🔍 Troubleshooting

### Error: "Encryption key not configured"
```bash
# Check if ENCRYPTION_KEY exists
node -e "require('dotenv').config(); console.log('Key exists:', !!process.env.ENCRYPTION_KEY);"
```

### Error: "Invalid encrypted data format"
```javascript
// Check format (should have 3 parts)
const parts = user.emailEncrypted.split(':');
console.log('Parts:', parts.length); // Should be 3
```

### Error: "Failed to decrypt email"
- Wrong ENCRYPTION_KEY
- Corrupted data
- Data encrypted with different key

---

## 📚 Full Documentation

- **Tutorial**: `TUTORIAL_DECRYPT_EMAIL.md`
- **Security Docs**: `docs/SECURITY_UPDATES_README.md`
- **Quick Start**: `QUICK_START_SECURITY.md`

---

## 🎓 Practice

Run the interactive practice script:
```bash
node scripts/practice-decrypt.js
```

Choose option 4 to practice encrypt/decrypt cycle!

---

**Remember**: The email is encrypted in the database for security. Only decrypt when you need to use it! 🔒
