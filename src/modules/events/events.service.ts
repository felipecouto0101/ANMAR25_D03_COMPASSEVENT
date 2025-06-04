import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { Registration } from '../../domain/entities/registration.entity';
import { EventRepository } from '../../domain/repositories/event.repository.interface';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { RegistrationRepository } from '../../domain/repositories/registration.repository.interface';
import { S3Service } from '../../infrastructure/storage/s3/s3.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { 
  EntityNotFoundException, 
  AuthorizationException, 
  ConflictException,
  ValidationException
} from '../../domain/exceptions/domain.exceptions';

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
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('RegistrationRepository')
    private readonly registrationRepository: RegistrationRepository,
    private readonly s3Service: S3Service,
    private readonly mailService: MailService,
  ) {}

  async create(createEventDto: CreateEventDto, organizerId: string, imageFile: MulterFile): Promise<Event> {
    const user = await this.userRepository.findById(organizerId);
    if (!user) {
      throw new EntityNotFoundException('User', organizerId);
    }

    if (user.role !== 'admin' && user.role !== 'organizer') {
      throw new AuthorizationException('Only administrators and organizers can create events');
    }

    const existingEvent = await this.eventRepository.findByName(createEventDto.name);
    if (existingEvent) {
      throw new ConflictException(`Event with name ${createEventDto.name} already exists`);
    }

    if (!imageFile) {
      throw new ValidationException('Event image is required', {
        image: 'An image file is required for event creation'
      });
    }

    const now = new Date().toISOString();
    const eventId = uuidv4();
    
    const fileKey = `events/${eventId}-${Date.now()}.jpg`;
    const imageUrl = await this.s3Service.uploadFile(imageFile, fileKey);
    
    const newEvent: Event = {
      ...createEventDto,
      id: eventId,
      organizerId,
      imageUrl,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const createdEvent = await this.eventRepository.create(newEvent);
    
    await this.autoRegisterOrganizer(organizerId, createdEvent.id);
    
    await this.mailService.sendEventCreatedEmail(createdEvent, user);
      
    try {
      const participants = await this.findParticipants();
      if (participants.length > 0) {
        await this.mailService.sendNewEventNotificationToParticipants(createdEvent, participants);
      }
    } catch (error) {
      console.error('Failed to send notifications to participants:', error);
    }

    return createdEvent;
  }

  private async autoRegisterOrganizer(organizerId: string, eventId: string): Promise<void> {
    const existingRegistration = await this.registrationRepository.findByUserAndEvent(organizerId, eventId);
    
    if (!existingRegistration) {
      const now = new Date().toISOString();
      
      const registration: Registration = {
        id: uuidv4(),
        userId: organizerId,
        eventId: eventId,
        active: true,
        createdAt: now,
        updatedAt: now
      };
      
      await this.registrationRepository.create(registration);
    }
  }

  private async findParticipants() {
    return [];
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
      throw new EntityNotFoundException('Event', id);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string, userRole: string, imageFile?: MulterFile): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new EntityNotFoundException('Event', id);
    }

    if (userRole !== 'admin' && event.organizerId !== userId) {
      throw new AuthorizationException('You do not have permission to update this event');
    }

    if (updateEventDto.name && updateEventDto.name !== event.name) {
      const existingEvent = await this.eventRepository.findByName(updateEventDto.name);
      if (existingEvent && existingEvent.id !== id) {
        throw new ConflictException(`Event with name ${updateEventDto.name} already exists`);
      }
    }

    let imageUrl = event.imageUrl;

    if (imageFile) {
      const fileKey = `events/${id}-${Date.now()}.jpg`;
      imageUrl = await this.s3Service.uploadFile(imageFile, fileKey);
    }

    const updatedEvent = {
      ...updateEventDto,
      imageUrl,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.eventRepository.update(id, updatedEvent);
    if (!result) {
      throw new EntityNotFoundException('Event', id);
    }
    return result;
  }

  async delete(id: string, userId: string, userRole: string): Promise<boolean> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new EntityNotFoundException('Event', id);
    }

    if (userRole !== 'admin' && event.organizerId !== userId) {
      throw new AuthorizationException('You do not have permission to delete this event');
    }

    const deactivatedEvent = {
      active: false,
      updatedAt: new Date().toISOString(),
    };

    await this.eventRepository.update(id, deactivatedEvent);
    
    const organizer = await this.userRepository.findById(event.organizerId);
    if (organizer) {
      await this.mailService.sendEventDeletedEmail(event, organizer);
    }
    
    return true;
  }

  async findByDate(date: string): Promise<Event[]> {
    return this.eventRepository.findByDate(date);
  }
}