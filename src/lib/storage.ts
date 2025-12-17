import { copyFile, readFile, BaseDirectory, mkdir, exists } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

export const ImageManager = {
  // 1. Ensure folder exists
  init: async () => {
    try {
      const dirExists = await exists('repair_images', { baseDir: BaseDirectory.AppData });
      if (!dirExists) {
        await mkdir('repair_images', { baseDir: BaseDirectory.AppData });
      }
    } catch (e) {
      console.error("Storage Init Error:", e);
    }
  },

  // 2. Save file
  save: async (originalPath: string): Promise<string> => {
    await ImageManager.init();
    
    // Create unique filename
    const ext = originalPath.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const newFilename = `${timestamp}_img.${ext}`;

    // Copy to AppData
    await copyFile(originalPath, `repair_images/${newFilename}`, {
      toPathBaseDir: BaseDirectory.AppData,
    });

    return newFilename;
  },

  // 3. Get URL (THE FIX: Read file -> Blob URL)
  getUrl: async (filename: string): Promise<string> => {
    try {
      // Read the file as binary data from AppData folder
      const fileBytes = await readFile(`repair_images/${filename}`, {
        baseDir: BaseDirectory.AppData,
      });

      // Create a Blob from the bytes
      const blob = new Blob([fileBytes], { type: 'image/jpeg' });
      
      // Generate a localhost blob URL (e.g., blob:http://localhost:1420/...)
      const url = URL.createObjectURL(blob);
      
      return url;
    } catch (e) {
      console.error("Failed to load image blob:", e);
      return "";
    }
  }
};