import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Event name' })
  name: string;

  @ApiProperty({ description: 'Event description' })
  description: string;

  @ApiProperty({ description: 'Event date (ISO format)' })
  date: string;

  @ApiProperty({ description: 'Event location' })
  location: string;
}