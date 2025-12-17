import { copyFile, BaseDirectory, mkdir, exists } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';

export const ImageManager = {
  // Setup folder
  init: async () => {
    const dirExists = await exists('repair_images', { baseDir: BaseDirectory.AppData });
    if (!dirExists) await mkdir('repair_images', { baseDir: BaseDirectory.AppData });
  },

  // Save specific file
  save: async (originalPath: string): Promise<string> => {
    // Generate new name: timestamp_random.jpg
    const ext = originalPath.split('.').pop();
    const newName = `${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
    
    // Copy from user's selection to our AppData folder
    await copyFile(originalPath, `repair_images/${newName}`, {
      toPathBaseDir: BaseDirectory.AppData 
    });
    
    return newName; // Save this string to DB
  },

  // Get viewable URL
  getUrl: async (filename: string) => {
    const appData = await appDataDir();
    const filePath = await join(appData, 'repair_images', filename);
    return convertFileSrc(filePath);
  }
};