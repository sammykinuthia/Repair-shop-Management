// src/lib/utils.ts
import { open } from '@tauri-apps/plugin-shell';


export function openWhatsApp(phone: string, message: string) {
    // 1. Clean number: Remove spaces, dashes, leadings plus
    let cleanPhone = phone.replace(/[^0-9]/g, '');

    // 2. Format to International 254 (Handle 07xx and 01xx)
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '254' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('254')) {
        // Already good
    }

    // 3. Open URL
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Tauri open command
    open(url);
}