import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';

export const UserService = {
  // Login
  authenticate: async (username: string, passwordPlain: string) => {
    const user = await db.selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .where('is_active', '=', 1)
      .executeTakeFirst();

    if (!user) return null;

    const isValid = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isValid) return null;

    // Log the login event
    await AuditService.log(user.id, 'LOGIN', 'Auth', null, 'User logged in');

    // Remove hash from return object
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  // Create User (Admin Only)
  create: async (adminId: number, newUser: any) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.password, salt);

    const result = await db.insertInto('users')
      .values({
        full_name: newUser.full_name,
        username: newUser.username,
        role: newUser.role,
        password_hash:hash,
        created_at: new Date().toISOString(),
        is_active: 1
      })
      .executeTakeFirst();

    await AuditService.log(adminId, 'CREATE_USER', 'Users', result.insertId?.toString() || null, `Created user ${newUser.username}`);
    return result;
  },

  // List all users (For Staff Management Page)
  getAll: async () => {
    return await db.selectFrom('users')
      .select(['id', 'full_name', 'username', 'role', 'is_active', 'created_at'])
      .execute();
  }
};