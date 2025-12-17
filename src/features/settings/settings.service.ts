import { db } from '../../lib/db';

export const SettingsService = {
  // Get all settings as a simple object { shop_name: "...", shop_phone: "..." }
  getSettings: async () => {
    const rows = await db.selectFrom('settings').selectAll().execute();
    
    // Convert array to object
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    // Return with defaults
    return {
      shop_name: settings['shop_name'] || 'Repair Shop',
      shop_address: settings['shop_address'] || 'Nairobi, Kenya',
      shop_phone: settings['shop_phone'] || '0700 000 000',
      terms: settings['terms'] || 'Items not collected in 60 days are disposed.'
    };
  },

  saveSettings: async (data: { shop_name: string; shop_address: string; shop_phone: string; terms: string }) => {
    // Upsert (Insert or Replace)
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      await db.replaceInto('settings')
        .values({ key, value })
        .execute();
    }
  }
};