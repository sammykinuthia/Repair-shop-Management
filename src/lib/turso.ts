import { createClient } from "@libsql/client/http"; // Use HTTP for lightweight usage in Tauri

// Replace with your actual credentials
const TURSO_DATABASE_URL = import.meta.env.VITE_TURSO_DATABASE_URL as string;
const TURSO_AUTH_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN as string;

export const turso = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});