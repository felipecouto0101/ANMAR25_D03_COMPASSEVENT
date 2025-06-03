export interface TokenService {
  generateToken(userId: string, email: string): string;
  verifyToken(token: string): { userId: string; email: string } | null;
}