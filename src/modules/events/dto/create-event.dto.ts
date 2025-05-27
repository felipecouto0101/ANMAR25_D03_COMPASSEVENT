import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ description: 'Event name', example: 'Tech Conference 2025' })
  @IsNotEmpty({ message: 'Event name is required' })
  @IsString({ message: 'Event name must be a string' })
  name: string;

  @ApiProperty({ description: 'Event description', example: 'Annual technology conference with workshops and networking' })
  @IsNotEmpty({ message: 'Event description is required' })
  @IsString({ message: 'Event description must be a string' })
  description: string;

  @ApiProperty({ description: 'Event date (ISO format)', example: '2025-12-15T09:00:00.000Z' })
  @IsNotEmpty({ message: 'Event date is required' })
  @IsDateString({}, { message: 'Event date must be a valid ISO date string' })
  date: string;

  @ApiProperty({ description: 'Event location', example: 'Convention Center, New York' })
  @IsNotEmpty({ message: 'Event location is required' })
  @IsString({ message: 'Event location must be a string' })
  location: string;
}