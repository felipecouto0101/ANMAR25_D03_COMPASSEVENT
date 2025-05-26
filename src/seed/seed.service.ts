import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../modules/users/users.service';

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
      const existingAdmin = await this.usersService.findByEmail(defaultAdminEmail);
      
      if (existingAdmin) {
        this.logger.log(`Default admin user already exists: ${defaultAdminEmail}`);
        return;
      }

      const defaultAdmin = {
        name: defaultAdminName,
        email: defaultAdminEmail,
        password: defaultAdminPassword,
        role: 'admin',
        active: true,
      };

      const createdAdmin = await this.usersService.create(defaultAdmin);
      this.logger.log(`Default admin user created: ${createdAdmin.email}`);
    } catch (error) {
      this.logger.error(`Failed to seed default admin user: ${error.message}`);
    }
  }
}