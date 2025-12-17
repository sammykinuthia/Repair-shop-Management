import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';

export const AuthService = {
  // 1. Login
  login: async (username: string, passwordPlain: string) => {
    // Find user
    const user = await db.selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .where('is_active', '=', 1)
      .executeTakeFirst();

    if (!user) return null;

    // Check Password
    const isValid = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isValid) return null;

    // Return user info (exclude password)
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  // 2. Register (Admin Only)
  register: async (fullName: string, username: string, passwordPlain: string, role: 'admin' | 'staff') => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(passwordPlain, salt);

    return await db.insertInto('users')
      .values({
        full_name: fullName,
        username,
        password_hash: hash,
        role,
        is_active: 1,
        created_at: new Date().toISOString()
      })
      .execute();
  }
};