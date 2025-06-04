export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export interface EmailSender {
  sendEmail(to: string, subject: string, html: string, attachments?: EmailAttachment[]): Promise<boolean>;
}