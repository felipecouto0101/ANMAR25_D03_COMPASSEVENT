import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({ 
    description: 'Event ID', 
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true
  })
  @IsNotEmpty({ message: 'Event ID is required' })
  @IsString({ message: 'Event ID must be a string' })
  @IsUUID(4, { message: 'Event ID must be a valid UUID' })
  eventId: string;
}