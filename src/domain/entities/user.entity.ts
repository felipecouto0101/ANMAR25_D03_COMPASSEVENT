export class User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'organizer' | 'participant';
  profileImageUrl?: string;
  emailVerified: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}