import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from '../../domain/entities/event.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  async create(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active events' })
  @ApiResponse({ status: 200, description: 'List of events returned successfully' })
  async findAll(): Promise<Event[]> {
    return this.eventsService.findAll();
  }

  @Get('date')
  @ApiOperation({ summary: 'Find events by date' })
  @ApiResponse({ status: 200, description: 'List of events returned successfully' })
  async findByDate(@Query('date') date: string): Promise<Event[]> {
    return this.eventsService.findByDate(date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find an event by ID' })
  @ApiResponse({ status: 200, description: 'Event found successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id') id: string): Promise<Event> {
    return this.eventsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate an event (soft delete)' })
  @ApiResponse({ status: 200, description: 'Event deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id') id: string): Promise<boolean> {
    return this.eventsService.delete(id);
  }
}