
import { db } from '../../lib/db';

// Helper to get current user without breaking function signatures
function getSessionUser() {
  try {
    const stored = sessionStorage.getItem('repair_shop_user');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
}

export const AuditService = {
  // 1. Log an action
  log: async (action: string, entity: string, entityId: string | null, details: string) => {
    try {
      const user = getSessionUser();
      // If no user logged in (e.g. system action) or setup phase, skip or handle gracefully
      if (!user || !user.id) return; 

      // We need the org_id. If it's not in the session user object, fetch it or use a default
      // In the new auth flow, user object has organization_id.
      // If not, fetch it from DB.
      let orgId = user.organization_id;
      
      if (!orgId) {
         const dbUser = await db.selectFrom('users').select('organization_id').where('id', '=', user.id).executeTakeFirst();
         orgId = dbUser?.organization_id;
      }

      if (!orgId) return; // Cannot log without Org ID

      await db.insertInto('audit_logs')
        .values({
          id: crypto.randomUUID(),
          organization_id: orgId,
          user_id: user.id,
          action,
          entity,
          entity_id: entityId,
          details,
          timestamp: new Date().toISOString(),
          is_synced: 0
        })
        .execute();
    } catch (e) {
      console.error("Audit log failed", e);
    }
  },

  // 2. Get Logs (Updated to LEFT JOIN)
  getAll: async (limit = 100, search = '') => {
    let query = db.selectFrom('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id') // Changed to LEFT JOIN
      .select([
        'audit_logs.id',
        'audit_logs.action',
        'audit_logs.entity',
        'audit_logs.details',
        'audit_logs.timestamp',
        'users.username',
        'users.full_name'
      ])
      .orderBy('audit_logs.timestamp', 'desc')
      .limit(limit);

    if (search) {
      query = query.where((eb) => eb.or([
        eb('users.full_name', 'like', `%${search}%`),
        eb('audit_logs.action', 'like', `%${search}%`),
        eb('audit_logs.details', 'like', `%${search}%`)
      ]));
    }

    return await query.execute();
  }
};