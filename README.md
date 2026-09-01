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
// Edocoin — Google Apps Script Backend
// Deploy sebagai Web App (Anyone can access)

const SHEET_NAME = 'Transaksi';
const HEADERS = ['ID','Tanggal','Tipe','Kategori','Deskripsi','Jumlah','Catatan','Timestamp'];

function doGet(e) {
  const action = e.parameter.action;
  const sheet = e.parameter.sheet || SHEET_NAME;
  
  if (action === 'PING') {
    return jsonResponse({status: 'ok', message: 'Edocoin Connected'});
  }
  
  if (action === 'GET_ALL') {
    return getAll(sheet);
  }
  
  return jsonResponse({status: 'ok'});
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, data, sheet } = body;
    const sheetName = sheet || SHEET_NAME;
    
    ensureSheet(sheetName);
    
    if (action === 'ADD') return addRow(sheetName, data);
    if (action === 'UPDATE') return updateRow(sheetName, data);
    if (action === 'DELETE') return deleteRow(sheetName, data.id);
    
    return jsonResponse({status: 'error', message: 'Unknown action'});
  } catch(err) {
    return jsonResponse({status: 'error', message: err.message});
  }
}

function ensureSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground('#1e2d42')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getAll(sheetName) {
  const sheet = ensureSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return jsonResponse({transactions: []});
  
  const headers = data[0];
  const transactions = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h.toLowerCase()] = row[i]);
    return {
      id: obj['id'], date: obj['tanggal'],
      type: obj['tipe'], category: obj['kategori'],
      description: obj['deskripsi'], amount: parseFloat(obj['jumlah'])||0,
      note: obj['catatan'], timestamp: obj['timestamp']
    };
  }).filter(t => t.id);
  
  return jsonResponse({transactions, total: transactions.length});
}

function addRow(sheetName, data) {
  const sheet = ensureSheet(sheetName);
  const row = [data.id, data.date, data.type, data.category,
               data.description, data.amount, data.note||'', data.timestamp];
  sheet.appendRow(row);
  
  // Format amount column
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 6).setNumberFormat('#,##0');
  
  // Color rows by type
  const color = data.type === 'income' ? '#e8f5e9' : '#fce4ec';
  sheet.getRange(lastRow, 1, 1, HEADERS.length).setBackground(color);
  
  return jsonResponse({status: 'success', id: data.id});
}

function updateRow(sheetName, data) {
  const sheet = ensureSheet(sheetName);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.getRange(i+1, 1, 1, HEADERS.length).setValues([
        [data.id, data.date, data.type, data.category,
         data.description, data.amount, data.note||'', data.timestamp]
      ]);
      return jsonResponse({status: 'success'});
    }
  }
  return addRow(sheetName, data);
}

function deleteRow(sheetName, id) {
  const sheet = ensureSheet(sheetName);
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({status: 'success'});
    }
  }
  return jsonResponse({status: 'not_found'});
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

```


