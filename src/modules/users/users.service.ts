import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new ConflictException(`User with email ${user.email} already exists`);
    }

    const now = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const newUser: User = {
      ...user,
      id: uuidv4(),
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };

    return this.userRepository.create(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
}