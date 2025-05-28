import { ApiProperty } from '@nestjs/swagger';
import { Registration } from '../../../domain/entities/registration.entity';
import { Event } from '../../../domain/entities/event.entity';

export class RegistrationResponseDto {
  @ApiProperty({ description: 'Registration ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Event' })
  event: {
    id: string;
    name: string;
    description: string;
    date: string;
    location: string;
    imageUrl?: string;
  };

  @ApiProperty({ description: 'Registration creation date' })
  createdAt: string;

  constructor(registration: Registration, event: Event) {
    this.id = registration.id;
    this.userId = registration.userId;
    this.event = {
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      location: event.location,
      imageUrl: event.imageUrl,
    };
    this.createdAt = registration.createdAt;
  }
}