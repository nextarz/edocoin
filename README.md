# EDOCOIN - FINANCE

Dashboard keuangan berbasis web modern dan ringan yang dirancang untuk mengelola keuangan pribadi Anda dengan lancar. Aplikasi ini menggunakan Google Sheets sebagai basis data *real-time* yang aman melalui Google Apps Script, sehingga tidak memerlukan pengaturan basis data yang rumit.

## 🚀 Fitur

*   **Integrasi Google Spreadsheet:** Terhubung langsung ke Google Sheets Anda menggunakan satu URL Web App.
*   **Sinkronisasi Real-time:** Menyinkronkan dan menyimpan data keuangan secara otomatis.
*   **Dashboard Komprehensif:** Memvisualisasikan Saldo Bersih, Total Pemasukan, Total Pengeluaran, dan Tingkat Tabungan.
*   **Tren Keuangan 6 Bulan:** Memantau kesehatan keuangan Anda dengan grafik garis interaktif yang melacak tren jangka panjang.
*   **Kategorisasi Pengeluaran:** Memecah pengeluaran ke dalam grafik visual yang jelas untuk penganggaran (*budgeting*) yang lebih baik.
*   **Manajemen Transaksi:** Mencatat, mengubah, dan melacak aktivitas keuangan harian Anda dengan mudah.

## 🛠️ Prasyarat

Sebelum menyiapkan antarmuka web, Anda memerlukan:
1. Akun Google.
2. Google Spreadsheet yang telah diformat untuk menerima data.
3. URL Web App Google Apps Script yang telah diterapkan (`https://google.com`).

## ⚙️ Penyiapan & Instalasi

### Penyiapan Aplikasi Web

1. **Klon repositori:**
   ```bash
   git clone https://github.com
   cd edocoin
   ```

2. **Buka aplikasi:**
   Jalankan file `index.html` di peramban web pilihan Anda atau terapkan melalui GitHub Pages.

3. **Hubungkan Basis Data:**
   * Buka dashboard aplikasi.
   * Tempel URL Web App Google Apps Script Anda ke dalam kolom input di bawah "Hubungkan ke Google Spreadsheet".
   * Klik **Hubungkan**.
   * Gunakan **Test Koneksi** untuk memastikan penyiapan berhasil.

---

### 💻 Panduan Penyiapan Google Apps Script

Ikuti langkah-langkah berikut untuk menyiapkan backend basis data Google Sheets Anda:

1. **Buat Google Spreadsheet Baru:**
   * Buka Google Drive -> Baru -> Google Spreadsheet.
   * Beri nama spreadsheet sesuai keinginan Anda (misalnya, `edocoin Finance`).

2. **Buka Apps Script:**
   * Di dalam spreadsheet Anda, klik **Ekstensi** -> **Apps Script**.
   * Hapus semua kode yang ada di dalam editor.
   * Tempel kode Apps Script yang disediakan di bawah ini.

3. **Terapkan sebagai Web App:**
   * Klik **Terapkan** (*Deploy*) -> **Terapkan Baru** (*New Deployment*).
   * Pilih **Aplikasi Web** (*Web App*) sebagai jenis penerapan.
   * Atur *Jalankan sebagai* (*Execute as*) ke: **"Saya"** (*"Me"*).
   * Atur *Siapa yang memiliki akses* (*Who has access*) ke: **"Siapa saja"** (*"Anyone"*).
   * Klik **Terapkan** (*Deploy*).

4. **Salin URL Web App:**
   * Setelah penerapan selesai, salin URL yang dihasilkan (format: `https://google.com`).

5. **Tempel URL ke edocoin:**
   * Tempel URL yang telah disalin ke dalam kolom konfigurasi pada dashboard **edocoin** Anda.
   * Klik **Hubungkan**.

---

### 📜 Kode Google Apps Script

Salin dan tempel kode ini ke dalam Editor Google Apps Script Anda:

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
