import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { S3Service } from '../../infrastructure/storage/s3/s3.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(createUserDto: CreateUserDto, profileImage?: MulterFile): Promise<UserResponseDto> {
    
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }

    const now = new Date().toISOString();
    let profileImageUrl: string | undefined;

    if (profileImage) {
      const fileKey = `users/${uuidv4()}-${profileImage.originalname}`;
      profileImageUrl = await this.s3Service.uploadFile(profileImage, fileKey);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const newUser: User = {
      ...createUserDto,
      id: uuidv4(),
      password: hashedPassword,
      profileImageUrl,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const createdUser = await this.userRepository.create(newUser);
    return new UserResponseDto(createdUser);
  }

  async findAll(queryDto: QueryUsersDto, userId: string, userRole: string): Promise<{ items: UserResponseDto[]; total: number }> {
    
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only administrators can list users');
    }

    const result = await this.userRepository.findWithFilters({
      name: queryDto.name,
      email: queryDto.email,
      role: queryDto.role,
      active: true,
      page: queryDto.page || 1,
      limit: queryDto.limit || 10,
    });

    return {
      items: result.items.map(user => new UserResponseDto(user)),
      total: result.total,
    };
  }

  async findById(id: string, requestUserId: string, userRole: string): Promise<UserResponseDto> {
    
    if (userRole !== 'admin' && id !== requestUserId) {
      throw new ForbiddenException('You do not have permission to view this user');
    }

    const user = await this.userRepository.findById(id);
    if (!user || !user.active) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return new UserResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestUserId: string, userRole: string, profileImage?: MulterFile): Promise<UserResponseDto> {
    
    if (id !== requestUserId && userRole !== 'admin') {
      throw new ForbiddenException('You do not have permission to update this user');
    }

    const user = await this.userRepository.findById(id);
    if (!user || !user.active) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`User with email ${updateUserDto.email} already exists`);
      }
    }

    let profileImageUrl = user.profileImageUrl;

    if (profileImage) {
      const fileKey = `users/${uuidv4()}-${profileImage.originalname}`;
      profileImageUrl = await this.s3Service.uploadFile(profileImage, fileKey);
    }

    let password = user.password;
    if (updateUserDto.password) {
      password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = {
      ...updateUserDto,
      password,
      profileImageUrl,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.userRepository.update(id, updatedUser);
    if (!result) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return new UserResponseDto(result);
  }

  async delete(id: string, requestUserId: string, userRole: string): Promise<boolean> {
    
    if (userRole !== 'admin' && id !== requestUserId) {
      throw new ForbiddenException('You do not have permission to delete this user');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const deactivatedUser = {
      active: false,
      updatedAt: new Date().toISOString(),
    };

    await this.userRepository.update(id, deactivatedUser);
    return true;
  }
}