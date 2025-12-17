import { db } from '../../lib/db';

export const ClientService = {
  // 1. Search (Supports partial matching)
  search: async (query: string) => {
    return await db.selectFrom('clients')
      .selectAll()
      .where((eb) => eb.or([
        eb('phone', 'like', `%${query}%`),
        eb('full_name', 'like', `%${query}%`)
      ]))
      .limit(10)
      .execute();
  },

  // 2. Create new client
  create: async (data: { full_name: string; phone: string; email?: string; location?: string }) => {
    // Check duplicate phone first
    const existing = await db.selectFrom('clients')
      .select('id')
      .where('phone', '=', data.phone)
      .executeTakeFirst();
      
    if (existing) {
        throw new Error('Client with this phone already exists');
    }

    return await db.insertInto('clients')
      .values({ 
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || null,
        location: data.location || null,
        created_at: new Date().toISOString() 
      })
      .executeTakeFirst();
  },

  // 3. Update Client
  update: async (id: number, data: { full_name?: string; phone?: string; email?: string; location?: string }) => {
    return await db.updateTable('clients')
      .set(data)
      .where('id', '=', id)
      .execute();
  },

  // 4. Delete Client
  delete: async (id: number) => {
    return await db.deleteFrom('clients')
      .where('id', '=', id)
      .execute();
  },

  // 5. Get History
  getHistory: async (clientId: number) => {
    return await db.selectFrom('repairs')
      .selectAll()
      .where('client_id', '=', clientId)
      .orderBy('created_at', 'desc')
      .execute();
  },

  // 6. Get Single Client by Phone
  getByPhone: async (phone: string) => {
    return await db.selectFrom('clients')
      .selectAll()
      .where('phone', '=', phone)
      .executeTakeFirst();
  },

  // 7. Get All Clients
  getAll: async () => {
    return await db.selectFrom('clients')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute();
  },

  // 8. Get Single Client by ID
  getById: async (id: number) => {
    return await db.selectFrom('clients')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
};