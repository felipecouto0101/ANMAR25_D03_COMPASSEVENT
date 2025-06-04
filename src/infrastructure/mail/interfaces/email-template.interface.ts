import { Event } from '../../../domain/entities/event.entity';
import { User } from '../../../domain/entities/user.entity';

export interface EmailTemplate {
  generateVerificationEmailTemplate(user: User, verificationLink: string): string;
  generateAccountDeletedEmailTemplate(user: User): string;
  generateEventCreatedEmailTemplate(event: Event, organizer: User): string;
  generateEventDeletedEmailTemplate(event: Event, organizer: User): string;
  generateRegistrationConfirmationEmailTemplate(event: Event, user: User): string;
  generateRegistrationCancelledEmailTemplate(event: Event, user: User): string;
  generateNewEventNotificationEmailTemplate(event: Event, participant: User): string;
}