import { IsEmail, IsNotEmpty, MinLength, Matches, IsString, IsAlpha } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEqualTo } from './is-equal-to.validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    type: 'string'
  })
  @IsNotEmpty({ message: 'First name must not be empty' })
  @IsString({ message: 'First name must be a string' })
  @IsAlpha('en-US', { message: 'First name must contain only letters' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    type: 'string'
  })
  @IsNotEmpty({ message: 'Last name must not be empty' })
  @IsString({ message: 'Last name must be a string' })
  @IsAlpha('en-US', { message: 'Last name must contain only letters' })
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'newuser@example.com',
    type: 'string'
  })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password (min 8 chars, must contain special character)',
    example: 'SecurePass123!',
    type: 'string'
  })
  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/(?=.*[!@#$%^&*()\-+])/, { message: 'Password must contain at least one special character' })
  password: string;

  @ApiProperty({
    description: 'Confirm password (must match password)',
    example: 'SecurePass123!',
    type: 'string'
  })
  @IsNotEmpty({ message: 'Confirm password must not be empty' })
  @IsEqualTo('password', { message: 'Confirm password must match password' })
  confirmPassword: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'newuser@example.com',
    type: 'string'
  })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    type: 'string'
  })
  @IsNotEmpty({ message: 'OTP must not be empty' })
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'newuser@example.com',
    type: 'string'
  })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;
}
