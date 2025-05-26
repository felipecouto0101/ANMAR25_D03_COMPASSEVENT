import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ description: 'Event name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Event description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Event date (ISO format)' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Event location' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({ description: 'Organizer ID' })
  @IsNotEmpty()
  @IsString()
  organizerId: string;
}