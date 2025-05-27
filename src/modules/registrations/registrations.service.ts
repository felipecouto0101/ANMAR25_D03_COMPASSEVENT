import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationRepository } from '../../domain/repositories/registration.repository.interface';
import { EventRepository } from '../../domain/repositories/event.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { QueryRegistrationsDto } from './dto/query-registrations.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    @Inject('RegistrationRepository')
    private readonly registrationRepository: RegistrationRepository,
    @Inject('EventRepository')
    private readonly eventRepository: EventRepository,
  ) {}

  async create(userId: string, createRegistrationDto: CreateRegistrationDto): Promise<RegistrationResponseDto> {
    const event = await this.eventRepository.findById(createRegistrationDto.eventId);
    if (!event) {
      throw new NotFoundException(`Event with id ${createRegistrationDto.eventId} not found`);
    }

    if (!event.active) {
      throw new BadRequestException(`Event with id ${createRegistrationDto.eventId} is inactive`);
    }

    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate < now) {
      throw new BadRequestException(`Cannot register for past events`);
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
      updatedAt: now_iso,
    };

    const createdRegistration = await this.registrationRepository.create(newRegistration);
    return new RegistrationResponseDto(createdRegistration, event);
  }

  async findAll(userId: string, queryDto: QueryRegistrationsDto, requestUserId: string): Promise<{ items: RegistrationResponseDto[]; total: number }> {
    if (userId !== requestUserId) {
      throw new ForbiddenException('You can only view your own registrations');
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
          throw new NotFoundException(`Event with id ${registration.eventId} not found`);
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
      throw new NotFoundException(`Registration with id ${id} not found`);
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own registrations');
    }

    const deactivatedRegistration = {
      active: false,
      updatedAt: new Date().toISOString(),
    };

    await this.registrationRepository.update(id, deactivatedRegistration);
    return true;
  }
}