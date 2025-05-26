import { ApiProperty } from '@nestjs/swagger';

export class UpdateEventDto {
  @ApiProperty({ description: 'Event name', required: false })
  name?: string;

  @ApiProperty({ description: 'Event description', required: false })
  description?: string;

  @ApiProperty({ description: 'Event date (ISO format)', required: false })
  date?: string;

  @ApiProperty({ description: 'Event location', required: false })
  location?: string;
}