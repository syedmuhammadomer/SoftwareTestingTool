import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    type: 'string'
  })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123!',
    type: 'string'
  })
  @IsNotEmpty({ message: 'Password must not be empty' })                                                                                                    
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/(?=.*[!@#$%^&*()\-+])/, { message: 'Password must contain at least one special character' })
  password: string;
}
