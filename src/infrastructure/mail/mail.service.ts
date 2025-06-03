import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { User } from '../../domain/entities/user.entity';
import { NotificationService } from './notification.service';
import { TokenService } from './interfaces/token-service.interface';
import { TOKEN_SERVICE } from './constants/injection-tokens';


@Injectable()
export class MailService {
  constructor(
    private readonly notificationService: NotificationService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService
  ) {}

  generateVerificationToken(userId: string, email: string): string {
    return this.tokenService.generateToken(userId, email);
  }

  verifyEmailToken(token: string): { userId: string; email: string } | null {
    return this.tokenService.verifyToken(token);
  }

  async sendVerificationEmail(user: User): Promise<boolean> {
    return this.notificationService.sendVerificationEmail(user);
  }

  async sendAccountDeletedEmail(user: User): Promise<boolean> {
    return this.notificationService.sendAccountDeletedEmail(user);
  }

  async sendEventCreatedEmail(event: Event, organizer: User): Promise<boolean> {
    return this.notificationService.sendEventCreatedEmail(event, organizer);
  }

  async sendEventDeletedEmail(event: Event, organizer: User): Promise<boolean> {
    return this.notificationService.sendEventDeletedEmail(event, organizer);
  }

  async sendRegistrationConfirmationEmail(event: Event, user: User): Promise<boolean> {
    return this.notificationService.sendRegistrationConfirmationEmail(event, user);
  }

  async sendRegistrationCancelledEmail(event: Event, user: User): Promise<boolean> {
    return this.notificationService.sendRegistrationCancelledEmail(event, user);
  }

  async sendNewEventNotificationToParticipants(event: Event, participants: User[]): Promise<number> {
    return this.notificationService.sendNewEventNotificationToParticipants(event, participants);
  }
}