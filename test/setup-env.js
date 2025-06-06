// Configuração do ambiente de teste
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_SESSION_TOKEN = 'test-session-token';
process.env.DEFAULT_ADMIN_NAME = 'Test Admin';
process.env.DEFAULT_ADMIN_EMAIL = 'admin@test.com';
process.env.DEFAULT_ADMIN_PASSWORD = 'Test@123';
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
process.env.EMAIL_FROM = 'noreply@test.com';
process.env.EMAIL_VERIFICATION_SECRET = 'test-verification-secret';
process.env.EMAIL_VERIFICATION_EXPIRY = '24h';
process.env.FRONTEND_URL = 'http://localhost:3000';