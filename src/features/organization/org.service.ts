import { db } from '../../lib/db';
import { UserService } from '../users/user.service';

export const OrganizationService = {
  // Check if app is initialized
  hasOrganization: async () => {
    const result = await db.selectFrom('organizations')
      .select('id')
      .limit(1)
      .executeTakeFirst();
    return !!result;
  },

  getCurrent: async () => {
    return await db.selectFrom('organizations').selectAll().limit(1).executeTakeFirst();
  },

  // THE FULL SETUP: Creates Org + First Admin
  initializeShop: async (shopData: any, adminData: any) => {
    const orgId = crypto.randomUUID();
    
    // 1. Create Organization (Defaulting to FREE tier)
    await db.insertInto('organizations')
      .values({
        id: orgId,
        name: shopData.name,
        phone: shopData.phone || null,
        email: shopData.email || null,
        address: shopData.address || null,
        subscription_plan: 'free', // <--- FREE TIER (Offline Only)
        created_at: new Date().toISOString(),
        is_synced: 0
      })
      .execute();

    // 2. Create the Owner (Admin)
    // We pass 'null' as adminId because no one is logged in yet
    // We assume UserService handles the Org ID lookup, BUT since we just created it
    // and it might not be committed/visible via 'getCurrent' instantly in same tick,
    // let's manually insert the user here to be safe and link it to orgId.
    
    // Actually, let's use the UserService but update it to allow passing OrgID explicitly
    // or just hack it here for the bootstrap. 
    // Let's do a direct insert here for safety during bootstrap.
    const bcrypt = await import('bcryptjs'); // Dynamic import to avoid top-level issues if any
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminData.password, salt);
    const userId = crypto.randomUUID();

    await db.insertInto('users')
      .values({
        id: userId,
        organization_id: orgId,
        full_name: adminData.full_name,
        username: adminData.username,
        role: 'owner', // Highest level
        password_hash: hash,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: 0,
        is_deleted: 0
      })
      .execute();

    return true;
  },
    update: async (id: string, data: { name?: string; phone?: string; address?: string; email?: string; logo_url?: string; terms?: string }) => {
    return await db.updateTable('organizations')
      .set(data)
      .where('id', '=', id)
      .execute();
  }
};