import { Event } from '../../../domain/entities/event.entity';
import { User } from '../../../domain/entities/user.entity';
import { EmailAttachment } from './email-sender.interface';

export interface CalendarService {
  generateEventCalendar(event: Event, organizer?: User): EmailAttachment;
}