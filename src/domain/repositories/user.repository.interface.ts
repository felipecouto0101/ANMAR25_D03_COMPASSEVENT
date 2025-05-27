import { BaseRepository } from './base.repository.interface';
import { User } from '../entities/user.entity';

export interface UserRepository extends BaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findWithFilters(filters: {
    name?: string;
    email?: string;
    role?: string;
    active?: boolean;
    page: number;
    limit: number;
  }): Promise<{ items: User[]; total: number }>;
}