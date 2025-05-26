import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { EventRepository } from '../../domain/repositories/event.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  constructor(
    @Inject('EventRepository')
    private readonly eventRepository: EventRepository,
  ) {}

  async create(event: Omit<Event, 'id' | 'active' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const now = new Date().toISOString();
    
    const newEvent: Event = {
      ...event,
      id: uuidv4(),
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    return this.eventRepository.create(newEvent);
  }

  async findAll(): Promise<Event[]> {
    const events = await this.eventRepository.findAll();
    return events.filter(event => event.active !== false);
  }

  async findById(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event || event.active === false) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  async update(id: string, event: Partial<Event>): Promise<Event> {
    const existingEvent = await this.eventRepository.findById(id);
    if (!existingEvent || existingEvent.active === false) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const updatedEvent = {
      ...event,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.eventRepository.update(id, updatedEvent);
    if (!result) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const deactivatedEvent = {
      active: false,
      updatedAt: new Date().toISOString(),
    };

    await this.eventRepository.update(id, deactivatedEvent);
    return true;
  }

  async findByDate(date: string): Promise<Event[]> {
    const events = await this.eventRepository.findByDate(date);
    return events.filter(event => event.active !== false);
  }
}