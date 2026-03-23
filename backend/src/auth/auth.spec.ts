import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, VerifyOtpDto, ResendOtpDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthController - Registration & OTP Verification', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user with valid credentials', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      };

      const result = await controller.register(registerDto);
      expect(result).toEqual({
        message: 'Registration submitted. OTP sent to your email',
      });
    });

    it('should reject email if already registered', async () => {
      const registerDto: RegisterDto = {
        email: 'user@example.com', // Already registered in constructor
        password: 'SecurePass123!',
      };

      await expect(controller.register(registerDto)).rejects.toThrow('Email already registered');
    });

    it('should reject invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      } as RegisterDto;

      await expect(controller.register(registerDto)).rejects.toThrow();
    });

    it('should reject weak password (less than 8 chars)', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Pass1!',
      } as RegisterDto;

      await expect(controller.register(registerDto)).rejects.toThrow();
    });

    it('should reject password without special character', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123',
      } as RegisterDto;

      await expect(controller.register(registerDto)).rejects.toThrow();
    });

    it('should queue duplicate registration attempts', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser2@example.com',
        password: 'SecurePass123!',
      };

      // First registration succeeds
      const result1 = await controller.register(registerDto);
      expect(result1.message).toBeDefined();

      // Second registration with same email should fail
      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendOtp', () => {
    beforeEach(async () => {
      // Set up a pending registration
      const registerDto: RegisterDto = {
        email: 'resend@example.com',
        password: 'SecurePass123!',
      };
      await controller.register(registerDto);
    });

    it('should resend OTP for pending registration', async () => {
      const resendDto: ResendOtpDto = {
        email: 'resend@example.com',
      };

      const result = await controller.resendOtp(resendDto);
      expect(result).toEqual({
        message: 'OTP resent to your email',
      });
    });

    it('should reject resend OTP if no pending registration', async () => {
      const resendDto: ResendOtpDto = {
        email: 'nonexistent@example.com',
      };

      await expect(controller.resendOtp(resendDto)).rejects.toThrow('No pending registration found');
    });
  });

  describe('verifyOtp - Valid Flow', () => {
    let registrationEmail: string;
    let capturedOtp: string;

    beforeEach(async () => {
      registrationEmail = 'verify@example.com';
      
      // Register user
      const registerDto: RegisterDto = {
        email: registrationEmail,
        password: 'SecurePass123!',
      };
      await controller.register(registerDto);

      // Capture OTP from service's internal state
      // In real scenario, this would come from email
      const pending = service['pendingRegistrations'].get(registrationEmail.toLowerCase());
      capturedOtp = pending?.otp || '';
    });

    it('should verify OTP and complete registration', async () => {
      const verifyDto: VerifyOtpDto = {
        email: registrationEmail,
        otp: capturedOtp,
      };

      const result = await controller.verifyOtp(verifyDto);
      expect(result.message).toEqual('Registration successful');
      expect(result.token).toBeDefined();
      expect(result.token).toContain('eyJ'); // JWT header
    });

    it('should be able to login with newly registered user', async () => {
      // Complete registration
      const verifyDto: VerifyOtpDto = {
        email: registrationEmail,
        otp: capturedOtp,
      };
      await controller.verifyOtp(verifyDto);

      // Login with new user
      const loginDto: LoginDto = {
        email: registrationEmail,
        password: 'SecurePass123!',
      };

      const loginResult = await controller.login(loginDto);
      expect(loginResult.message).toEqual('Login successful');
      expect(loginResult.token).toBeDefined();
      expect(loginResult.user.email).toEqual(registrationEmail);
    });
  });

  describe('verifyOtp - Error Cases', () => {
    beforeEach(async () => {
      const registerDto: RegisterDto = {
        email: 'error@example.com',
        password: 'SecurePass123!',
      };
      await controller.register(registerDto);
    });

    it('should reject invalid OTP', async () => {
      const verifyDto: VerifyOtpDto = {
        email: 'error@example.com',
        otp: '000000', // Wrong OTP
      };

      await expect(controller.verifyOtp(verifyDto)).rejects.toThrow('Invalid OTP');
    });

    it('should reject OTP if no pending registration', async () => {
      const verifyDto: VerifyOtpDto = {
        email: 'nonexistent@example.com',
        otp: '123456',
      };

      await expect(controller.verifyOtp(verifyDto)).rejects.toThrow('No pending registration found');
    });

    it('should track failed OTP attempts', async () => {
      const verifyDto: VerifyOtpDto = {
        email: 'error@example.com',
        otp: '000000',
      };

      let lastError: any;
      for (let i = 0; i < 5; i++) {
        try {
          await controller.verifyOtp(verifyDto);
        } catch (error) {
          lastError = error;
        }
      }

      // After 5 attempts, registration should be deleted
      expect(lastError.message).toContain('Too many OTP attempts');
    });
  });

  describe('OTP Expiration', () => {
    it('should expire OTP after 10 minutes', async () => {
      const registerDto: RegisterDto = {
        email: 'expire@example.com',
        password: 'SecurePass123!',
      };
      await controller.register(registerDto);

      // Manually advance time in service (for testing)
      const pending = service['pendingRegistrations'].get('expire@example.com');
      if (pending) {
        pending.otpExpiry = Date.now() - 1000; // Set expiry to past
      }

      const verifyDto: VerifyOtpDto = {
        email: 'expire@example.com',
        otp: pending?.otp || '000000',
      };

      await expect(controller.verifyOtp(verifyDto)).rejects.toThrow('OTP expired');
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123!',
      };

      const result = await controller.login(loginDto);
      expect(result.message).toEqual('Login successful');
      expect(result.token).toBeDefined();
      expect(result.user.email).toEqual('user@example.com');
    });

    it('should reject login with wrong password', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'wrongpassword!',
      };

      await expect(controller.login(loginDto)).rejects.toThrow('Incorrect email or password');
    });

    it('should reject login with non-existent email', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123!',
      };

      await expect(controller.login(loginDto)).rejects.toThrow('Incorrect email or password');
    });
  });

  describe('End-to-End Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const email = 'e2e@example.com';
      const password = 'MySecurePass456!';

      // Step 1: Register
      const registerDto: RegisterDto = { email, password };
      const registerResult = await controller.register(registerDto);
      expect(registerResult.message).toContain('OTP sent');

      // Step 2: Get OTP from service
      const pending = service['pendingRegistrations'].get(email.toLowerCase());
      const otp = pending?.otp || '';

      // Step 3: Verify OTP
      const verifyDto: VerifyOtpDto = { email, otp };
      const verifyResult = await controller.verifyOtp(verifyDto);
      expect(verifyResult.message).toEqual('Registration successful');
      expect(verifyResult.token).toBeDefined();

      // Step 4: Login with new credentials
      const loginDto: LoginDto = { email, password };
      const loginResult = await controller.login(loginDto);
      expect(loginResult.message).toEqual('Login successful');
      expect(loginResult.token).toBeDefined();
      expect(loginResult.user.email).toEqual(email);
    });

    it('should not allow login before OTP verification', async () => {
      const email = 'pending@example.com';
      const password = 'MySecurePass789!';

      // Register (pending)
      const registerDto: RegisterDto = { email, password };
      await controller.register(registerDto);

      // Try to login without verifying OTP
      const loginDto: LoginDto = { email, password };

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});

