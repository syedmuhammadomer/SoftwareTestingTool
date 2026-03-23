# Authentication API - Backend Implementation Guide

## Overview

This document describes the complete authentication system with registration, OTP verification, and login endpoints implemented in the NestJS backend.

## Implementation Details

### Services & Controllers

#### Auth Service (`src/auth/auth.service.ts`)
- **Registration**: Creates pending registration with hashed password and generated OTP
- **OTP Verification**: Validates OTP, tracks attempts, handles expiration
- **OTP Resend**: Generates new OTP for pending registrations
- **Login**: Authenticates with bcrypt and returns JWT token

#### Auth Controller (`src/auth/auth.controller.ts`)
- **POST /auth/register**: Register new user
- **POST /auth/verify-otp**: Verify OTP and complete registration
- **POST /auth/resend-otp**: Resend OTP
- **POST /auth/login**: Login existing user

### Validation DTOs

#### RegisterDto
```typescript
{
  email: string          // Valid email format, required
  password: string       // Min 8 chars + special char, required
}
```

#### VerifyOtpDto
```typescript
{
  email: string          // Valid email format, required
  otp: string           // Exactly 6 digits, required
}
```

#### ResendOtpDto
```typescript
{
  email: string          // Valid email format, required
}
```

#### LoginDto
```typescript
{
  email: string          // Valid email format, required
  password: string       // Min 8 chars + special char, required
}
```

## Features

### 1. Password Security
- **Bcrypt Hashing**: Passwords are hashed using bcrypt with salt rounds of 10
- **Never Stored in Plain Text**: Both during registration and login
- **Strong Password Requirements**:
  - Minimum 8 characters
  - At least one special character (!@#$%^&*()-+)

### 2. OTP Management
- **Auto-Generated**: 6-digit random OTP per registration
- **10-Minute Expiry**: OTP expires 10 minutes after generation
- **Attempt Tracking**: Maximum 5 failed verification attempts
- **Resend Available**: Generate new OTP at any time during pending registration
- **Development Support**: OTP logged to console for testing

### 3. JWT Authentication
- **Token Generation**: JWT tokens created upon successful login/registration
- **Token Expiry**: 7-day expiration by default
- **Payload**: Contains user ID and email
- **Algorithm**: HS256 (HMAC with SHA-256)

### 4. Data Validation
- **Email Validation**: RFC-compliant email format check
- **Password Validation**: Class-validator decorators ensure requirements
- **OTP Format**: Must be exactly 6 digits

## State Management

### Pending Registrations (In-Memory Map)
```typescript
Map<email, {
  email: string
  passwordHash: string
  otp: string
  otpExpiry: number       // Timestamp
  attempts: number        // OTP verification attempts
}>
```

### Registered Users (In-Memory Array)
```typescript
Array<{
  id: number
  email: string
  passwordHash: string
  verified: boolean
}>
```

## API Flow Diagrams

### Registration Flow
```
User Submit Registration
         ↓
Validate Email & Password
         ↓
Check Email Not Registered
         ↓
Hash Password with Bcrypt
         ↓
Generate 6-digit OTP
         ↓
Store in Pending Map (10 min expiry)
         ↓
Return Success Message
         ↓
User Receives OTP (email/console in dev)
```

### OTP Verification Flow
```
User Submit OTP
         ↓
Find Pending Registration
         ↓
Check OTP Not Expired
         ↓
Check Attempts < 5
         ↓
Compare OTP
   ├─ Match: Create User → Generate JWT → Return Token
   └─ No Match: Increment Attempts → Return Error
```

### Login Flow
```
User Submit Credentials
         ↓
Validate Email & Password Format
         ↓
Find User by Email
         ↓
Compare Password with Bcrypt
   ├─ Match: Generate JWT → Return Token
   └─ No Match: Return 401 Unauthorized
```

## Error Handling

### Registration Errors
- **400**: Invalid email format
- **400**: Weak password (< 8 chars)
- **400**: Missing special character in password
- **400**: Email already registered
- **400**: Pending registration exists

### OTP Verification Errors
- **400**: No pending registration found
- **400**: OTP expired (10+ minutes old)
- **400**: Invalid OTP (includes attempts remaining)
- **400**: Too many attempts (5+)

### Login Errors
- **400**: Missing email or password
- **401**: Invalid credentials

## Security Considerations

### Current Implementation
1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **OTP Format**: 6-digit numeric string
3. **Token Expiration**: 7-day validity
4. **Attempt Limitation**: 5 failed OTP attempts max

### Production Improvements Needed
1. **Database**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Email Service**: Implement actual email sending (SendGrid, Nodemailer)
3. **Rate Limiting**: Add endpoint rate limiting (express-rate-limit)
4. **CORS Configuration**: Set proper CORS origin whitelist
5. **HTTPS**: Enforce HTTPS in production
6. **Environment Variables**: Store secrets in .env files
7. **Logging**: Add comprehensive audit logging
8. **2FA Support**: Optional two-factor authentication
9. **Token Refresh**: Implement refresh token mechanism
10. **IP Whitelisting**: Optional IP-based access control

## Testing

### Unit Tests
Run test suite:
```bash
npm run test
```

Specific test file:
```bash
npm run test -- auth.spec.ts
```

Coverage report:
```bash
npm run test:cov
```

### Test Coverage
- Registration validation and flow
- OTP generation and verification
- Attempt tracking and expiration
- Login authentication
- Error scenarios
- Complete end-to-end flow

## Frontend Integration

### Registration Process (Frontend)
```typescript
// 1. Register
const response = await authService.register({ email, password });

// 2. User sees OTP input form
// 3. User enters OTP
const verifyResponse = await authService.verifyOtp({ email, otp });

// 4. Store token
storage.setToken(verifyResponse.token);

// 5. Redirect to dashboard
router.push('/dashboard');
```

### Login Process (Frontend)
```typescript
// 1. Login
const response = await authService.login({ email, password });

// 2. Store token
storage.setToken(response.token);

// 3. Redirect to dashboard
router.push('/dashboard');
```

### Token Usage (Frontend)
```typescript
// Automatically added to all requests via interceptor
const token = storage.getToken();
// Authorization: Bearer <token>
```

## Environment Variables

Add to `.env` file:
```
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost/dbname
```

## Running the Backend

### Development
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

### API Documentation
Swagger UI available at:
```
http://localhost:3000/api
```

## Example Requests

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

### Resend OTP
```bash
curl -X POST http://localhost:3000/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

## Files Structure

```
backend/
├── src/
│   └── auth/
│       ├── auth.controller.ts        # API endpoints
│       ├── auth.service.ts           # Business logic
│       ├── auth.spec.ts              # Unit tests
│       ├── dto/
│       │   ├── login.dto.ts          # Login validation
│       │   └── register.dto.ts       # Register/OTP validation
│       └── README.md                 # Auth module docs
├── API_EXAMPLES.txt                  # cURL examples
├── IMPLEMENTATION.md                 # This file
└── package.json                      # Dependencies
```

## Troubleshooting

### OTP Not Appearing
- Check browser console for `[DEV] OTP for ...` message
- Look at terminal where backend is running
- Ensure development mode is active

### Token-Based Request Failing
- Verify token is stored correctly in localStorage
- Check token expiration in JWT payload
- Ensure Authorization header is `Bearer <token>`

### CORS Errors
- Verify frontend and backend URLs match in cors config
- Check CORS headers are set in auth module

### Rate Limiting
- Currently no rate limiting implemented
- Add express-rate-limit package for production
