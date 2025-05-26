import { BaseRepository } from './base.repository.interface';
import { Event } from '../entities/event.entity';

export interface EventRepository extends BaseRepository<Event> {
  findByDate(date: string): Promise<Event[]>;
}