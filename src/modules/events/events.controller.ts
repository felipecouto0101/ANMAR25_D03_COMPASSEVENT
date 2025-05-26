import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Delete, 
  Query, 
  UseInterceptors, 
  UploadedFile,
  BadRequestException,
  UseGuards,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { Event } from '../../domain/entities/event.entity';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Event name already exists' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createEventDto: CreateEventDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), 
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    ) imageFile: MulterFile,
    @Request() req: any
  ): Promise<Event> {

    const userId = req.user?.id || 'mock-user-id';
    const userRole = req.user?.role || 'admin';

    
    if (userRole !== 'admin' && userRole !== 'organizer') {
      throw new BadRequestException('You do not have permission to create events');
    }

    return this.eventsService.create(createEventDto, imageFile);
  }

  @Get()
  @ApiOperation({ summary: 'List all events with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of events returned successfully' })
  async findAll(@Query() queryDto: QueryEventsDto): Promise<{ items: Event[]; total: number }> {
    return this.eventsService.findAll(queryDto);
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
  @ApiResponse({ status: 400, description: 'Bad request or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Event name already exists' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), 
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    ) imageFile: MulterFile,
    @Request() req: any
  ): Promise<Event> {
    
    const userId = req.user?.id || 'mock-user-id';
    const userRole = req.user?.role || 'admin';

    return this.eventsService.update(id, updateEventDto, userId, userRole, imageFile);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate an event (soft delete)' })
  @ApiResponse({ status: 200, description: 'Event deactivated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<boolean> {
    
    const userId = req.user?.id || 'mock-user-id';
    const userRole = req.user?.role || 'admin';

    return this.eventsService.delete(id, userId, userRole);
  }
}