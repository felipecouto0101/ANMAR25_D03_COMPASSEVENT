import { Injectable } from '@nestjs/common';
import { Event } from '../../../domain/entities/event.entity';
import { User } from '../../../domain/entities/user.entity';
import { EmailTemplate } from '../interfaces/email-template.interface';

@Injectable()
export class HtmlEmailTemplateService implements EmailTemplate {
  generateVerificationEmailTemplate(user: User, verificationLink: string): string {
    return `
      <h1>Welcome to Compass Event!</h1>
      <p>Hello ${user.name},</p>
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `;
  }

  generateAccountDeletedEmailTemplate(user: User): string {
    return `
      <h1>Account Deleted</h1>
      <p>Hello ${user.name},</p>
      <p>Your account has been successfully deleted from our system.</p>
      <p>We're sorry to see you go. If you wish to rejoin in the future, you'll need to create a new account.</p>
      <p>Thank you for being part of our community.</p>
    `;
  }

  generateEventCreatedEmailTemplate(event: Event, organizer: User): string {
    return `
      <h1>New Event Created</h1>
      <p>Hello ${organizer.name},</p>
      <p>Your event "${event.name}" has been successfully created.</p>
      <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p><strong>Description:</strong> ${event.description}</p>
      <p>We've attached a calendar invitation to this email. You can add it to your calendar application.</p>
      <p>You can manage your event from your dashboard.</p>
    `;
  }

  generateEventDeletedEmailTemplate(event: Event, organizer: User): string {
    return `
      <h1>Event Deleted</h1>
      <p>Hello ${organizer.name},</p>
      <p>Your event "${event.name}" has been deleted.</p>
      <p>If this was not intended, please contact our support team.</p>
    `;
  }

  generateRegistrationConfirmationEmailTemplate(event: Event, user: User): string {
    return `
      <h1>Registration Confirmed</h1>
      <p>Hello ${user.name},</p>
      <p>You have successfully registered for "${event.name}".</p>
      <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p>We've attached a calendar invitation to this email. You can add it to your calendar application.</p>
      <p>Looking forward to seeing you there!</p>
    `;
  }

  generateRegistrationCancelledEmailTemplate(event: Event, user: User): string {
    return `
      <h1>Registration Cancelled</h1>
      <p>Hello ${user.name},</p>
      <p>Your registration for "${event.name}" has been cancelled.</p>
      <p>If this was not intended, please register again from our website.</p>
    `;
  }

  generateNewEventNotificationEmailTemplate(event: Event, participant: User): string {
    return `
      <h1>New Event Available</h1>
      <p>Hello ${participant.name},</p>
      <p>A new event "${event.name}" has been created that might interest you.</p>
      <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p><strong>Description:</strong> ${event.description}</p>
      <p>We've attached a calendar invitation to this email. You can add it to your calendar application.</p>
      <p>Visit our website to register for this event.</p>
    `;
  }
}