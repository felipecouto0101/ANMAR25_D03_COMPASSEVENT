import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User phone number' })
  phone: string;

  @ApiProperty({ description: 'User role', enum: ['admin', 'organizer', 'participant'] })
  role: 'admin' | 'organizer' | 'participant';

  @ApiProperty({ description: 'User profile image URL', required: false })
  profileImageUrl?: string;

  @ApiProperty({ description: 'Email verification status' })
  emailVerified: boolean;

  @ApiProperty({ description: 'User active status' })
  active: boolean;

  @ApiProperty({ description: 'User creation date' })
  createdAt: string;

  @ApiProperty({ description: 'User last update date' })
  updatedAt: string;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.role = user.role;
    this.profileImageUrl = user.profileImageUrl;
    this.emailVerified = user.emailVerified;
    this.active = user.active;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}