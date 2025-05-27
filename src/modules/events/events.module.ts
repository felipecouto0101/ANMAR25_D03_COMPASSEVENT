import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { S3Module } from '../../infrastructure/storage/s3/s3.module';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventDynamoDBRepository } from '../../infrastructure/repositories/event.repository';
import { UserDynamoDBRepository } from '../../infrastructure/repositories/user.repository';

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
  ],
})
export class EventsModule {}