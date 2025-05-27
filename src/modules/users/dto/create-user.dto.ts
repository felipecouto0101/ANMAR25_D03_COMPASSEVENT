import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ 
    description: 'User name',
    example: 'John Doe'
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({ 
    description: 'User email',
    example: 'john.doe@example.com'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({ 
    description: 'User password',
    example: 'Password123'
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @ApiProperty({ 
    description: 'User phone number',
    example: '+1234567890'
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number in E.164 format',
  })
  phone: string;

  @ApiProperty({ 
    description: 'User role', 
    enum: ['admin', 'organizer', 'participant'],
    example: 'participant'
  })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(['admin', 'organizer', 'participant'], {
    message: 'Role must be admin, organizer or participant',
  })
  role: 'admin' | 'organizer' | 'participant';
}