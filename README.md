# EDOCOIN - FINANCE

A modern, lightweight web-based financial dashboard designed to manage your personal finances seamlessly. It utilizes Google Sheets as a secure, real-time database via Google Apps Script, eliminating the need for complex database setups.

## 🚀 Features

*   **Google Spreadsheet Integration:** Connects directly to your Google Sheets using a single Web App URL.
*   **Real-time Synchronization:** Automatically syncs and saves financial data.
*   **Comprehensive Dashboard:** Visualizes Net Balance (Saldo Bersih), Total Income (Total Pemasukan), Total Expense (Total Pengeluaran), and Savings Rate (Tingkat Tabungan).
*   **6-Month Financial Trend:** Monitors your financial health with an interactive line chart tracking long-term trends.
*   **Expense Categorization:** Breaks down expenses into clear visual charts for better budgeting.
*   **Transaction Management:** Easily log, modify, and track daily financial activities.

## 🛠️ Prerequisites

Before setting up the web interface, you need:
1. A Google Account.
2. A Google Spreadsheet formatted to receive data.
3. A deployed Google Apps Script Web App URL (`https://script.google.com/macros/s/.../exec`).

## ⚙️ Setup & Installation

### Web Application Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nextarz/edocoin
   cd edocoin
   ```

2. **Open the application:**
   Launch the `index.html` file in your preferred web browser or deploy it via GitHub Pages.

3. **Connect the Database:**
   * Open the application dashboard.
   * Paste your **Google Apps Script Web App URL** into the input field under "Hubungkan ke Google Spreadsheet".
   * Click **Hubungkan** (Connect).
   * Use **Test Koneksi** (Test Connection) to ensure the setup is successful.

---

### 💻 Google Apps Script Setup Guide

Follow these steps to set up your Google Sheets database backend:

1. **Create a New Google Spreadsheet:**
   * Go to Google Drive -> New -> Google Sheets.
   * Name the spreadsheet as you like (e.g., `edocoin Finance`).

2. **Open Apps Script:**
   * Inside your spreadsheet, click **Extensions** -> **Apps Script**.
   * Delete any existing code in the editor.
   * Paste the Apps Script code provided below.

3. **Deploy as a Web App:**
   * Click **Deploy** -> **New Deployment**.
   * Select **Web App** as the deployment type.
   * Set *Execute as* to: **"Me"**.
   * Set *Who has access* to: **"Anyone"**.
   * Click **Deploy**.

4. **Copy the Web App URL:**
   * After deployment, copy the generated URL (format: `https://script.google.com/macros/s/.../exec`).

5. **Paste URL into edocoin:**
   * Paste the copied URL into the configuration field on your **edocoin** dashboard.
   * Click **Hubungkan** (Connect).

---

### 📜 Google Apps Script Code

Copy and paste this code into your Google Apps Script Editor:

```javascript
// edocoin - Google Apps Script Backend
// Deploy as Web App (Anyone can access)

const SHEET_NAME = 'Transaksi';
const HEADERS = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah', 'Catatan', 'Timestamp'];

function doGet(e) {
  const action = e.parameter.action;
  const sheet = e.parameter.sheet || SHEET_NAME;
  
  if (action === 'PING') {
    return jsonResponse({status: 'ok', message: 'edocoin Connected'});
  }
  
  if (action === 'GET_ALL') {
    return getAll(sheet);
  }
  
  return jsonResponse({status: 'ok'});
}

function doPost(e) {
  // Handle data insertion logic here
}

function jsonResponse(output) {
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
```


