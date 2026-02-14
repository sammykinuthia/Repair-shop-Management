import { fetch } from '@tauri-apps/plugin-http'; // Use Tauri's native HTTP fetch to avoid CORS issues
import { error } from '@tauri-apps/plugin-log';

const API_URL = import.meta.env.VITE_ROYOLTECH_API_URL || "";
const API_KEY = import.meta.env.VITE_ROYOLTECH_API_KEY || ""; 

export const MailService = {
  sendResetEmail: async (to: string, name: string, code: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          to: to,
          subject: "Password Reset Request - Repair Manager",
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Password Reset Request</h2>
              <p>Hello ${name},</p>
              <p>We received a request to reset the password for your Repair Manager Owner account.</p>
              <p>Use the code below to reset your password. This code expires in 15 minutes.</p>
              <h1 style="background: #eee; padding: 10px; display: inline-block; letter-spacing: 5px;">${code}</h1>
              <p>If you did not request this, please ignore this email.</p>
            </div>
          `
        })
      });

      if (!response.ok) {
        throw new Error(`Email API Error: ${response.statusText}`);
      }
      
      return true;
    } catch (e) {
      console.error("Failed to send email:", e);
      error("Failed to send email:"+ e);
      throw e;
    }
  }
};