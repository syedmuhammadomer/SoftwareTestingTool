# Quick Email Setup (5 Minutes)

## For Gmail Users

### Step 1: Create App Password (2 minutes)
1. Go to https://myaccount.google.com/apppasswords
2. Sign in if needed
3. Select "Mail" and "Windows Computer"
4. Click "Generate"
5. Google gives you a 16-character password - copy it

### Step 2: Update .env (1 minute)
Edit `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=your-gmail@gmail.com
```

### Step 3: Restart Server (2 minutes)
```bash
# Stop current server
pkill -f "nest start"

# Start again
cd backend
npx nest start --watch
```

### Step 4: Test It!
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"TestPass123!"}'
```

Check your email inbox for the OTP code!

---

## If You Don't Have Gmail

Use **Mailtrap.io** (free, for testing):

1. Go to https://mailtrap.io/
2. Sign up free
3. Get your SMTP credentials from Settings tab
4. Put them in `.env`:
```
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
```

All emails will be captured in your Mailtrap inbox instead of real emails (perfect for testing!).

---

## Troubleshooting

**Email not working?**
- Check `.env` for typos
- Restart server after changing `.env`
- For Gmail: Make sure you used App Password, not regular password
- Check console logs for error messages

**OTP appears in console instead of email?**
- This is normal if email config is missing
- You can use the OTP from console to test
- Look for: `[DEV] OTP for email: 123456`

---

## That's It! 🎉

Your registration system now sends real emails.

Next steps:
1. User registers with `POST /auth/register`
2. User receives OTP email
3. User verifies with `POST /auth/verify-otp`
4. Registration complete!
