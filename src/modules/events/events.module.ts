import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventDynamoDBRepository } from '../../infrastructure/repositories/event.repository';

@Module({
  imports: [DatabaseModule],
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