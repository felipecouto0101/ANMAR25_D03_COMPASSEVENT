import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { S3Module } from '../../infrastructure/storage/s3/s3.module';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventDynamoDBRepository } from '../../infrastructure/repositories/event.repository';

@Module({
  imports: [DatabaseModule, S3Module],
  controllers: [EventsController],
  providers: [
    EventsService,
    {
      provide: 'EventRepository',
      useClass: EventDynamoDBRepository,
    },
  ],
})
export class EventsModule {}