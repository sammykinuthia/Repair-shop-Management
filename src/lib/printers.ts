import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export const PrinterService = {
  printSticker: async (repairId: string) => {
    // Generate a unique label so we can open multiple if needed, or focus existing
    const label = `sticker-${Date.now()}`;
    
    new WebviewWindow(label, {
      url: `/#/print/sticker/${repairId}`,
      title: 'Print Sticker',
      width: 320,
      height: 250,
      resizable: false,
      alwaysOnTop: true,
      focus: true,
    });
  },

  printTicket: async (repairId: string) => {
    const label = `print-ticket-${Date.now()}`;
    
    new WebviewWindow(label, {
      url: `/#/print/ticket/${repairId}`,
      title: 'Print Ticket',
      width: 380, // Standard Receipt Width
      height: 600,
      resizable: false,
      alwaysOnTop: true,
      focus: true,
    });
  }
};