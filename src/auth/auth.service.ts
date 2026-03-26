import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

type User = {
  id: number;
  email: string;
  // stored as bcrypt hash
  passwordHash: string;
};

@Injectable()
export class AuthService {
  // Example in-memory user store.
  // Replace this with a real database in production.
  private users: User[] = [];

  constructor() {
    // Create a demo user with email user@example.com and password password123
    const pw = 'password123!';
    const hash = bcrypt.hashSync(pw, 10);
    this.users.push({ id: 1, email: 'user@example.com', passwordHash: hash });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : null;
  }

  // For demonstration only. In production return a JWT or session.
  async loginResponse(user: User) {
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
