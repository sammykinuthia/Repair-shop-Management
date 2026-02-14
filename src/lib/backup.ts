import { copyFile, BaseDirectory, exists, mkdir, readDir, remove } from '@tauri-apps/plugin-fs'; // Removed metadata
import { db , DBNAME} from './db';


export const AutoBackupService = {
  
  getDestination: async () => {
    try {
      const setting = await db.selectFrom('settings')
        .select('value')
        .where('key', '=', 'backup_path')
        .executeTakeFirst();
      
      if (setting && setting.value) {
        return { path: setting.value, isCustom: true };
      }
    } catch (e) {
      console.warn("Could not read backup settings, using default.");
    }
    return { path: 'backups', isCustom: false };
  },

  performAutoBackup: async () => {
    try {
      console.log("Starting Auto-Backup...");

      // 1. Locate Source DB
      let sourceDir = BaseDirectory.AppData;
      let found = false;
      try {
        if (await exists(DBNAME, { baseDir: BaseDirectory.AppData })) {
          found = true;
          sourceDir = BaseDirectory.AppData;
        } else if (await exists(DBNAME, { baseDir: BaseDirectory.AppConfig })) {
          found = true;
          sourceDir = BaseDirectory.AppConfig;
        }
      } catch (e) {}

      if (!found) return false;

      // 2. Determine Destination
      const destInfo = await AutoBackupService.getDestination();
      
      // Ensure default folder exists
      if (!destInfo.isCustom) {
        if (!(await exists('backups', { baseDir: BaseDirectory.AppData }))) {
          await mkdir('backups', { baseDir: BaseDirectory.AppData });
        }
      }

      // 3. Generate Timestamped Filename
      // Format: auto_backup_2025-01-04_10-30-55.db
      const now = new Date();
      const dateStr = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
      const filename = `auto_backup_${dateStr}.db`;

      // 4. Copy File
      if (destInfo.isCustom) {
        // Handle custom path slashes
        const fullPath = `${destInfo.path}/${filename}`.replace(/\\/g, '/');
        await copyFile(DBNAME, fullPath, { fromPathBaseDir: sourceDir });
      } else {
        await copyFile(DBNAME, `backups/${filename}`, { 
          fromPathBaseDir: sourceDir,
          toPathBaseDir: BaseDirectory.AppData 
        });
      }

      console.log(`Backup saved: ${filename}`);
      
      // 5. Cleanup Old Backups
      await AutoBackupService.cleanupOldBackups(destInfo);

      return true;

    } catch (e) {
      console.error("Auto-Backup Failed:", e);
      return false;
    }
  },

  cleanupOldBackups: async (destInfo: { path: string, isCustom: boolean }) => {
    try {
      let files = [];

      // 1. Read Directory
      if (destInfo.isCustom) {
        files = await readDir(destInfo.path);
      } else {
        files = await readDir('backups', { baseDir: BaseDirectory.AppData });
      }

      // 2. Map Files to Dates using Filename Regex
      // Matches: auto_backup_YYYY-MM-DD_HH-MM-SS.db
      const backupRegex = /auto_backup_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.db/;
      
      const dbFiles = [];
      
      for (const file of files) {
        const match = file.name.match(backupRegex);
        if (match) {
          // Convert "2025-01-04_10-30-55" back to valid Date string "2025-01-04T10:30:55"
          // (We replace the first underscore with T and dashes in time with colons)
          const datePart = match[1]; // "2025-01-04_10-30-55"
          const [dayStr, timeStr] = datePart.split('_');
          const properTime = timeStr.replace(/-/g, ':');
          const isoString = `${dayStr}T${properTime}`;
          
          const fileDate = new Date(isoString);
          
          // Construct path for deletion
          const filePath = destInfo.isCustom 
            ? `${destInfo.path}/${file.name}`.replace(/\\/g, '/')
            : `backups/${file.name}`;

          if (!isNaN(fileDate.getTime())) {
            dbFiles.push({
              name: file.name,
              path: filePath,
              time: fileDate
            });
          }
        }
      }

      // 3. Sort Descending (Newest First)
      dbFiles.sort((a, b) => b.time.getTime() - a.time.getTime());

      // 4. Retention Logic
      // - Keep last 3 always (Safe Zone)
      // - Delete if older than 7 days
      
      const safeCount = 3;
      const dayLimit = 7;
      const msLimit = dayLimit * 24 * 60 * 60 * 1000;
      const now = Date.now();

      // Skip the newest 3 files
      const candidates = dbFiles.slice(safeCount);

      for (const file of candidates) {
        const fileAge = now - file.time.getTime();
        
        // If older than 7 days, delete it
        if (fileAge > msLimit) {
          console.log(`Deleting expired backup: ${file.name}`);
          
          const options = destInfo.isCustom ? undefined : { baseDir: BaseDirectory.AppData };
          await remove(file.path, options);
        }
      }

    } catch (e) {
      console.warn("Cleanup warning:", e);
    }
  }
};