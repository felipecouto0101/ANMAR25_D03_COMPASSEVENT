import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Query, 
  Request,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { QueryRegistrationsDto } from './dto/query-registrations.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';

@ApiTags('registrations')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @ApiOperation({ summary: 'Register for an event' })
  @ApiResponse({ status: 201, description: 'Registration created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Event is inactive or in the past' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'User is already registered for this event' })
  async create(
    @Body() createRegistrationDto: CreateRegistrationDto,
    @Request() req: any
  ): Promise<RegistrationResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    const userRole = req.user?.role || 'participant';

    if (userRole !== 'participant' && userRole !== 'organizer') {
      throw new ForbiddenException('Only participants and organizers can register for events');
    }

    return this.registrationsService.create(userId, createRegistrationDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List all registrations for a user' })
  @ApiResponse({ status: 200, description: 'List of registrations returned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only view your own registrations' })
  async findAll(
    @Param('userId') userId: string,
    @Query() queryDto: QueryRegistrationsDto,
    @Request() req: any
  ): Promise<{ items: RegistrationResponseDto[]; total: number }> {
    const requestUserId = req.user?.id || 'mock-user-id';
    return this.registrationsService.findAll(userId, queryDto, requestUserId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a registration' })
  @ApiResponse({ status: 200, description: 'Registration cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only cancel your own registrations' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<boolean> {
    const userId = req.user?.id || 'mock-user-id';
    return this.registrationsService.delete(id, userId);
  }
}