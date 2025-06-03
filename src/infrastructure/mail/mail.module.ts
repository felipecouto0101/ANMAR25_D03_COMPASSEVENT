import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { SesEmailSender } from './services/ses-email-sender.service';
import { IcalCalendarService } from './services/ical-calendar.service';
import { JwtTokenService } from './services/jwt-token.service';
import { HtmlEmailTemplateService } from './services/html-email-template.service';
import { EMAIL_SENDER, CALENDAR_SERVICE, TOKEN_SERVICE, EMAIL_TEMPLATE } from './constants/injection-tokens';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: SesEmailSender
    },
    {
      provide: CALENDAR_SERVICE,
      useClass: IcalCalendarService
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService
    },
    {
      provide: EMAIL_TEMPLATE,
      useClass: HtmlEmailTemplateService
    },
    NotificationService,
    MailService
  ],
  exports: [NotificationService, MailService]
})
export class MailModule {}