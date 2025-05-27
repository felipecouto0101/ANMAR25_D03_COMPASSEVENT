import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({ description: 'Event ID' })
  @IsNotEmpty()
  @IsString()
  eventId: string;
}