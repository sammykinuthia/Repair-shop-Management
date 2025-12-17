// src/lib/db.ts
import { Generated, Kysely } from 'kysely';
import { TauriSqliteDialect } from 'kysely-dialect-tauri';
import Database from '@tauri-apps/plugin-sql';

// --- TYPES (Same as before) ---
export interface ClientTable {
    id: Generated<number>;
    full_name: string;
    phone: string;
    email: string | null;
    location: string | null;
    created_at: string;
}

export interface UserTable {
    id: Generated<number>;
    username: string;
    full_name: string;
    password_hash: string;
    role: 'admin' | 'staff';
    is_active: number;
    created_at: string;
}

export interface RepairTable {
    id: Generated<number>;
    client_id: number;
    assigned_to: number | null;
    ticket_no: string;
    device_type: string;
    brand: string;
    model: string;
    serial_no: string;
    accessories: string;
    issue_description: string;
    diagnosis: string | null;
    status: 'Received' | 'Diagnosing' | 'PendingApproval' | 'WaitingParts' | 'Fixed' | 'Collected' | 'Unrepairable';
    bin_location: string | null;
    image_paths: string;
    internal_cost: number;
    labor_cost: number;
    final_price: number;
    amount_paid: number;
    payment_method: 'Cash' | 'Mpesa' | 'Card' | null;
    mpesa_code: string | null;
    is_paid: number;
    created_at: string;
    date_fixed: string | null;
    date_out: string | null;
}

export interface AuditLogTable {
    id: Generated<number>;
    user_id: number;
    action: string;
    entity: string;
    entity_id: string | null;
    details: string;
    timestamp: string;
}

interface DB {
    clients: ClientTable;
    repairs: RepairTable;
    users: UserTable;
    audit_logs: AuditLogTable;
    settings: SettingTable;
}
export interface SettingTable {
  key: string;   // Primary Key (e.g., 'shop_name')
  value: string;
}

// --- CONFIGURATION ---

export const db = new Kysely<DB>({
  dialect: new TauriSqliteDialect({
    // ✅ CORRECT USAGE based on socket.dev docs
    // The library passes the 'sqlite:' prefix automatically
    database: async (prefix) => {
      // connecting to 'sqlite:repair_stock_management.db'
      // Tauri v2 automatically places this in your AppData folder
      return await Database.load(`${prefix}repair_stock_management.db`);
    },
  }),
});

// --- MIGRATIONS ---

export async function initTables() {
    console.log("Initializing Database...");
    
    
    // 1. Clients
    await db.schema.createTable('clients').ifNotExists()
        .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement())
        .addColumn('full_name', 'text', (cb) => cb.notNull())
        .addColumn('phone', 'text', (cb) => cb.unique().notNull())
        .addColumn('email', 'text')
        .addColumn('location', 'text')
        .addColumn('created_at', 'text', (cb) => cb.notNull())
        .execute();

    // 2. Users
    await db.schema.createTable('users').ifNotExists()
        .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement())
        .addColumn('username', 'text', (cb) => cb.unique().notNull())
        .addColumn('full_name', 'text', (cb) => cb.notNull())
        .addColumn('password_hash', 'text', (cb) => cb.notNull())
        .addColumn('role', 'text', (cb) => cb.notNull())
        .addColumn('is_active', 'integer', (cb) => cb.notNull().defaultTo(1))
        .addColumn('created_at', 'text', (cb) => cb.notNull())
        .execute();

    // 3. Repairs
    await db.schema.createTable('repairs').ifNotExists()
        .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement())
        .addColumn('client_id', 'integer', (cb) => cb.notNull())
        .addColumn('assigned_to', 'integer')
        .addColumn('ticket_no', 'text', (cb) => cb.notNull())
        .addColumn('device_type', 'text', (cb) => cb.notNull())
        .addColumn('brand', 'text', (cb) => cb.notNull())
        .addColumn('model', 'text', (cb) => cb.notNull())
        .addColumn('serial_no', 'text', (cb) => cb.notNull())
        .addColumn('accessories', 'text')
        .addColumn('issue_description', 'text', (cb) => cb.notNull())
        .addColumn('diagnosis', 'text')
        .addColumn('status', 'text', (cb) => cb.notNull())
        .addColumn('bin_location', 'text')
        .addColumn('image_paths', 'text', (cb) => cb.notNull().defaultTo('[]'))
        .addColumn('internal_cost', 'real', (cb) => cb.defaultTo(0))
        .addColumn('labor_cost', 'real', (cb) => cb.defaultTo(0))
        .addColumn('final_price', 'real', (cb) => cb.defaultTo(0))
        .addColumn('amount_paid', 'real', (cb) => cb.defaultTo(0))
        .addColumn('payment_method', 'text')
        .addColumn('mpesa_code', 'text')
        .addColumn('is_paid', 'integer', (cb) => cb.notNull().defaultTo(0))
        .addColumn('created_at', 'text', (cb) => cb.notNull())
        .addColumn('date_fixed', 'text')
        .addColumn('date_out', 'text')
        .execute();

    // 4. Audit Logs
    await db.schema.createTable('audit_logs').ifNotExists()
        .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement())
        .addColumn('user_id', 'integer', (cb) => cb.notNull())
        .addColumn('action', 'text', (cb) => cb.notNull())
        .addColumn('entity', 'text', (cb) => cb.notNull())
        .addColumn('entity_id', 'text')
        .addColumn('details', 'text', (cb) => cb.notNull())
        .addColumn('timestamp', 'text', (cb) => cb.notNull())
        .execute();

    // 5. Settings Table (New)
    await db.schema.createTable('settings').ifNotExists()
        .addColumn('key', 'text', (cb) => cb.primaryKey())
        .addColumn('value', 'text')
        .execute();
        
    console.log("Database Initialized Successfully.");
}