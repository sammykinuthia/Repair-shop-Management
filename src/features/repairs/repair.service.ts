import { db } from '../../lib/db';
import { AuditService } from '../audit/audit.service';

export const RepairService = {

  // 1. Dashboard: Get Active Repairs
  getAllActive: async () => {
    return await db.selectFrom('repairs')
      .innerJoin('clients', 'repairs.client_id', 'clients.id')
      .leftJoin('users', 'repairs.assigned_to', 'users.id') // Join staff
      .selectAll("repairs")
      .select([
        'clients.full_name as client_name',
        'clients.phone as client_phone',
        'users.full_name as assigned_to_name'
      ])
      .where('status', '!=', 'Collected')
      .orderBy('created_at', 'desc')
      .execute();
  },

  // 2. Logic: Create new repair
  create: async (data: any) => {
    // Generate a Ticket Number (e.g., Random 6 chars or Sequential)
    // Simple approach: Date + Random 
    const ticketNo = `T-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    return await db.insertInto('repairs')
      .values({
        client_id: data.client_id,
        ticket_no: ticketNo,
        device_type: data.device_type,
        brand: data.brand,
        model: data.model,
        serial_no: data.serial_no,
        accessories: data.accessories || '',
        issue_description: data.issue_description,
        status: 'Received',
        
        // Handle Images: Array -> String
        image_paths: JSON.stringify(data.image_paths || []),
        
        // Defaults
        internal_cost: 0,
        labor_cost: 0,
        final_price: 0,
        amount_paid: data.deposit || 0, // Initial deposit
        is_paid: 0,
        created_at: new Date().toISOString()
      })
      .execute();
  },


  // 3. Logic: Update Status & Finances
  updateDetails: async (currentUserId: number, repairId: number, changes: any) => {
    // If status changes to fixed, set date
    if (changes.status === 'Fixed') {
      changes.date_fixed = new Date().toISOString();
    }
    // If collected, set date out
    if (changes.status === 'Collected') {
      changes.date_out = new Date().toISOString();
    }

    const result = await db.updateTable('repairs')
      .set(changes)
      .where('id', '=', repairId)
      .execute();

    await AuditService.log(
      currentUserId,
      'UPDATE',
      'Repairs',
      repairId,
      `Updated status to ${changes.status || 'unknown'}`
    );

    return result;
  },

  // 4. Logic: Find Overstayed Items (30+ days since fixed)
  getOverstayed: async () => {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);

    return await db.selectFrom('repairs')
      .innerJoin('clients', 'repairs.client_id', 'clients.id')
      .select(['repairs.ticket_no', 'repairs.final_price', 'clients.full_name', 'clients.phone', 'repairs.date_fixed'])
      .where('status', '=', 'Fixed')
      .where('date_fixed', '<', dateLimit.toISOString())
      .execute();
  },

  // 5. Logic: Financial Summary (For Admin)
  getRevenueStats: async (monthStr: string) => {
    // monthStr format: "2023-10"
    const results = await db.selectFrom('repairs')
      .select(['final_price', 'internal_cost', 'amount_paid', 'status'])
      .where('created_at', 'like', `${monthStr}%`)
      .execute();

    let totalRevenue = 0;
    let totalProfit = 0;
    let outstandingDebt = 0;

    results.forEach(r => {
      totalRevenue += r.final_price;
      totalProfit += (r.final_price - r.internal_cost);
      if (r.status === 'Collected' && r.amount_paid < r.final_price) {
        outstandingDebt += (r.final_price - r.amount_paid);
      }
    });

    return { totalRevenue, totalProfit, outstandingDebt };
  },
   getById: async (id: number) => {
    return await db.selectFrom('repairs')
      .innerJoin('clients', 'repairs.client_id', 'clients.id')
      .selectAll('repairs') // Get all repair fields
      .select([
        'clients.full_name as client_name', 
        'clients.phone as client_phone',
        'clients.location as client_location'
      ])
      .where('repairs.id', '=', id)
      .executeTakeFirst();
  },
   search: async (query: string) => {
    return await db.selectFrom('repairs')
      .innerJoin('clients', 'repairs.client_id', 'clients.id')
      .select([
        'repairs.id', 'repairs.ticket_no', 'repairs.device_type', 
        'repairs.brand', 'repairs.model', 'repairs.status', 'repairs.created_at',
        'clients.full_name as client_name'
      ])
      .where((eb) => eb.or([
        eb('repairs.ticket_no', 'like', `%${query}%`),
        eb('repairs.serial_no', 'like', `%${query}%`),
        eb('clients.full_name', 'like', `%${query}%`),
        eb('clients.phone', 'like', `%${query}%`) // Search by phone too
      ]))
      .orderBy('repairs.created_at', 'desc')
      .limit(50)
      .execute();
  },
update: async (id: number, data: any) => {
    let updateData: any = { ...data };

    // Auto-set timestamps
    if (data.status === 'Fixed' && !data.date_fixed) {
      updateData.date_fixed = new Date().toISOString();
    }
    if (data.status === 'Collected' && !data.date_out) {
      updateData.date_out = new Date().toISOString();
    }
    
    // Auto-calc paid status
    if (data.status === 'Collected') {
       // If amount paid is close to final price
       updateData.is_paid = 1; 
    }

    return await db.updateTable('repairs')
      .set(updateData)
      .where('id', '=', id)
      .execute();
  }
};