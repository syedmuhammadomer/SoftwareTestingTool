# Authentication API Documentation

## Overview
This authentication module provides user registration with OTP verification, login, and OTP resend functionality.

## Validation Rules

### Email
- Must be a valid email format
- Cannot be empty
- Must be unique (cannot register twice with same email)

### Password
- Minimum 8 characters
- Must contain at least one special character (e.g., !, @, #, $, %, ^, &, *, (, ), -, +)

### OTP
- 6-digit number
- Valid for 10 minutes from generation
- Maximum 5 verification attempts per registration
- Can be resent at any time

## API Endpoints

### 1. Register User
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePass123!"
}
```

**Response (201):**
```json
{
  "message": "Registration submitted. OTP sent to your email"
}
```

**Error Responses:**
- `400` - Invalid email format, weak password, or email already registered
- Example: `{ "message": "Email already registered" }`

---

### 2. Verify OTP
**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Invalid OTP, expired OTP, exceeded max attempts, or no pending registration
- Examples:
  - `{ "message": "Invalid OTP. 4 attempts remaining" }`
  - `{ "message": "OTP expired. Please register again" }`
  - `{ "message": "Too many OTP attempts. Please register again" }`

---

### 3. Resend OTP
**Endpoint:** `POST /auth/resend-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "OTP resent to your email"
}
```

**Error Responses:**
- `400` - No pending registration found for this email
- Example: `{ "message": "No pending registration found" }`

---

### 4. Login User
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `400` - Missing or invalid fields
- `401` - Incorrect email or password
- Example: `{ "message": "Incorrect email or password" }`

---

## Complete Registration Flow Example

### Step 1: Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "MyPass123!"
  }'
```

**Response:**
```json
{
  "message": "Registration submitted. OTP sent to your email"
}
```

### Step 2: Verify OTP
Check console/email for OTP, then:
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

**Response:**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 3: Use Token for Authenticated Requests
Use the returned `token` in the `Authorization` header:
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Development Notes

- **OTP in Console:** For development, OTP is logged to console: `[DEV] OTP for user@example.com: 123456`
- **OTP Expiry:** 10 minutes from generation
- **Max Attempts:** 5 failed OTP verification attempts
- **In-Memory Storage:** Currently uses in-memory Map (not persistent). For production, use a real database
- **JWT Token:** Uses HS256 algorithm with 7-day expiration

---

## Future Improvements

1. **Email Service Integration:** Replace console.log with actual email sending (SendGrid, Nodemailer, etc.)
2. **Database Migration:** Move from in-memory to PostgreSQL/MongoDB
3. **Rate Limiting:** Add rate limiting to prevent brute force attacks
4. **User Profiles:** Add additional user fields (name, phone, etc.)
5. **Password Reset:** Implement forgot password functionality
6. **OAuth Integration:** Add Google/GitHub OAuth support
7. **Two-Factor Authentication:** Add optional 2FA with authenticator apps
