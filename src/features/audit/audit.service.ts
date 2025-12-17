import { db } from '../../lib/db';

export const AuditService = {
  log: async (userId: number, action: string, entity: string, entityId: string | number | null, details: string) => {
    try {
      await db.insertInto('audit_logs')
        .values({
          user_id: userId,
          action,
          entity,
          entity_id: entityId ? entityId.toString() : null,
          details,
          timestamp: new Date().toISOString()
        })
        .execute();
    } catch (error) {
      console.error("Failed to write audit log:", error);
      // We don't throw here to avoid stopping the main app flow
    }
  },

  // For Admin Dashboard: Get recent activity
  getRecent: async (limit = 50) => {
    return await db.selectFrom('audit_logs')
      .innerJoin('users', 'audit_logs.user_id', 'users.id')
      .selectAll("audit_logs")
      .select(['users.username'])
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .execute();
  }
};