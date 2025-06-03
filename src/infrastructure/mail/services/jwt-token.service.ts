import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { TokenService } from '../interfaces/token-service.interface';

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly verificationSecret: string | undefined;
  private readonly verificationExpiry: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.verificationSecret = this.configService.get<string>('EMAIL_VERIFICATION_SECRET');
    this.verificationExpiry = this.configService.get<string>('EMAIL_VERIFICATION_EXPIRY');
  }

  generateToken(userId: string, email: string): string {
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

  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const secret = this.verificationSecret || 'insecure-default-secret';
      const decoded = jwt.verify(token, secret) as { userId: string; email: string };
      return decoded;
    } catch (error) {
      this.logger.error(`Invalid or expired token: ${error.message}`);
      return null;
    }
  }
}