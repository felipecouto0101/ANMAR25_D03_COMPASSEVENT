import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { S3Service } from '../../infrastructure/storage/s3/s3.service';
import { MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
    private readonly mailService: MailService
  ) {}

  async create(createUserDto: CreateUserDto, profileImage?: any): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userId = uuidv4();

    let profileImageUrl = '';
    if (profileImage) {
      const profileImageKey = `profiles/${userId}-${Date.now()}.jpg`;
      profileImageUrl = await this.s3Service.uploadFile(profileImage, profileImageKey);
    }

    const user: User = {
      id: userId,
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role,
      phone: createUserDto.phone,
      profileImageUrl,
      active: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.userRepository.create(user);
    await this.mailService.sendVerificationEmail(user);

    return this.mapToUserResponse(user);
  }

  async verifyEmail(token: string): Promise<boolean> {
    const decoded = this.mailService.verifyEmailToken(token);
    if (!decoded) {
      return false;
    }

    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      return false;
    }

    if (user.email !== decoded.email) {
      return false;
    }

    const updatedUser = {
      ...user,
      emailVerified: true,
      updatedAt: new Date().toISOString()
    };

    await this.userRepository.update(user.id, {
      emailVerified: true,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  }

  async findAll(queryDto: QueryUsersDto, userId: string, userRole: string): Promise<{ items: UserResponseDto[]; total: number }> {
    if (userRole !== 'admin') {
      return { items: [], total: 0 };
    }

    const result = await this.userRepository.findWithFilters({
      ...queryDto,
      page: queryDto.page || 1,
      limit: queryDto.limit || 10
    });
    
    return {
      items: result.items.map(user => this.mapToUserResponse(user)),
      total: result.total
    };
  }

  async findById(id: string, requestUserId: string, requestUserRole: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requestUserRole !== 'admin' && requestUserId !== id) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestUserId: string, requestUserRole: string, profileImage?: any): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requestUserRole !== 'admin' && requestUserId !== id) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    let profileImageUrl = user.profileImageUrl;
    if (profileImage) {
      const profileImageKey = `profiles/${id}-${Date.now()}.jpg`;
      profileImageUrl = await this.s3Service.uploadFile(profileImage, profileImageKey);
    }

    const updateData: Partial<User> = {
      name: updateUserDto.name || user.name,
      email: updateUserDto.email || user.email,
      phone: updateUserDto.phone || user.phone,
      profileImageUrl,
      updatedAt: new Date().toISOString()
    };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.role) {
      updateData.role = updateUserDto.role;
    }

    await this.userRepository.update(id, updateData);
    
    const updatedUser = await this.userRepository.findById(id);
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }
    
    return this.mapToUserResponse(updatedUser);
  }

  async delete(id: string, requestUserId: string, requestUserRole: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requestUserRole !== 'admin' && requestUserId !== id) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(id, {
      active: false,
      updatedAt: new Date().toISOString()
    });
    
    await this.mailService.sendAccountDeletedEmail(user);
    
    return true;
  }

  private mapToUserResponse(user: User): UserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
  }
}