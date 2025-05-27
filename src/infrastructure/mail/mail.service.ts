import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand, ListVerifiedEmailAddressesCommand } from '@aws-sdk/client-ses';
import * as ical from 'ical-generator';
import * as jwt from 'jsonwebtoken';
import { User } from '../../domain/entities/user.entity';
import { Event } from '../../domain/entities/event.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly sesClient: SESClient | null = null;
  private readonly isEnabled: boolean = false;
  private readonly fromEmail: string | undefined;
  private readonly frontendUrl: string | undefined;
  private readonly verificationSecret: string | undefined;
  private readonly verificationExpiry: string | undefined;
  private verifiedEmails: Set<string> = new Set();

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const sessionToken = this.configService.get<string>('AWS_SESSION_TOKEN');
    
    this.fromEmail = this.configService.get<string>('EMAIL_FROM');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL');
    this.verificationSecret = this.configService.get<string>('EMAIL_VERIFICATION_SECRET');
    this.verificationExpiry = this.configService.get<string>('EMAIL_VERIFICATION_EXPIRY');

    if (region && accessKeyId && secretAccessKey && this.fromEmail) {
      this.isEnabled = true;
      this.sesClient = new SESClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
      });
      this.logger.log('Email service is enabled');
      this.loadVerifiedEmails();
    } else {
      this.logger.warn('Email service is disabled due to missing credentials or configuration');
    }
  }

  private async loadVerifiedEmails(): Promise<void> {
    if (!this.isEnabled || !this.sesClient) {
      return;
    }

    try {
      const command = new ListVerifiedEmailAddressesCommand({});
      const response = await this.sesClient.send(command);
      
      if (response.VerifiedEmailAddresses) {
        this.verifiedEmails = new Set(response.VerifiedEmailAddresses);
        this.logger.log(`Loaded ${this.verifiedEmails.size} verified email addresses`);
      }
    } catch (error) {
      this.logger.error(`Failed to load verified emails: ${error.message}`);
    }
  }

  private isEmailVerified(email: string): boolean {
    return this.verifiedEmails.has(email);
  }

  private async sendEmail(to: string, subject: string, html: string, attachments?: any[]): Promise<boolean> {
    if (!this.isEnabled || !this.sesClient || !this.fromEmail) {
      this.logger.warn(`Email sending skipped: ${subject}`);
      return false;
    }

    if (!this.isEmailVerified(to)) {
      this.logger.warn(`Email ${to} is not verified. In sandbox mode, you can only send to verified emails.`);
      this.logger.warn(`To verify this email, go to AWS SES console and add it as a verified identity.`);
      return false;
    }

    try {
      const params = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
          },
        },
      };

      if (attachments && attachments.length > 0) {
      }

      await this.sesClient.send(new SendEmailCommand(params));
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  generateVerificationToken(userId: string, email: string): string {
    if (!this.verificationSecret) {
      this.logger.warn('Verification secret not configured, using insecure default');
      return jwt.sign({ userId, email }, 'insecure-default-secret', { expiresIn: '24h' });
    }
    
    return jwt.sign(
      { userId, email },
      this.verificationSecret,
      { expiresIn: this.verificationExpiry || '24h' }
    );
  }

  verifyEmailToken(token: string): { userId: string; email: string } | null {
    try {
      const secret = this.verificationSecret || 'insecure-default-secret';
      const decoded = jwt.verify(token, secret) as { userId: string; email: string };
      return decoded;
    } catch (error) {
      this.logger.error(`Invalid or expired token: ${error.message}`);
      return null;
    }
  }

  async sendVerificationEmail(user: User): Promise<boolean> {
    if (!this.frontendUrl) {
      this.logger.warn('Frontend URL not configured, verification email not sent');
      return false;
    }
    
    const token = this.generateVerificationToken(user.id, user.email);
    const verificationLink = `${this.frontendUrl}/users/verify-email?token=${token}`;
    
    const html = `
      <h1>Welcome to Compass Event!</h1>
      <p>Hello ${user.name},</p>
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `;

    return this.sendEmail(user.email, 'Verify Your Email', html);
  }

  async sendAccountDeletedEmail(user: User): Promise<boolean> {
    const html = `
      <h1>Account Deleted</h1>
      <p>Hello ${user.name},</p>
      <p>Your account has been successfully deleted from our system.</p>
      <p>We're sorry to see you go. If you wish to rejoin in the future, you'll need to create a new account.</p>
      <p>Thank you for being part of our community.</p>
    `;

    return this.sendEmail(user.email, 'Account Deleted', html);
  }

  async sendEventCreatedEmail(event: Event, organizer: User): Promise<boolean> {
    const html = `
      <h1>New Event Created</h1>
      <p>Hello ${organizer.name},</p>
      <p>Your event "${event.name}" has been successfully created.</p>
      <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p><strong>Description:</strong> ${event.description}</p>
      <p>You can manage your event from your dashboard.</p>
    `;

    return this.sendEmail(organizer.email, 'Event Created Successfully', html);
  }

  async sendEventDeletedEmail(event: Event, organizer: User): Promise<boolean> {
    const html = `
      <h1>Event Deleted</h1>
      <p>Hello ${organizer.name},</p>
      <p>Your event "${event.name}" has been deleted.</p>
      <p>If this was not intended, please contact our support team.</p>
    `;

    return this.sendEmail(organizer.email, 'Event Deleted', html);
  }

  async sendRegistrationConfirmationEmail(event: Event, user: User): Promise<boolean> {
    const calendar = ical.default({
      name: 'Compass Event',
      timezone: 'UTC',
    });
    
    calendar.createEvent({
      start: new Date(event.date),
      end: new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000), 
      summary: event.name,
      description: event.description,
      location: event.location,
      url: this.frontendUrl ? `${this.frontendUrl}/events/${event.id}` : undefined,
    });

    const icsContent = calendar.toString();
    
    const html = `
      <h1>Registration Confirmed</h1>
      <p>Hello ${user.name},</p>
      <p>You have successfully registered for "${event.name}".</p>
      <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p>We've attached a calendar invitation to this email. You can add it to your calendar application.</p>
      <p>Looking forward to seeing you there!</p>
    `;
    
    return this.sendEmail(user.email, `Registration Confirmed: ${event.name}`, html);
  }

  async sendRegistrationCancelledEmail(event: Event, user: User): Promise<boolean> {
    const html = `
      <h1>Registration Cancelled</h1>
      <p>Hello ${user.name},</p>
      <p>Your registration for "${event.name}" has been cancelled.</p>
      <p>If this was not intended, please register again from our website.</p>
    `;

    return this.sendEmail(user.email, `Registration Cancelled: ${event.name}`, html);
  }

  async sendNewEventNotificationToParticipants(event: Event, participants: User[]): Promise<number> {
    if (!this.isEnabled || !this.sesClient) {
      return 0;
    }

    let successCount = 0;
    for (const participant of participants) {
      const html = `
        <h1>New Event Available</h1>
        <p>Hello ${participant.name},</p>
        <p>A new event "${event.name}" has been created that might interest you.</p>
        <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Description:</strong> ${event.description}</p>
        <p>Visit our website to register for this event.</p>
      `;

      const success = await this.sendEmail(
        participant.email,
        `New Event: ${event.name}`,
        html
      );

      if (success) {
        successCount++;
      }
    }

    return successCount;
  }
}