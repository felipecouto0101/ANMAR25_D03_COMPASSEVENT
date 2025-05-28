import { Injectable, Inject } from '@nestjs/common';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationRepository } from '../../domain/repositories/registration.repository.interface';
import { EventRepository } from '../../domain/repositories/event.repository.interface';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { MailService } from '../../infrastructure/mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { QueryRegistrationsDto } from './dto/query-registrations.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { 
  EntityNotFoundException, 
  ValidationException, 
  AuthorizationException, 
  ConflictException 
} from '../../domain/exceptions/domain.exceptions';

@Injectable()
export class RegistrationsService {
  constructor(
    @Inject('RegistrationRepository')
    private readonly registrationRepository: RegistrationRepository,
    @Inject('EventRepository')
    private readonly eventRepository: EventRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async create(userId: string, createRegistrationDto: CreateRegistrationDto): Promise<RegistrationResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }
    
    if (user.role !== 'participant' && user.role !== 'organizer') {
      throw new AuthorizationException('Only participants and organizers can register for events');
    }
    
    const event = await this.eventRepository.findById(createRegistrationDto.eventId);
    if (!event) {
      throw new EntityNotFoundException('Event', createRegistrationDto.eventId);
    }

    if (!event.active) {
      throw new ValidationException(`Event with id ${createRegistrationDto.eventId} is inactive`, {
        eventId: "Must be an active event ID"
      });
    }

    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate < now) {
      throw new ValidationException('Cannot register for past events', {
        eventId: "Must be a future event ID"
      });
    }

    const existingRegistration = await this.registrationRepository.findByUserAndEvent(userId, createRegistrationDto.eventId);
    if (existingRegistration && existingRegistration.active) {
      throw new ConflictException(`User is already registered for this event`);
    }

    const now_iso = new Date().toISOString();
    
    const newRegistration: Registration = {
      id: uuidv4(),
      userId,
      eventId: createRegistrationDto.eventId,
      active: true,
      createdAt: now_iso,
      updatedAt: now_iso
    };

    const createdRegistration = await this.registrationRepository.create(newRegistration);
    await this.mailService.sendRegistrationConfirmationEmail(event, user);
    
    return new RegistrationResponseDto(createdRegistration, event);
  }

  async findAll(userId: string, queryDto: QueryRegistrationsDto, requestUserId: string): Promise<{ items: RegistrationResponseDto[]; total: number }> {
    if (userId !== requestUserId) {
      throw new AuthorizationException('You can only view your own registrations');
    }

    const result = await this.registrationRepository.findByUser(
      userId,
      queryDto.page || 1,
      queryDto.limit || 10
    );

    const registrationsWithEvents = await Promise.all(
      result.items.map(async (registration) => {
        const event = await this.eventRepository.findById(registration.eventId);
        if (!event) {
          throw new EntityNotFoundException('Event', registration.eventId);
        }
        return new RegistrationResponseDto(registration, event);
      })
    );

    return {
      items: registrationsWithEvents,
      total: result.total,
    };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const registration = await this.registrationRepository.findById(id);
    if (!registration) {
      throw new EntityNotFoundException('Registration', id);
    }

    if (registration.userId !== userId) {
      throw new AuthorizationException('You can only cancel your own registrations');
    }

    const deactivatedRegistration = {
      active: false,
      updatedAt: new Date().toISOString(),
    };

    await this.registrationRepository.update(id, deactivatedRegistration);
    
    const user = await this.userRepository.findById(userId);
    const event = await this.eventRepository.findById(registration.eventId);
    
    if (user && event) {
      await this.mailService.sendRegistrationCancelledEmail(event, user);
    }
    
    return true;
  }
}