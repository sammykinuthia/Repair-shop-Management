import { db } from '../../lib/db'; // Local Kysely
import { turso } from '../../lib/turso'; // Cloud Turso
import { OrganizationService } from '../organization/org.service';

export const SyncService = {

  // 1. PUSH (Local -> Turso)
  pushData: async () => {
    if (!navigator.onLine) return;

    const org = await OrganizationService.getCurrent();
    // Block sync for free plan logic (comment out for dev if needed)
    // if (org?.subscription_plan === 'free') return; 

    console.log("Starting Turso Push...");

    try {
      // We push tables in order of dependency
      await SyncService.pushTable('organizations', ['id', 'name', 'phone', 'email', 'address', 'logo_url', 'subscription_plan', 'created_at']);
      await SyncService.pushTable('users', ['id', 'organization_id', 'username', 'full_name', 'role', 'password_hash', 'is_active', 'created_at']);
      await SyncService.pushTable('clients', ['id', 'organization_id', 'full_name', 'phone', 'email', 'location', 'created_at', 'updated_at', 'is_deleted']);
      await SyncService.pushTable('repairs', ['id', 'organization_id', 'client_id', 'ticket_no', 'device_type', 'brand', 'model', 'serial_no', 'status', 'internal_cost', 'labor_cost', 'final_price', 'amount_paid', 'is_paid', 'created_at', 'updated_at', 'is_deleted']);
      await SyncService.pushTable('audit_logs', ['id', 'organization_id', 'user_id', 'action', 'entity', 'entity_id', 'details', 'timestamp']);

      console.log("Turso Push Complete.");
    } catch (e) {
      console.error("Turso Push Failed:", e);
    }
  },

  // Helper to push a specific table
  pushTable: async (tableName: string, columns: string[]) => {
    // 1. Get Unsynced Local Rows
    // @ts-ignore
    const rows = await db.selectFrom(tableName).selectAll().where('is_synced', '=', 0).limit(50).execute();
    if (rows.length === 0) return;

    console.log(`Pushing ${rows.length} rows to ${tableName}...`);

    // 2. Build SQL Transaction for Turso
    // We use "INSERT OR REPLACE" (Standard SQLite Upsert)
    const statements = rows.map((row: any) => {
      const colNames = columns.join(', ');

      // Create placeholders (?, ?, ?)
      // We map the values to ensure they match the column order
      const values = columns.map(col => row[col]);

      // Format args for Turso client (it expects ? for args)
      return {
        sql: `INSERT OR REPLACE INTO ${tableName} (${colNames}) VALUES (${columns.map(() => '?').join(', ')})`,
        args: values
      };
    });

    // 3. Execute Transaction on Cloud
    await turso.batch(statements, "write");

    // 4. Mark Local as Synced
    const ids = rows.map((r: any) => r.id);
    // @ts-ignore
    await db.updateTable(tableName).set({ is_synced: 1 }).where('id', 'in', ids).execute();
  },

  // 2. PULL (Turso -> Local)
  pullData: async () => {
    if (!navigator.onLine) return;
    const org = await OrganizationService.getCurrent();
    if (!org) return;

    // We fetch data updated recently. 
    // For simplicity in V1, let's just fetch EVERYTHING for this Org that isn't in local DB?
    // Or better: Fetch rows where updated_at > last_pull_time.
    // For this example, let's just pull Clients as a proof of concept.

    try {
      const rs = await turso.execute({
        sql: "SELECT * FROM clients WHERE organization_id = ?",
        args: [org.id]
      });

      for (const row of rs.rows) {
        // Insert into Local DB (Ignore if exists)
        await db.insertInto('clients')
          .values({
            id: row.id as string,
            organization_id: row.organization_id as string,
            full_name: row.full_name as string,
            phone: row.phone as string,
            email: row.email as string,
            location: row.location as string,
            created_at: row.created_at as string,
            updated_at: row.updated_at as string,
            is_synced: 1, // It came from cloud, so it's synced
            is_deleted: row.is_deleted as number
          })
          .onConflict((oc) => oc.column('id').doUpdateSet({
            // If it exists locally, update it from cloud version
            full_name: row.full_name as string,
            phone: row.phone as string,
            is_synced: 1
          }))
          .execute();
      }
    } catch (e) {
      console.error("Turso Pull Failed:", e);
    }
  }
};