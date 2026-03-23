# Email Configuration Guide

## Overview
The authentication system now sends OTP codes and welcome emails to users. This guide explains how to configure email sending.

## Email Sending Methods

### Option 1: Gmail (Recommended for Development)

#### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/
2. Click "Security" in the left menu
3. Enable "2-Step Verification"

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy this password

#### Step 3: Update .env File
Edit `/home/omer/Downloads/Project/backend/.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # The 16-character password (without spaces)
SMTP_FROM=your-email@gmail.com
```

### Option 2: Use Any SMTP Service

Replace the SMTP credentials with your provider:

#### For Outlook/Hotmail:
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### For SendGrid:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxx  # Your SendGrid API key
```

#### For Mailtrap (Testing):
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
```

## Testing Email Setup

### 1. Verify SMTP Configuration
Check that your `.env` file has valid settings:
```bash
cat backend/.env | grep SMTP
```

### 2. Test Registration with Email
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"TestPass123!"}'
```

### 3. Check the Response
You should receive:
```json
{
  "message": "Registration submitted. OTP sent to your email"
}
```

### 4. Verify Email Receipt
- Check your inbox (or spam folder)
- The email should contain the 6-digit OTP code
- The OTP is valid for 10 minutes

## Troubleshooting

### Email Not Received?

**Problem: "SMTP service failed" error in console**

**Solutions:**
1. **Check SMTP credentials** - Verify username and password
2. **Check SMTP_HOST** - Ensure it's correct for your email provider
3. **Check port** - Most services use 587 (TLS) or 465 (SSL)
4. **Google Account** - If using Gmail, ensure you used the 16-char app password, not regular password
5. **Less Secure Apps** - Some Gmail accounts may need to enable "Less secure app access"

### OTP Still Appears in Console?

This is normal! If email sending fails, the OTP is logged to console as backup:
```
[DEV] OTP for test@gmail.com: 123456 (Email service failed)
```

This allows you to test even if email is not configured.

## Email Templates

### OTP Email
- **Subject:** Your OTP Code - Project Authentication
- **Contains:** 6-digit OTP code in large font
- **Includes:** Expiration time (10 minutes) and security warnings
- **Format:** HTML + Plain text

### Welcome Email
- **Subject:** Welcome to Project!
- **Sent:** When OTP is verified successfully
- **Contains:** Login link and welcome message
- **Format:** HTML + Plain text

## Environment Variables Reference

```bash
# Gmail/SMTP Configuration
SMTP_HOST=smtp.gmail.com           # SMTP server address
SMTP_PORT=587                      # Port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com     # Your email address
SMTP_PASS=xxxx xxxx xxxx xxxx      # App password or regular password
SMTP_FROM=your-email@gmail.com     # Sender email address

# Frontend URL (used in welcome emails)
FRONTEND_URL=http://localhost:3000 # Link back to your frontend
```

## Email Sending Flow

```
1. User registers → POST /auth/register
   ├─ Generate OTP
   ├─ Save to database
   ├─ Send OTP email (or log if failed)
   └─ Return success message

2. User verifies OTP → POST /auth/verify-otp
   ├─ Validate OTP
   ├─ Create user account
   ├─ Delete pending registration
   ├─ Send welcome email
   └─ Return JWT token

3. User resends OTP → POST /auth/resend-otp
   ├─ Generate new OTP
   ├─ Update pending registration
   ├─ Send OTP email (or log if failed)
   └─ Return success message
```

## Security Notes

- ⚠️ Never commit `.env` with real credentials to git
- ⚠️ Use app-specific passwords (Gmail) or API keys (SendGrid)
- ⚠️ OTP expires in 10 minutes
- ⚠️ Maximum 5 failed OTP attempts per registration
- ⚠️ Emails are sent asynchronously (registration completes even if email fails)

## Production Considerations

For production, use a dedicated email service:
- **SendGrid** - Reliable, free tier available
- **AWS SES** - Cost-effective for high volume
- **Mailgun** - Good API, developer-friendly
- **Twilio SendGrid** - Part of Twilio platform

These services are more reliable than personal email accounts and handle deliverability better.

## Testing Without Real Email

If you don't want to configure real email yet:
1. OTP will still be logged to console
2. Users can copy OTP from console logs
3. This is perfect for development/testing
4. Look for: `[DEV] OTP for email@example.com: 123456`

## Common Email Providers SMTP Settings

| Provider | Host | Port | TLS |
|----------|------|------|-----|
| Gmail | smtp.gmail.com | 587 | Yes |
| Outlook | smtp-mail.outlook.com | 587 | Yes |
| Yahoo | smtp.mail.yahoo.com | 587 | Yes |
| iCloud | smtp.mail.me.com | 587 | Yes |
| SendGrid | smtp.sendgrid.net | 587 | Yes |
| Mailtrap | smtp.mailtrap.io | 465 | Yes |

## Need Help?

If emails aren't working:
1. Check `.env` file for typos
2. Verify SMTP credentials in your email provider's settings
3. Check console logs for error messages
4. Use Mailtrap.io for testing (captures emails without sending)
5. Ensure firewall allows outbound port 587 or 465
