
# 🛠️ Royoltech Repair Manager

**A robust, offline-first Electronics Repair Shop Management System.**
Built with **Tauri v2**, **React**, **TypeScript**, and **SQLite**.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Stack](https://img.shields.io/badge/tech-Tauri%20%7C%20React%20%7C%20SQLite-orange)

## 📖 Overview

Royoltech Repair Manager is a desktop application designed specifically for the Kenyan electronics repair market. It helps technicians and shop owners track repair jobs, manage client history, calculate profits, and issue professional tickets.

The system runs locally on the shop's computer (Windows/Linux), ensuring data privacy and speed without requiring an internet connection for basic operations.

## ✨ Key Features

### 🔧 Repair Tracking
- **Lifecycle Management:** Track items from *Received* -> *Diagnosing* -> *Waiting for Parts* -> *Fixed* -> *Collected*.
- **Ticketing:** Auto-generates unique Ticket IDs (e.g., `T-1045`).
- **Images:** Attach photos of devices (damage/condition) directly to the record.
- **Overstay Alerts:** Automatically flags items sitting in the shop for >30 days.

### 👥 Client Management
- **Database:** Search clients by Name or Phone Number.
- **History:** View every device a specific client has ever brought in.
- **WhatsApp Integration:** One-click button to open WhatsApp Web and notify clients (supports +254 format).

### 💰 Financials & POS
- **Costing:** Track `Internal Cost` (Parts), `Labor`, and `Final Price`.
- **Profit Calculation:** Auto-calculates profit per job.
- **Payments:** Record Cash, Card, or **MPESA** payments (with Transaction Codes).
- **Deposits:** Track partial payments and calculate remaining balance automatically.

### 🖨️ Printing & Reports
- **Thermal Printing:** Dedicated generic receipt layout for 58mm/80mm thermal printers.
- **QR Codes:** Tickets include QR codes for quick scanning.
- **Dashboards:** Admin view for total revenue; Staff view for active jobs.

### 🛡️ Security & Data
- **Role-Based Access:** Admin (Full Access) vs. Staff (Restricted view, no revenue stats).
- **Local Backup:** Built-in tool to backup the SQLite database to USB or external drive.
- **Audit Logs:** Tracks who created, updated, or deleted records.

---

## 🏗️ Tech Stack

- **Core:** [Tauri v2](https://v2.tauri.app/) (Rust + WebView)
- **Frontend:** React + TypeScript + Vite
- **Styling:** TailwindCSS + Lucide Icons
- **Database:** SQLite (via `@tauri-apps/plugin-sql`)
- **Query Builder:** Kysely (Type-safe SQL)
- **Routing:** React Router DOM (HashRouter)

---

## 🚀 Getting Started

### Prerequisites
1.  **Node.js** (v18 or higher)
2.  **Rust** (Latest stable)
3.  **pnpm** (Package manager)
4.  *Linux Users:* Ensure `libwebkit2gtk`, `build-essential`, `curl`, `wget`, `file`, `openssl` are installed.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/repair-stock-management.git
    cd repair-stock-management
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Run in Development Mode**
    ```bash
    pnpm tauri dev
    ```

*Note: The database (`repair_stock_management.db`) will be automatically created in your system's AppConfig or AppData folder upon the first run.*

---

## 📦 Building for Production

To create an installer (`.exe` for Windows or `.deb`/`.AppImage` for Linux):

1.  **Generate Icons (If changing logo)**
    ```bash
    pnpm tauri icon ./app-icon.png
    ```

2.  **Build Command**
    ```bash
    pnpm tauri build
    ```

The output files will be located in:
`src-tauri/target/release/bundle/`

---

## 📂 Project Structure

```text
src/
├── components/         # Reusable UI (Layout, Badges, Modals)
├── context/            # Global Auth Context
├── features/           # Business Logic (Services)
│   ├── clients/        # Client CRUD & Service
│   ├── repairs/        # Repair CRUD & Logic
│   ├── users/          # Auth & Staff Management
│   └── settings/       # Shop settings logic
├── lib/                # Core infrastructure
│   ├── db.ts           # Database connection & Schema
│   └── storage.ts      # Image file handling
├── pages/              # UI Pages (Dashboard, RepairDetails, etc.)
│   └── print/          # Dedicated window for printing
└── App.tsx             # Routing & Initialization
```

---

## 🇰🇪 Kenyan Context Specifics

- **Phone Validation:** Accepts `07xx`, `01xx`, and `+254` formats.
- **MPESA:** Specific fields for recording MPESA Transaction Codes (e.g., `QFH382...`).
- **WhatsApp:** Pre-formats messages for the Kenyan region code (+254).

---

## ⚠️ Common Troubleshooting

**1. "Database Locked" when printing**
*   *Cause:* The print window tries to re-initialize the DB migration.
*   *Fix:* Logic is handled in `App.tsx` to only run migrations on the window labeled `main`.

**2. Images not showing**
*   *Cause:* Security Policy blocking local file access.
*   *Fix:* The system reads files into memory and converts them to `Blob URLs` in `src/lib/storage.ts`.

**3. "Window protected your PC" (Windows)**
*   *Cause:* The app is not digitally signed (requires a paid certificate).
*   *Fix:* Click "More Info" -> "Run Anyway".

---

## 📄 License

Copyright © 2025 **Royoltech Solutions**.
All Rights Reserved.

---

**Developed by Royoltech Solutions**
[royoltech.com](https://royoltech.com)