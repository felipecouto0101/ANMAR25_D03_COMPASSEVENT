import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand, ListVerifiedEmailAddressesCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { EmailSender, EmailAttachment } from '../interfaces/email-sender.interface';

@Injectable()
export class SesEmailSender implements EmailSender {
  private readonly logger = new Logger(SesEmailSender.name);
  private readonly sesClient: SESClient | null = null;
  private readonly isEnabled: boolean = false;
  private readonly fromEmail: string | undefined;
  private verifiedEmails: Set<string> = new Set();

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const sessionToken = this.configService.get<string>('AWS_SESSION_TOKEN');
    
    this.fromEmail = this.configService.get<string>('EMAIL_FROM');

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
      
      this.verifiedEmails = new Set(response.VerifiedEmailAddresses || []);
      this.logger.log(`Loaded ${this.verifiedEmails.size} verified email addresses`);
    } catch (error) {
      this.logger.error(`Failed to load verified emails: ${error.message}`);
    }
  }

  private isEmailVerified(email: string): boolean {
    if (process.env.NODE_ENV === 'test') {
      return true;
    }
    return this.verifiedEmails.has(email);
  }

  async sendEmail(to: string, subject: string, html: string, attachments?: EmailAttachment[]): Promise<boolean> {
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
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
      
      if (hasAttachments) {
        const boundary = `----=_Part_${Date.now().toString(16)}`;
        
        const emailLines = [
          `From: ${this.fromEmail}`,
          `To: ${to}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/html; charset=utf-8',
          '',
          html,
          ''
        ];
        
        for (const attachment of attachments) {
          const base64Content = Buffer.from(attachment.content).toString('base64');
          emailLines.push(`--${boundary}`);
          emailLines.push(`Content-Type: ${attachment.contentType}; name="${attachment.filename}"`);
          emailLines.push('Content-Transfer-Encoding: base64');
          emailLines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
          emailLines.push('');
          emailLines.push(base64Content);
          emailLines.push('');
        }
        
        emailLines.push(`--${boundary}--`);
        
        const rawEmail = emailLines.join('\r\n');
        
        const params = {
          RawMessage: {
            Data: Buffer.from(rawEmail)
          }
        };
        
        await this.sesClient.send(new SendRawEmailCommand(params));
        
        this.logger.log(`Email with attachments sent to ${to}: ${subject}`);
        return true;
      }
      
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
      
      await this.sesClient.send(new SendEmailCommand(params));
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }
}