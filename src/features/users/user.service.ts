import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';
import { OrganizationService } from '../organization/org.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../../lib/mail';
import {  error } from '@tauri-apps/plugin-log';

export const UserService = {
  // 1. Authenticate (Login)
  authenticate: async (username: string, passwordPlain: string) => {
    const user = await db.selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .where('is_active', '=', 1)
      .executeTakeFirst();

    if (!user) return null;

    const isValid = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isValid) return null;

    const { password_hash, ...safeUser } = user;

    // AUDIT LOG: LOGIN
    // Manual insert required because Session is not yet set
    try {
      await db.insertInto('audit_logs')
        .values({
          id: crypto.randomUUID(),
          organization_id: user.organization_id,
          user_id: user.id,
          action: 'LOGIN',
          entity: 'Auth',
          entity_id: user.id,
          details: `User '${user.username}' logged in successfully`,
          timestamp: new Date().toISOString(),
          is_synced: 0
        })
        .execute();
    } catch (e) {
      console.error("Audit error during login:", e);
    }

    return safeUser;
  },

  // 2. Create User
  create: async (adminId: string | null, newUser: any) => {
    const org = await OrganizationService.getCurrent();
    if (!org) throw new Error("No organization found");

      // --- PLAN LIMITATION LOGIC ---
    if (org.subscription_plan === 'free') {
        // Check current user count
        const result = await db.selectFrom('users')
            .select(db.fn.count('id').as('count'))
            .where('is_deleted', '=', 0)
            .executeTakeFirst();
            
        const count = Number(result?.count || 0);
        
        // Free plan limit: 1 User (The Owner) + maybe 1 staff?
        // Let's say Free = 2 users max.
        if (count >= 2) {
            throw new Error("Free Plan Limit Reached (Max 2 Users). Upgrade to Pro to add more staff.");
        }
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.password, salt);
    const newId = crypto.randomUUID();

    await db.insertInto('users')
      .values({
        id: newId,
        organization_id: org.id,
        full_name: newUser.full_name,
        username: newUser.username,
        role: newUser.role,
        password_hash: hash,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: 0,
        is_deleted: 0
      })
      .execute();

    // Specific Log
    await AuditService.log(
      'CREATE_USER', 
      'User', 
      newId, 
      `Created new ${newUser.role} account: '${newUser.username}' (${newUser.full_name})`
    );

    return { id: newId };
  },

  // 3. Get All Users
  getAll: async () => {
    return await db.selectFrom('users')
      .select(['id', 'full_name', 'username', 'role', 'is_active', 'created_at'])
      .where('is_deleted', '=', 0)
      .orderBy('created_at', 'desc')
      .execute();
  },

  // 4. Toggle Status (Active/Inactive)
  toggleStatus: async (adminId: string, targetUserId: string, currentStatus: number) => {
    // A. Fetch target details first for the log
    const targetUser = await db.selectFrom('users')
      .select('username')
      .where('id', '=', targetUserId)
      .executeTakeFirst();
      
    const targetName = targetUser?.username || 'Unknown User';
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // B. Perform Update
    await db.updateTable('users')
      .set({ is_active: newStatus, updated_at: new Date().toISOString(), is_synced: 0 })
      .where('id', '=', targetUserId)
      .execute();

    // C. Specific Log
    const actionVerb = newStatus === 1 ? 'Activated' : 'Deactivated';
    await AuditService.log(
      'UPDATE_STATUS', 
      'User', 
      targetUserId, 
      `${actionVerb} account for user: '${targetName}'`
    );
  },

  // 5. Delete User (Soft Delete)
  delete: async (adminId: string, targetUserId: string) => {
    // A. Fetch target details first
    const targetUser = await db.selectFrom('users')
      .select(['username', 'full_name'])
      .where('id', '=', targetUserId)
      .executeTakeFirst();

    const targetLabel = targetUser ? `${targetUser.username} (${targetUser.full_name})` : 'Unknown User';

    // B. Perform Delete
    await db.updateTable('users')
      .set({ is_deleted: 1, updated_at: new Date().toISOString(), is_synced: 0 })
      .where('id', '=', targetUserId)
      .execute();

    // C. Specific Log
    await AuditService.log(
      'DELETE_USER', 
      'User', 
      targetUserId, 
      `Permanently deleted user account: ${targetLabel}`
    );
  },
   initiatePasswordReset: async (usernameOrEmail: string) => {
    // Find user (Owner only)
    const user = await db.selectFrom('users')
      .selectAll()
      .where((eb) => eb.or([
        eb('username', '=', usernameOrEmail),
        // If you had an email column on users, check that too. 
        // For now, we assume we might fallback to Organization Email if user is Owner
      ]))
      .where('role', '=', 'owner') // Security: Only owners can reset via email
      .executeTakeFirst();

    if (!user) throw new Error("Owner account not found.");

    // Determine where to send email
    // 1. Check Organization email (since owner manages the shop)
    const org = await OrganizationService.getCurrent();
    const targetEmail = org?.email; 

    if (!targetEmail || !targetEmail.includes('@')) {
        throw new Error("No valid email address found in Shop Settings. Cannot send reset code.");
    }

    // Generate 6-digit Code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Save to DB
    await db.updateTable('users')
      .set({ 
        reset_token: code, 
        reset_expires: expiry,
        is_synced: 0 // Sync this change later
      })
      .where('id', '=', user.id)
      .execute();

    error("Password reset code generated for user:");
      // Send Email
    await MailService.sendResetEmail(targetEmail, user.full_name, code);
    
    return { email: targetEmail }; // Return masked email to UI
  },

  // 2. Verify & Change Password
  completePasswordReset: async (username: string, code: string, newPassword: string) => {
    const user = await db.selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .where('role', '=', 'owner')
      .executeTakeFirst();

    if (!user) throw new Error("User not found");

    // Validate Code
    if (user.reset_token !== code) throw new Error("Invalid Reset Code");
    if (!user.reset_expires || new Date() > new Date(user.reset_expires)) {
        throw new Error("Reset Code Expired");
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update DB & Clear Token
    await db.updateTable('users')
      .set({ 
        password_hash: hash,
        reset_token: null,
        reset_expires: null,
        updated_at: new Date().toISOString(),
        is_synced: 0
      })
      .where('id', '=', user.id)
      .execute();

    return true;
  }
};