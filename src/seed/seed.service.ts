import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../modules/users/users.service';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async seed() {
    await this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    const defaultAdminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
    const defaultAdminName = this.configService.get<string>('DEFAULT_ADMIN_NAME');
    const defaultAdminPassword = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD');
    
    if (!defaultAdminEmail || !defaultAdminName || !defaultAdminPassword) {
      this.logger.warn('Default admin credentials not fully provided in environment variables');
      return;
    }

    try {
      const users = await this.usersService.findAll(
        { email: defaultAdminEmail, limit: 1, page: 1 },
        'system',
        'admin'
      );
      
      if (users.items.length > 0) {
        this.logger.log(`Default admin user already exists: ${defaultAdminEmail}`);
        return;
      }

      const defaultAdmin: CreateUserDto = {
        name: defaultAdminName,
        email: defaultAdminEmail,
        password: defaultAdminPassword,
        phone: '+1234567890', 
        role: 'admin',
      };

     
      const defaultImagePath = path.join(__dirname, '..', '..', 'assets', 'default-profile.jpg');
      let profileImageBuffer: Buffer;
      
      try {
        profileImageBuffer = fs.readFileSync(defaultImagePath);
      } catch (error) {
        
        profileImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        this.logger.warn('Default profile image not found, using placeholder');
      }

      const profileImage = {
        fieldname: 'profileImage',
        originalname: 'default-profile.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: profileImageBuffer.length,
        buffer: profileImageBuffer
      };

      const createdAdmin = await this.usersService.create(defaultAdmin, profileImage);
      this.logger.log(`Default admin user created: ${createdAdmin.email}`);
    } catch (error) {
      this.logger.error(`Failed to seed default admin user: ${error.message}`);
    }
  }
}