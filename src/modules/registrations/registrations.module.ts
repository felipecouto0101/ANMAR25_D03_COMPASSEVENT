import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { RegistrationDynamoDBRepository } from '../../infrastructure/repositories/registration.repository';
import { EventDynamoDBRepository } from '../../infrastructure/repositories/event.repository';
import { UserDynamoDBRepository } from '../../infrastructure/repositories/user.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, MailModule, forwardRef(() => AuthModule)],
  controllers: [RegistrationsController],
  providers: [
    RegistrationsService,
    {
      provide: 'RegistrationRepository',
      useClass: RegistrationDynamoDBRepository,
    },
    {
      provide: 'EventRepository',
      useClass: EventDynamoDBRepository,
    },
    {
      provide: 'UserRepository',
      useClass: UserDynamoDBRepository,
    },
  ],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}