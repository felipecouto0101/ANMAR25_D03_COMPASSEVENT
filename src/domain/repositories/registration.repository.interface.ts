import { BaseRepository } from './base.repository.interface';
import { Registration } from '../entities/registration.entity';

export interface RegistrationRepository extends BaseRepository<Registration> {
  findByUserAndEvent(userId: string, eventId: string): Promise<Registration | null>;
  findByUser(userId: string, page: number, limit: number): Promise<{ items: Registration[]; total: number }>;
  findByEventOrganizer(userId: string, page: number, limit: number): Promise<{ items: Registration[]; total: number }>;
}