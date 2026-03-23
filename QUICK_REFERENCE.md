# Quick Reference Card - Authentication API

## Endpoints Summary

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/auth/register` | Register new user | ✅ Ready |
| POST | `/auth/verify-otp` | Verify OTP & complete registration | ✅ Ready |
| POST | `/auth/resend-otp` | Resend OTP to email | ✅ Ready |
| POST | `/auth/login` | Login existing user | ✅ Ready |

---

## Request/Response Reference

### 1. Register
**POST /auth/register**
```
Request:  { email, password }
Response: { message }
Status:   201/400
```

### 2. Verify OTP
**POST /auth/verify-otp**
```
Request:  { email, otp }
Response: { token, message }
Status:   200/400
```

### 3. Resend OTP
**POST /auth/resend-otp**
```
Request:  { email }
Response: { message }
Status:   200/400
```

### 4. Login
**POST /auth/login**
```
Request:  { email, password }
Response: { token, message, user }
Status:   200/400/401
```

---

## Validation Requirements

### Email ✉️
```
✓ Valid format    : user@example.com
✓ Required        : Must not be empty
✓ Unique          : Cannot register twice
```

### Password 🔐
```
✓ Min length      : 8 characters
✓ Special char    : At least 1 (!@#$%^&*()-+)
✓ Required        : Must not be empty
```

### OTP 🔢
```
✓ Format          : Exactly 6 digits (0-9)
✓ Expiry          : 10 minutes from generation
✓ Attempts        : Max 5 failed attempts
✓ Resend          : Available anytime
```

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Login, verify OTP success |
| 201 | Created | Registration initiated |
| 400 | Bad Request | Invalid input, duplicate email |
| 401 | Unauthorized | Wrong password, invalid OTP |

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid email format | Wrong email | Use format: user@domain.com |
| Password < 8 chars | Too short | Min 8 characters required |
| No special char | Weak password | Add special char: !@#$%^&* |
| Email already registered | Duplicate | Use different email |
| Invalid OTP | Wrong code | Check console for correct OTP |
| OTP expired | Too late | Waited >10 minutes, resend OTP |
| Too many attempts | 5 failed tries | Resend OTP to reset |
| Incorrect credentials | Wrong password | Check password spelling |

---

## Development Workflow

```
1. Register          → [DEV] OTP logged to console
2. Copy OTP from     → Console or terminal
3. Verify OTP        → Get JWT token
4. Use token         → Add to Authorization header
```

---

## Token Usage

### Store Token
```javascript
const { token } = await authService.verify(email, otp);
localStorage.setItem('token', token);
```

### Use Token
```javascript
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Demo Credentials

### Pre-registered User
```
Email:    user@example.com
Password: password123!
```

### To Test Registration
```
Email:    any+unique@example.com
Password: MyPassword123!
```

---

## Testing Checklist

- [ ] Backend server running (`npm run start:dev`)
- [ ] Register with new email
- [ ] Get OTP from console
- [ ] Verify OTP successfully
- [ ] Receive JWT token
- [ ] Login with same credentials
- [ ] Test invalid OTP (5 times)
- [ ] Test resend OTP
- [ ] Test duplicate email registration
- [ ] Test weak password
- [ ] Test invalid email format

---

## Important Environment Variables

```bash
JWT_SECRET=your-secret-key-here
OTP_EXPIRY_MS=600000              # 10 minutes
MAX_OTP_ATTEMPTS=5
```

---

## File Locations

```
✓ Controller     : src/auth/auth.controller.ts
✓ Service        : src/auth/auth.service.ts
✓ DTOs           : src/auth/dto/register.dto.ts
✓ Tests          : src/auth/auth.spec.ts
✓ Docs           : src/auth/README.md
✓ Examples       : API_EXAMPLES.txt
```

---

## Quick Test Commands

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","password":"Pass123!"}'
```

### Verify (use OTP from console)
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","otp":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ex.com","password":"Pass123!"}'
```

---

## Response Examples

### Success Registration
```json
{
  "message": "Registration submitted. OTP sent to your email"
}
```

### Success Verification
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Success Login
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Error Response
```json
{
  "message": "Invalid OTP. 4 attempts remaining"
}
```

---

## Production Checklist

- [ ] Move to database (PostgreSQL)
- [ ] Setup email service (SendGrid, etc.)
- [ ] Add rate limiting
- [ ] Setup CORS
- [ ] Enable HTTPS
- [ ] Use .env variables
- [ ] Add request logging
- [ ] Setup monitoring
- [ ] Add password reset
- [ ] Implement refresh tokens

---

## Support

📖 Full documentation: See `IMPLEMENTATION.md`
📋 API examples: See `API_EXAMPLES.txt`
✅ Test file: See `src/auth/auth.spec.ts`
