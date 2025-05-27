import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUsersDto {
  @ApiProperty({ description: 'Filter by user name (partial match)', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Filter by user email (partial match)', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Filter by user role', enum: ['admin', 'organizer', 'participant'], required: false })
  @IsOptional()
  @IsEnum(['admin', 'organizer', 'participant'], {
    message: 'Role must be admin, organizer or participant',
  })
  role?: 'admin' | 'organizer' | 'participant';

  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}