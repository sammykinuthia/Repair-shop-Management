import { db } from '../../lib/db';
import { AuditService } from '../audit/audit.service';
import { OrganizationService } from '../organization/org.service';

export const RepairService = {
  // 1. Create
  create: async (data: any) => {
    const org = await OrganizationService.getCurrent();
    if (!org) throw new Error("No Organization configured");

    const newId = crypto.randomUUID();

    // Generate Ticket No (Simple logic for now, can be enhanced)
    const ticketNo = `T-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    await db.insertInto('repairs')
      .values({
        id: newId,
        organization_id: org.id,
        client_id: data.client_id, // This comes as a UUID string now
        ticket_no: ticketNo,

        device_type: data.device_type,
        brand: data.brand,
        model: data.model,
        serial_no: data.serial_no,
        accessories: data.accessories || '',
        issue_description: data.issue_description,
        status: 'Received',

        image_paths: JSON.stringify(data.image_paths || []),

        internal_cost: 0,
        labor_cost: 0,
        final_price: 0,
        amount_paid: data.deposit || 0,
        is_paid: 0,

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: 0,
        is_deleted: 0
      })
      .execute();
    await AuditService.log('CREATE', 'Repair', newId, `Created Ticket ${ticketNo} (${data.device_type})`);
    return { insertId: newId };
  },

  // 2. Get Active
  getAllActive: async () => {
    return await db.selectFrom('repairs')
      .innerJoin('clients', 'repairs.client_id', 'clients.id')
      .select([
        'repairs.id',
        'repairs.ticket_no',
        'repairs.device_type',
        'repairs.brand',
        'repairs.model',
        'repairs.status',
        'repairs.created_at',
        'clients.full_name as client_name',
        'clients.phone as client_phone'
      ])
      .where('repairs.status', '!=', 'Collected')
      .where('repairs.is_deleted', '=', 0)
      .orderBy('repairs.created_at', 'desc')
      .execute();
  },

  // 3. Get By ID (String)
  getById: async (id: string) => {
    return await db.selectFrom('repairs')
      .innerJoin('clients', 'repairs.client_id', 'clients.id')
      .selectAll('repairs')
      .select([
        'clients.full_name as client_name',
        'clients.phone as client_phone',
        'clients.location as client_location'
      ])
      .where('repairs.id', '=', id)
      .executeTakeFirst();
  },

  // 4. Update
  update: async (id: string, data: any) => {

    // 1. Fetch current details first to get the Ticket No
    const currentItem = await db.selectFrom('repairs')
      .select(['ticket_no', 'status'])
      .where('id', '=', id)
      .executeTakeFirst();

    const ticketLabel = currentItem?.ticket_no || 'Unknown Ticket';

    // 2. Prepare Update Data
    let updateData: any = {
      ...data,
      updated_at: new Date().toISOString(),
      is_synced: 0
    };

    // Auto-set timestamps
    if (data.status === 'Fixed' && !data.date_fixed) {
      updateData.date_fixed = new Date().toISOString();
    }
    if (data.status === 'Collected' && !data.date_out) {
      updateData.date_out = new Date().toISOString();
    }

    // 3. Perform Update
    const result = await db.updateTable('repairs')
      .set(updateData)
      .where('id', '=', id)
      .execute();

    // 4. Construct Specific Log Message
    let logMessage = `Updated ${ticketLabel}`;

    if (data.status && data.status !== currentItem?.status) {
      logMessage += `: Status changed to ${data.status}`;
    } else if (data.final_price || data.internal_cost) {
      logMessage += `: Updated Financials`;
    } else if (data.diagnosis) {
      logMessage += `: Updated Diagnosis`;
    } else {
      logMessage += `: General details updated`;
    }

    // 5. Log to Audit Table
    await AuditService.log('UPDATE', 'Repair', id, logMessage);

    return result;
  },

  // 5. Search
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
        eb('clients.phone', 'like', `%${query}%`)
      ]))
      .orderBy('repairs.created_at', 'desc')
      .limit(50)
      .execute();
  },
  // 6. Get Overstayed Items (Fixed > 30 Days ago)
  getOverstayed: async () => {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString();

    return await db.selectFrom('repairs')
      .innerJoin('clients', 'repairs.client_id', 'clients.id')
      .select([
        'repairs.id',
        'repairs.ticket_no',
        'repairs.device_type',
        'repairs.final_price',
        'repairs.date_fixed',
        'clients.full_name as client_name',
        'clients.phone as client_phone'
      ])
      // Criteria: Status is Fixed AND date_fixed is older than 30 days
      .where('repairs.status', '=', 'Fixed')
      .where('repairs.date_fixed', '<', dateLimit)
      .where('repairs.is_deleted', '=', 0)
      .execute();
  },

  // 7. Get Revenue Stats (Admin)
  getRevenueStats: async (monthStr: string) => {
    // monthStr format: "2025-01"
    const results = await db.selectFrom('repairs')
      .select(['final_price', 'internal_cost', 'labor_cost', 'amount_paid', 'status'])
      .where('created_at', 'like', `${monthStr}%`)
      .where('is_deleted', '=', 0)
      .execute();

    let totalRevenue = 0;
    let totalProfit = 0;
    let outstandingDebt = 0;

    results.forEach(r => {
      // Revenue is what we billed
      totalRevenue += r.final_price || 0;

      // Profit = Final - (Parts + Labor)
      // Note: Labor is cost to shop if paying tech, or just income if owner. 
      // Usually Profit = Final - Internal_Cost (Parts).
      totalProfit += ((r.final_price || 0) - (r.internal_cost || 0));

      // Debt = Final - Paid (Only for items that are supposed to be paid)
      if (r.final_price > r.amount_paid) {
        outstandingDebt += (r.final_price - r.amount_paid);
      }
    });

    return { totalRevenue, totalProfit, outstandingDebt };
  }
};