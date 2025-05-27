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
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';

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

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1 * 1024 * 1024 }), 
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    ) profileImage?: MulterFile,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, profileImage);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string): Promise<{ success: boolean }> {
    const result = await this.usersService.verifyEmail(token);
    return { success: result };
  }

  @Get()
  @ApiOperation({ summary: 'List all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of users returned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can list users' })
  async findAll(
    @Query() queryDto: QueryUsersDto,
    @Request() req: any
  ): Promise<{ items: UserResponseDto[]; total: number }> {
    const userId = req.user?.id || 'mock-user-id';
    const userRole = req.user?.role || 'admin';

    return this.usersService.findAll(queryDto, userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a user by ID' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins or the user themselves can view user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<UserResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    const userRole = req.user?.role || 'admin';

    return this.usersService.findById(id, userId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only the user themselves can update their profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1 * 1024 * 1024 }), 
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    ) profileImage?: MulterFile
  ): Promise<UserResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    const userRole = req.user?.role || 'admin';

    return this.usersService.update(id, updateUserDto, userId, userRole, profileImage);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins or the user themselves can delete their account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<boolean> {
    const userId = req.user?.id || 'mock-user-id';
    const userRole = req.user?.role || 'admin';

    return this.usersService.delete(id, userId, userRole);
  }
}