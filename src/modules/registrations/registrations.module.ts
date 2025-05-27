import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { RegistrationDynamoDBRepository } from '../../infrastructure/repositories/registration.repository';
import { EventDynamoDBRepository } from '../../infrastructure/repositories/event.repository';

@Module({
  imports: [DatabaseModule],
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
  ],
})
export class RegistrationsModule {}