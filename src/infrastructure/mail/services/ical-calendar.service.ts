import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ical from 'ical-generator';
import { Event } from '../../../domain/entities/event.entity';
import { User } from '../../../domain/entities/user.entity';
import { CalendarService } from '../interfaces/calendar-service.interface';
import { EmailAttachment } from '../interfaces/email-sender.interface';

@Injectable()
export class IcalCalendarService implements CalendarService {
  private readonly frontendUrl: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL');
  }

  generateEventCalendar(event: Event, organizer?: User): EmailAttachment {
    const calendar = ical.default({
      name: 'Compass Event',
      timezone: 'UTC',
    });
    
    const eventConfig: any = {
      start: new Date(event.date),
      end: new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000), 
      summary: event.name,
      description: event.description,
      location: event.location,
      url: this.frontendUrl ? `${this.frontendUrl}/events/${event.id}` : undefined,
    };
    
    if (organizer) {
      eventConfig.organizer = {
        name: organizer.name,
        email: organizer.email
      };
    }
    
    calendar.createEvent(eventConfig);

    const icsContent = calendar.toString();
    
    return {
      filename: `${event.name.replace(/[^a-z0-9]/gi, '_')}.ics`,
      content: icsContent,
      contentType: 'text/calendar'
    };
  }
}