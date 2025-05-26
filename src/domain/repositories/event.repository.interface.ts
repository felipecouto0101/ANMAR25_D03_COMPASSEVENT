import { BaseRepository } from './base.repository.interface';
import { Event } from '../entities/event.entity';

export interface EventRepository extends BaseRepository<Event> {
  findByDate(date: string): Promise<Event[]>;
  findByName(name: string): Promise<Event | null>;
  findWithFilters(filters: {
    name?: string;
    startDate?: string;
    endDate?: string;
    active?: boolean;
    page: number;
    limit: number;
  }): Promise<{ items: Event[]; total: number }>;
}