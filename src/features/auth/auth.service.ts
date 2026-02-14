import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';
import { OrganizationService } from '../organization/org.service';
import { AuditService } from '../audit/audit.service';

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

    // AUDIT LOG: LOGIN
    // We insert this manually because 'AuditService.log' relies on sessionStorage, 
    // which hasn't been set yet (since we are currently logging in).
    try {
        await db.insertInto('audit_logs')
        .values({
            id: crypto.randomUUID(),
            organization_id: user.organization_id,
            user_id: user.id, // The user acts as themselves here
            action: 'LOGIN',
            entity: 'Auth',
            entity_id: user.id,
            details: `User ${user.username} logged in successfully`,
            timestamp: new Date().toISOString(),
            is_synced: 0
        })
        .execute();
    } catch (e) {
        console.error("Failed to audit login:", e);
        // We don't block login if logging fails
    }

    return safeUser;
  },

 
  // 2. Register / Create User
  register: async (fullName: string, username: string, passwordPlain: string, role: 'admin' | 'staff' | 'owner') => {
    // A. Get the Organization ID
    const org = await OrganizationService.getCurrent();
    if (!org) throw new Error("Cannot register user: Organization not set up.");

    // B. Security
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(passwordPlain, salt);

    // C. Generate UUID
    const newUserId = crypto.randomUUID();

    // D. Insert User
    await db.insertInto('users')
      .values({
        id: newUserId,
        organization_id: org.id,
        full_name: fullName,
        username,
        password_hash: hash,
        role,
        is_active: 1,
        
        // Sync & Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: 0,
        is_deleted: 0
      })
      .execute();

    // AUDIT LOG: REGISTER
    // This assumes an Admin is currently logged in (in Session) performing this action.
    await AuditService.log(
        'CREATE_USER', 
        'User', 
        newUserId, 
        `Registered new ${role}: ${username}`
    );
      
    return { id: newUserId };
  }
};