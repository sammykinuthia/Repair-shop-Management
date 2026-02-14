// src/lib/db.ts
import { Kysely } from 'kysely';
import { TauriSqliteDialect } from 'kysely-dialect-tauri';
import Database from '@tauri-apps/plugin-sql';


// --- TYPES ---

// 1. BASE SYNC COLUMNS (Standard for all syncable tables)
interface Syncable {
    id: string;             // UUID (changed from number)
    organization_id: string; // Links to the SaaS Shop
    updated_at: string;     // ISO Timestamp for sync
    is_synced: number;      // 0 = Needs Sync, 1 = Synced
    is_deleted: number;     // 0 = Active, 1 = Soft Deleted
}

// 2. THE MISSING PIECE: Organization Table
// Stores the details of the shop running this app
export interface OrganizationTable {
    id: string;             // UUID (The Global ID from Supabase)
    name: string;           // "Mugo Shop"
    phone: string | null;
    email: string | null;
    address: string | null;
    terms: string | null;   // 👈 Added Terms field
    subscription_plan: 'free' | 'pro' | 'enterprise';
    logo_url: string | null;
    created_at: string;
    is_synced: number;      // Even the org details need syncing
}

export interface ClientTable extends Syncable {
    full_name: string;
    phone: string;
    email: string | null;
    location: string | null;
    created_at: string;
}

export interface UserTable extends Syncable {
    username: string;
    full_name: string;
    password_hash: string;
    role: 'owner' | 'admin' | 'staff';
    is_active: number;
    created_at: string;
    reset_token: string | null;
    reset_expires: string | null; // ISO Date String
}

export interface RepairTable extends Syncable {
    client_id: string;      // FK to Client UUID
    assigned_to: string | null; // FK to User UUID

    ticket_no: string;      // Human readable (T-101)

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

    // Financials
    internal_cost: number;
    labor_cost: number;
    final_price: number;
    amount_paid: number;
    payment_method: 'Cash' | 'Mpesa' | 'Card' | null;
    mpesa_code: string | null;
    is_paid: number;

    // Dates
    created_at: string;
    date_fixed: string | null;
    date_out: string | null;
}

export interface AuditLogTable {
    id: string; // UUID
    organization_id: string;
    user_id: string;
    action: string;
    entity: string;
    entity_id: string | null;
    details: string;
    timestamp: string;
    is_synced: number;
}

// Key-Value settings (Local specific prefs like 'printer_name')
export interface SettingTable {
    key: string;
    value: string;
}

interface DB {
    organizations: OrganizationTable; // <--- Added here
    clients: ClientTable;
    repairs: RepairTable;
    users: UserTable;
    audit_logs: AuditLogTable;
    settings: SettingTable;
}

// --- CONFIGURATION ---
export const DBNAME = 'repair_shop_v2_3.db';
export const db = new Kysely<DB>({
    dialect: new TauriSqliteDialect({
        database: async (prefix) => {
            return await Database.load(`${prefix}${DBNAME}`);
        },
    }),
});

// --- MIGRATIONS ---

export async function initTables() {
    console.log("Initializing SaaS-Ready Database...");

    // 0. Organizations (The Root Table)
    await db.schema.createTable('organizations').ifNotExists()
        .addColumn('id', 'text', (cb) => cb.primaryKey()) // UUID
        .addColumn('name', 'text', (cb) => cb.notNull())
        .addColumn('phone', 'text')
        .addColumn('email', 'text')
        .addColumn('address', 'text')
        .addColumn('terms', 'text') // 👈 Added Terms column
        .addColumn('subscription_plan', 'text', (cb) => cb.defaultTo('free'))
        .addColumn('logo_url', 'text')
        .addColumn('created_at', 'text', (cb) => cb.notNull())
        .addColumn('is_synced', 'integer', (cb) => cb.defaultTo(0))
        .execute();

    // 1. Clients
    await db.schema.createTable('clients').ifNotExists()
        .addColumn('id', 'text', (cb) => cb.primaryKey())
        .addColumn('organization_id', 'text', (cb) => cb.notNull()) // Link to Org
        .addColumn('full_name', 'text', (cb) => cb.notNull())
        .addColumn('phone', 'text', (cb) => cb.notNull())
        .addColumn('email', 'text')
        .addColumn('location', 'text')
        // Sync Columns
        .addColumn('created_at', 'text', (cb) => cb.notNull())
        .addColumn('updated_at', 'text', (cb) => cb.notNull())
        .addColumn('is_synced', 'integer', (cb) => cb.defaultTo(0))
        .addColumn('is_deleted', 'integer', (cb) => cb.defaultTo(0))
        .execute();

    // 2. Users
    await db.schema.createTable('users').ifNotExists()
        .addColumn('id', 'text', (cb) => cb.primaryKey())
        .addColumn('organization_id', 'text', (cb) => cb.notNull()) // Link to Org
        .addColumn('username', 'text', (cb) => cb.notNull())
        .addColumn('full_name', 'text', (cb) => cb.notNull())
        .addColumn('password_hash', 'text', (cb) => cb.notNull())
        .addColumn('role', 'text', (cb) => cb.notNull())
        .addColumn('is_active', 'integer', (cb) => cb.notNull().defaultTo(1))
        .addColumn('reset_token', 'text')
        .addColumn('reset_expires', 'text')
        // Sync Columns
        .addColumn('created_at', 'text', (cb) => cb.notNull())
        .addColumn('updated_at', 'text', (cb) => cb.notNull())
        .addColumn('is_synced', 'integer', (cb) => cb.defaultTo(0))
        .addColumn('is_deleted', 'integer', (cb) => cb.defaultTo(0))
        .execute();

    // 3. Repairs
    await db.schema.createTable('repairs').ifNotExists()
        .addColumn('id', 'text', (cb) => cb.primaryKey())
        .addColumn('organization_id', 'text', (cb) => cb.notNull()) // Link to Org
        .addColumn('client_id', 'text', (cb) => cb.notNull())
        .addColumn('assigned_to', 'text')
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

        // Sync Columns
        .addColumn('created_at', 'text', (cb) => cb.notNull())
        .addColumn('updated_at', 'text', (cb) => cb.notNull())
        .addColumn('date_fixed', 'text')
        .addColumn('date_out', 'text')
        .addColumn('is_synced', 'integer', (cb) => cb.defaultTo(0))
        .addColumn('is_deleted', 'integer', (cb) => cb.defaultTo(0))
        .execute();

    // 4. Audit Logs
    await db.schema.createTable('audit_logs').ifNotExists()
        .addColumn('id', 'text', (cb) => cb.primaryKey())
        .addColumn('organization_id', 'text', (cb) => cb.notNull())
        .addColumn('user_id', 'text', (cb) => cb.notNull())
        .addColumn('action', 'text', (cb) => cb.notNull())
        .addColumn('entity', 'text', (cb) => cb.notNull())
        .addColumn('entity_id', 'text')
        .addColumn('details', 'text', (cb) => cb.notNull())
        .addColumn('timestamp', 'text', (cb) => cb.notNull())
        .addColumn('is_synced', 'integer', (cb) => cb.defaultTo(0))
        .execute();

    // 5. Local Settings
    await db.schema.createTable('settings').ifNotExists()
        .addColumn('key', 'text', (cb) => cb.primaryKey())
        .addColumn('value', 'text')
        .execute();

    console.log("Database initialized successfully.");

}