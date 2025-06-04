import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventDynamoDBRepository } from '../../infrastructure/repositories/event.repository';
import { UserDynamoDBRepository } from '../../infrastructure/repositories/user.repository';
import { RegistrationDynamoDBRepository } from '../../infrastructure/repositories/registration.repository';
import { S3Module } from '../../infrastructure/storage/s3/s3.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule, S3Module, MailModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    {
      provide: 'EventRepository',
      useClass: EventDynamoDBRepository,
    },
    {
      provide: 'UserRepository',
      useClass: UserDynamoDBRepository,
    },
    {
      provide: 'RegistrationRepository',
      useClass: RegistrationDynamoDBRepository,
    },
  ],
  exports: [EventsService],
})
export class EventsModule {}