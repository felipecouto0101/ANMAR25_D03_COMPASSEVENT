import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event } from '../../domain/entities/event.entity';
import { User } from '../../domain/entities/user.entity';
import { EMAIL_SENDER, CALENDAR_SERVICE, TOKEN_SERVICE, EMAIL_TEMPLATE } from './constants/injection-tokens';
import { CalendarService } from './interfaces/calendar-service.interface';
import { EmailSender } from './interfaces/email-sender.interface';
import { EmailTemplate } from './interfaces/email-template.interface';
import { TokenService } from './interfaces/token-service.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly frontendUrl: string | undefined;

  constructor(
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    @Inject(EMAIL_TEMPLATE) private readonly emailTemplate: EmailTemplate,
    @Inject(CALENDAR_SERVICE) private readonly calendarService: CalendarService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    private readonly configService: ConfigService
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL');
  }

  async sendVerificationEmail(user: User): Promise<boolean> {
    
    if (!this.frontendUrl) {
      this.logger.warn('Frontend URL not configured, verification email not sent');
      return false;
    }
    
    const token = this.tokenService.generateToken(user.id, user.email);
    const verificationLink = `${this.frontendUrl}/users/verify-email?token=${token}`;
    
    const html = this.emailTemplate.generateVerificationEmailTemplate(user, verificationLink);
    return this.emailSender.sendEmail(user.email, 'Verify Your Email', html);
  }

  async sendAccountDeletedEmail(user: User): Promise<boolean> {
    const html = this.emailTemplate.generateAccountDeletedEmailTemplate(user);
    return this.emailSender.sendEmail(user.email, 'Account Deleted', html);
  }

  async sendEventCreatedEmail(event: Event, organizer: User): Promise<boolean> {
    const html = this.emailTemplate.generateEventCreatedEmailTemplate(event, organizer);
    const calendarAttachment = this.calendarService.generateEventCalendar(event, organizer);
    
    return this.emailSender.sendEmail(
      organizer.email, 
      'Event Created Successfully', 
      html, 
      [calendarAttachment]
    );
  }

  async sendEventDeletedEmail(event: Event, organizer: User): Promise<boolean> {
    const html = this.emailTemplate.generateEventDeletedEmailTemplate(event, organizer);
    return this.emailSender.sendEmail(organizer.email, 'Event Deleted', html);
  }

  async sendRegistrationConfirmationEmail(event: Event, user: User): Promise<boolean> {
    const html = this.emailTemplate.generateRegistrationConfirmationEmailTemplate(event, user);
    const calendarAttachment = this.calendarService.generateEventCalendar(event);
    
    return this.emailSender.sendEmail(
      user.email, 
      `Registration Confirmed: ${event.name}`, 
      html, 
      [calendarAttachment]
    );
  }

  async sendRegistrationCancelledEmail(event: Event, user: User): Promise<boolean> {
    const html = this.emailTemplate.generateRegistrationCancelledEmailTemplate(event, user);
    return this.emailSender.sendEmail(user.email, `Registration Cancelled: ${event.name}`, html);
  }

  async sendNewEventNotificationToParticipants(event: Event, participants: User[]): Promise<number> {
    const calendarAttachment = this.calendarService.generateEventCalendar(event);
    
    let successCount = 0;
    for (const participant of participants) {
      const html = this.emailTemplate.generateNewEventNotificationEmailTemplate(event, participant);
      
      const success = await this.emailSender.sendEmail(
        participant.email,
        `New Event: ${event.name}`,
        html,
        [calendarAttachment]
      );

      if (success) {
        successCount++;
      }
    }

    return successCount;
  }
}