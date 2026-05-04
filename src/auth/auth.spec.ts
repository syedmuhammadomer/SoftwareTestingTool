import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, ResendOtpDto, VerifyOtpDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    validateUser: jest.fn(),
    loginResponse: jest.fn(),
    register: jest.fn(),
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService as unknown as AuthService);
  });

  describe('login', () => {
    it('returns a login response when credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123!',
      };

      const user = { id: 1, email: 'user@example.com' };
      const loginResponse = {
        message: 'Login successful',
        token: 'token-123',
        user: {
          id: 1,
          email: 'user@example.com',
        },
      };

      authService.validateUser.mockResolvedValue(user);
      authService.loginResponse.mockResolvedValue(loginResponse);

      await expect(controller.login(loginDto)).resolves.toEqual(loginResponse);
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(authService.loginResponse).toHaveBeenCalledWith(user);
    });

    it('throws UnauthorizedException when credentials are invalid', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('passes registration fields to the service', async () => {
      const registerDto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      };

      authService.register.mockResolvedValue({
        message: 'Registration submitted. OTP sent to your email',
      });

      await expect(controller.register(registerDto)).resolves.toEqual({
        message: 'Registration submitted. OTP sent to your email',
      });
      expect(authService.register).toHaveBeenCalledWith(
        registerDto.firstName,
        registerDto.lastName,
        registerDto.email,
        registerDto.password,
      );
    });
  });

  describe('verifyOtp', () => {
    it('returns the verification response from the service', async () => {
      const verifyDto: VerifyOtpDto = {
        email: 'john@example.com',
        otp: '123456',
      };

      const verifyResponse = {
        message: 'Registration successful',
        token: 'token-123',
        user: {
          id: 1,
          email: 'john@example.com',
        },
      };

      authService.verifyOtp.mockResolvedValue(verifyResponse);

      await expect(controller.verifyOtp(verifyDto)).resolves.toEqual(verifyResponse);
      expect(authService.verifyOtp).toHaveBeenCalledWith(verifyDto.email, verifyDto.otp);
    });
  });

  describe('resendOtp', () => {
    it('returns the resend response from the service', async () => {
      const resendDto: ResendOtpDto = {
        email: 'john@example.com',
      };

      authService.resendOtp.mockResolvedValue({
        message: 'OTP resent to your email',
      });

      await expect(controller.resendOtp(resendDto)).resolves.toEqual({
        message: 'OTP resent to your email',
      });
      expect(authService.resendOtp).toHaveBeenCalledWith(resendDto.email);
    });
  });
});
