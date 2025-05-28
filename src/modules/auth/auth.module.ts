import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OwnerGuard } from './guards/owner.guard';
import { EventOwnerGuard } from './guards/event-owner.guard';
import { RegistrationOwnerGuard } from './guards/registration-owner.guard';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UserDynamoDBRepository } from '../../infrastructure/repositories/user.repository';
import { EventsModule } from '../events/events.module';
import { RegistrationsModule } from '../registrations/registrations.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => EventsModule),
    forwardRef(() => RegistrationsModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    OwnerGuard,
    EventOwnerGuard,
    RegistrationOwnerGuard,
    {
      provide: 'UserRepository',
      useClass: UserDynamoDBRepository,
    }
  ],
  exports: [
    AuthService, 
    JwtStrategy, 
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
    OwnerGuard,
    EventOwnerGuard,
    RegistrationOwnerGuard
  ],
})
export class AuthModule {}