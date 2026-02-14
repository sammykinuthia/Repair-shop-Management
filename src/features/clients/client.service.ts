import { db } from '../../lib/db';
import { OrganizationService } from '../organization/org.service';
import { AuditService } from '../audit/audit.service'; // 👈 Import Audit Service

export const ClientService = {
  // 1. Get All (Scoped to Org)
  getAll: async () => {
    return await db.selectFrom('clients')
      .selectAll()
      .where('is_deleted', '=', 0)
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute();
  },

  // 2. Create (With UUID & Audit)
  create: async (data: { full_name: string; phone: string; email?: string; location?: string }) => {
    const org = await OrganizationService.getCurrent();
    if (!org) throw new Error("No Organization configured");

    // Check duplicate phone
    const existing = await db.selectFrom('clients')
      .select('id')
      .where('phone', '=', data.phone)
      .where('is_deleted', '=', 0)
      .executeTakeFirst();
      
    if (existing) throw new Error('Client with this phone already exists');

    const newId = crypto.randomUUID();

    await db.insertInto('clients')
      .values({ 
        id: newId,
        organization_id: org.id,
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || null,
        location: data.location || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: 0,
        is_deleted: 0
      })
      .execute();

    // 👇 AUDIT LOG
    await AuditService.log(
      'CREATE_CLIENT', 
      'Client', 
      newId, 
      `Created new client: ${data.full_name} (${data.phone})`
    );
      
    return { id: newId };
  },

  // 3. Search
  search: async (query: string) => {
    return await db.selectFrom('clients')
      .selectAll()
      .where('is_deleted', '=', 0)
      .where((eb) => eb.or([
        eb('phone', 'like', `%${query}%`),
        eb('full_name', 'like', `%${query}%`)
      ]))
      .limit(10)
      .execute();
  },

  // 4. Update (With Audit)
  update: async (id: string, data: any) => {
    // Fetch current name for better logging if name isn't changing
    const current = await db.selectFrom('clients')
      .select('full_name')
      .where('id', '=', id)
      .executeTakeFirst();
      
    const clientLabel = data.full_name || current?.full_name || 'Unknown Client';

    await db.updateTable('clients')
      .set({ 
        ...data, 
        updated_at: new Date().toISOString(),
        is_synced: 0 
      })
      .where('id', '=', id)
      .execute();

    // 👇 AUDIT LOG
    await AuditService.log(
      'UPDATE_CLIENT', 
      'Client', 
      id, 
      `Updated details for client: ${clientLabel}`
    );
  },

  // 5. Soft Delete (With Audit)
  delete: async (id: string) => {
    // Fetch name first for the log
    const client = await db.selectFrom('clients')
      .select('full_name')
      .where('id', '=', id)
      .executeTakeFirst();

    const clientName = client?.full_name || 'Unknown';

    await db.updateTable('clients')
      .set({ 
        is_deleted: 1, 
        updated_at: new Date().toISOString(),
        is_synced: 0 
      })
      .where('id', '=', id)
      .execute();

    // 👇 AUDIT LOG
    await AuditService.log(
      'DELETE_CLIENT', 
      'Client', 
      id, 
      `Deleted client: ${clientName}`
    );
  },

  // 6. Get History
  getHistory: async (clientId: string) => {
    return await db.selectFrom('repairs')
      .selectAll()
      .where('client_id', '=', clientId)
      .where('is_deleted', '=', 0)
      .orderBy('created_at', 'desc')
      .execute();
  },

  getByPhone: async (phone: string) => {
    return await db.selectFrom('clients')
      .selectAll()
      .where('phone', '=', phone)
      .where('is_deleted', '=', 0)
      .executeTakeFirst();
  },

  getById: async (id: string) => {
    return await db.selectFrom('clients')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
};