import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { EventRepository } from '../../domain/repositories/event.repository.interface';
import { S3Service } from '../../infrastructure/storage/s3/s3.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';

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
export class EventsService {
  constructor(
    @Inject('EventRepository')
    private readonly eventRepository: EventRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(createEventDto: CreateEventDto, imageFile?: MulterFile): Promise<Event> {
    
    const existingEvent = await this.eventRepository.findByName(createEventDto.name);
    if (existingEvent) {
      throw new ConflictException(`Event with name ${createEventDto.name} already exists`);
    }

    const now = new Date().toISOString();
    let imageUrl: string | undefined;

    
    if (imageFile) {
      const fileKey = `events/${uuidv4()}-${imageFile.originalname}`;
      imageUrl = await this.s3Service.uploadFile(imageFile, fileKey);
    }
    
    const newEvent: Event = {
      ...createEventDto,
      id: uuidv4(),
      imageUrl,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    return this.eventRepository.create(newEvent);
  }

  async findAll(queryDto: QueryEventsDto): Promise<{ items: Event[]; total: number }> {
    return this.eventRepository.findWithFilters({
      name: queryDto.name,
      startDate: queryDto.startDate,
      endDate: queryDto.endDate,
      active: queryDto.active,
      page: queryDto.page || 1,
      limit: queryDto.limit || 10,
    });
  }

  async findById(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string, userRole: string, imageFile?: MulterFile): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }


    if (userRole !== 'admin' && event.organizerId !== userId) {
      throw new BadRequestException('You do not have permission to update this event');
    }

    
    if (updateEventDto.name && updateEventDto.name !== event.name) {
      const existingEvent = await this.eventRepository.findByName(updateEventDto.name);
      if (existingEvent && existingEvent.id !== id) {
        throw new ConflictException(`Event with name ${updateEventDto.name} already exists`);
      }
    }

    let imageUrl = event.imageUrl;

    
    if (imageFile) {
      const fileKey = `events/${uuidv4()}-${imageFile.originalname}`;
      imageUrl = await this.s3Service.uploadFile(imageFile, fileKey);
    }

    const updatedEvent = {
      ...updateEventDto,
      imageUrl,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.eventRepository.update(id, updatedEvent);
    if (!result) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return result;
  }

  async delete(id: string, userId: string, userRole: string): Promise<boolean> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    
    if (userRole !== 'admin' && event.organizerId !== userId) {
      throw new BadRequestException('You do not have permission to delete this event');
    }

    const deactivatedEvent = {
      active: false,
      updatedAt: new Date().toISOString(),
    };

    await this.eventRepository.update(id, deactivatedEvent);
    return true;
  }

  async findByDate(date: string): Promise<Event[]> {
    return this.eventRepository.findByDate(date);
  }
}