# How Email Works in Your Authentication System

## Complete Registration Flow with Email

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

STEP 1: User Registers
┌─────────────────────┐
│  Frontend/cURL      │
│  POST /auth/register│
│  {                  │
│   "email": "user@.. │
│   "password": "..." │
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│       AuthService.register()            │
│ ✓ Validate email & password             │
│ ✓ Check email not already used          │
│ ✓ Hash password with bcrypt             │
│ ✓ Generate 6-digit OTP                  │
│ ✓ Save to pending_registrations table   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      EmailService.sendOtpEmail()        │
│                                         │
│ Sends email with:                       │
│ ✓ Subject: Your OTP Code                │
│ ✓ Body: 6-digit OTP (123456)            │
│ ✓ Warning: Expires in 10 minutes        │
│ ✓ HTML + Plain text format              │
│                                         │
│ If email fails:                         │
│ → Logs to console as fallback           │
│ → User can continue (OTP in logs)       │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      Response to User                   │
│ {                                       │
│   "message": "Registration submitted.   │
│              OTP sent to your email"    │
│ }                                       │
└─────────────────────────────────────────┘


STEP 2: User Checks Email
┌──────────────────────────────┐
│  User's Email Inbox          │
│                              │
│  ┌────────────────────────┐  │
│  │ Subject: Your OTP Code │  │
│  │ From: your-email@g...  │  │
│  │                        │  │
│  │ Your OTP Code:         │  │
│  │                        │  │
│  │    1 2 3 4 5 6         │  │
│  │                        │  │
│  │ Expires in 10 minutes  │  │
│  └────────────────────────┘  │
│                              │
│  Copy the OTP: 123456        │
└──────────────────────────────┘


STEP 3: User Verifies OTP
┌─────────────────────┐
│  Frontend/cURL      │
│  POST /auth/        │
│    verify-otp       │
│  {                  │
│   "email": "user@..│
│   "otp": "123456"   │
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────┐
│    AuthService.verifyOtp()           │
│ ✓ Find pending registration by email │
│ ✓ Check OTP is correct               │
│ ✓ Check OTP not expired (10 min max) │
│ ✓ Check attempts < 5                 │
│ ✓ Create user in users table         │
│ ✓ Delete from pending_registrations  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  EmailService.sendWelcomeEmail()     │
│                                      │
│ Sends email with:                    │
│ ✓ Subject: Welcome to Project!       │
│ ✓ Body: Account verified             │
│ ✓ Contains: Login link                │
│ ✓ HTML + Plain text format           │
│                                      │
│ If email fails:                      │
│ → Just logs error (registration OK)  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│    Response to User                  │
│ {                                    │
│   "message": "Registration          │
│              successful",             │
│   "token": "eyJhbGc..." (JWT token) │
│ }                                    │
│                                      │
│ User can now login!                  │
└──────────────────────────────────────┘


OPTIONAL: Resend OTP
┌────────────────────────┐
│  Frontend/cURL         │
│  POST /auth/resend-otp │
│  {                     │
│   "email": "user@..."  │
│  }                     │
└────────────┬───────────┘
             │
             ▼
┌──────────────────────────────────┐
│   AuthService.resendOtp()        │
│ ✓ Find pending registration      │
│ ✓ Generate new OTP               │
│ ✓ Reset attempt counter to 0     │
│ ✓ Update expiry time             │
└────────────┬────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  EmailService.sendOtpEmail()     │
│ (Same as first email)            │
│ ✓ Send new OTP code              │
└────────────┬────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│    Response to User              │
│ {                                │
│   "message": "OTP resent to      │
│              your email"          │
│ }                                │
└──────────────────────────────────┘
```

## Email Templates

### Email 1: OTP Code Email
```
To: user@example.com
Subject: Your OTP Code - Project Authentication

Body (HTML):
┌────────────────────────────────────┐
│  Welcome to Project!               │
│                                    │
│  Your One-Time Password (OTP)      │
│  for account verification is:      │
│                                    │
│       1 2 3 4 5 6                 │
│                                    │
│  Important:                        │
│  • This OTP will expire in         │
│    10 minutes                      │
│  • Do not share this code          │
│  • If you didn't request this,     │
│    ignore this email               │
│                                    │
│  Thank you for registering!        │
└────────────────────────────────────┘
```

### Email 2: Welcome Email
```
To: user@example.com
Subject: Welcome to Project!

Body (HTML):
┌────────────────────────────────────┐
│  Welcome User!                     │
│                                    │
│  Your account has been            │
│  successfully verified and         │
│  activated.                        │
│                                    │
│  You can now login to your         │
│  account and start using all       │
│  the features.                     │
│                                    │
│  [Login to Your Account] (link)    │
│                                    │
│  If you have any questions,        │
│  contact support.                  │
│                                    │
│  Happy exploring!                  │
└────────────────────────────────────┘
```

## What Happens If Email Fails?

### Scenario 1: SMTP Not Configured
```
Action: User registers
Result: Email fails to send
Behavior:
  ✓ OTP is still saved to database
  ✓ OTP is logged to console
  ✓ User sees success message
  ✓ User can copy OTP from console logs

Example console output:
[DEV] OTP for user@gmail.com: 123456 (Email service failed)
```

### Scenario 2: SMTP Configured But Server Down
```
Action: User registers
Result: Email service error
Behavior:
  ✓ OTP is still saved to database
  ✓ OTP is logged to console (fallback)
  ✓ User sees success message
  ✓ User can retry with resend-otp endpoint
```

### Scenario 3: Invalid Email Address
```
Action: User registers with invalid email
Result: Email service rejects it
Behavior:
  ✓ Email validation happens first
  ✓ @IsEmail() decorator validates format
  ✓ Invalid email rejected before OTP sent
  ✓ User gets validation error
```

## OTP Validation Rules

When verifying OTP:

```
✓ Email must exist in pending_registrations
  └─ If not → Error: "No pending registration found"

✓ OTP must match saved OTP
  └─ If not → Error: "Invalid OTP. N attempts remaining"
  └─ Increment attempts counter

✓ OTP must not be expired (10 minutes)
  └─ If expired → Error: "OTP expired"
  └─ Delete pending registration

✓ Attempts must be < 5
  └─ If 5 failed attempts → Error: "Too many OTP attempts"
  └─ Delete pending registration (force resend)
```

## Database Schema

### pending_registrations table
```
┌────────────────────────────────────┐
│  pending_registrations             │
├────────────────────────────────────┤
│ email (PK)         text NOT NULL   │
│ passwordHash       text NOT NULL   │
│ otp                varchar         │
│ otpExpiry          bigint          │
│ attempts           int DEFAULT 0   │
│ createdAt          timestamp       │
└────────────────────────────────────┘

Example row:
┌─────────────────────────────────────────────────┐
│ email: user@gmail.com                           │
│ passwordHash: $2b$10$... (bcrypt hash)          │
│ otp: 123456                                     │
│ otpExpiry: 1771878322026 (timestamp)            │
│ attempts: 0                                     │
│ createdAt: 2026-02-24 01:14:52                  │
└─────────────────────────────────────────────────┘
```

### users table (after verification)
```
┌────────────────────────────────────┐
│  users                             │
├────────────────────────────────────┤
│ id (PK)           int SERIAL       │
│ email (UNIQUE)    varchar          │
│ passwordHash      text             │
│ verified          boolean DEFAULT  │
│ createdAt         timestamp        │
│ updatedAt         timestamp        │
└────────────────────────────────────┘

Example row after verification:
┌─────────────────────────────────────────────────┐
│ id: 2                                           │
│ email: user@gmail.com                           │
│ passwordHash: $2b$10$... (bcrypt hash)          │
│ verified: true                                  │
│ createdAt: 2026-02-24 01:15:13                  │
│ updatedAt: 2026-02-24 01:15:13                  │
└─────────────────────────────────────────────────┘
```

## Email Service Class

The `EmailService` handles all email sending:

```typescript
class EmailService {
  // Send OTP email to user
  sendOtpEmail(email: string, otp: string)
  
  // Send welcome email after verification
  sendWelcomeEmail(email: string, name?: string)
  
  // Uses nodemailer with SMTP configuration
  // Graceful error handling with console fallback
}
```

## Configuration

```bash
# SMTP Configuration (in .env)
SMTP_HOST=smtp.gmail.com      # Email server address
SMTP_PORT=587                 # Port (587 for TLS)
SMTP_USER=your@gmail.com      # Your email
SMTP_PASS=app-password        # App password (not regular password!)
SMTP_FROM=your@gmail.com      # Sender address

# Frontend Configuration
FRONTEND_URL=http://localhost:3000  # Link in welcome emails
```

## Testing Emails

### Step 1: Configure SMTP in .env
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourmail@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Step 2: Restart Server
```bash
pkill -f "nest start"
cd backend && npx nest start --watch
```

### Step 3: Register New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"TestPass123!"}'
```

### Step 4: Check Email
- Open your email inbox
- Look for subject: "Your OTP Code - Project Authentication"
- Copy the 6-digit OTP

### Step 5: Verify OTP
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","otp":"123456"}'
```

You should get a JWT token back!

## Security Considerations

- ⚠️ OTP expires in 10 minutes
- ⚠️ Max 5 failed OTP attempts (then must resend)
- ⚠️ Never store plain passwords (always bcrypt hash)
- ⚠️ Never log OTP in production (only in dev mode)
- ⚠️ Always use HTTPS in production (for JWT tokens)
- ⚠️ Don't commit .env with real credentials to Git
