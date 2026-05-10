// ═══════════════════════════════════════════════════
//  Abu Khaisa — CORE APP
// ═══════════════════════════════════════════════════

// ─── STATE ───
let state = {
  scriptUrl: "",
  sheetName: "Transaksi",
  transactions: [],
  budgets: {},
  categories: {
    income: ["Gaji", "Freelance", "Investasi", "Bisnis", "Bonus", "Lainnya"],
    expense: [
      "Makanan",
      "Transport",
      "Tagihan",
      "Kesehatan",
      "Hiburan",
      "Belanja",
      "Pendidikan",
      "Tabungan",
      "Lainnya",
    ],
  },
  currentType: "income",
  currentTab: "all",
  editId: null,
};

let currentMonth = new Date().toISOString().slice(0, 7);
let chartInstances = {};

// ─── INIT ───
function init() {
  loadFromStorage();
  document.getElementById("globalMonth").value = currentMonth;
  setTodayDate();
  renderAll();
  renderCategoryList();
  renderAppsScriptCode();
  updateConnectionStatus();
  if (!state.scriptUrl) {
    document.getElementById("configBanner").classList.remove("hidden");
  }
}

function loadFromStorage() {
  try {
    const d = JSON.parse(localStorage.getItem("Abu Khaisa") || "{}");
    if (d.scriptUrl) state.scriptUrl = d.scriptUrl;
    if (d.sheetName) state.sheetName = d.sheetName;
    if (d.transactions) state.transactions = d.transactions;
    if (d.budgets) state.budgets = d.budgets;
    if (d.categories) state.categories = d.categories;
    if (d.currentMonth) currentMonth = d.currentMonth;
    if (d.scriptUrl) {
      document.getElementById("scriptUrlInput").value = d.scriptUrl;
      document.getElementById("settingsUrl").value = d.scriptUrl;
    }
    if (d.sheetName)
      document.getElementById("settingsSheet").value = d.sheetName;
  } catch (e) {}
}

function saveToStorage() {
  localStorage.setItem(
    "Abu Khaisa",
    JSON.stringify({
      scriptUrl: state.scriptUrl,
      sheetName: state.sheetName,
      transactions: state.transactions,
      budgets: state.budgets,
      categories: state.categories,
      currentMonth,
    }),
  );
}

// ─── NAVIGATION ───
function navigate(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll(".nav-item").forEach((n) => {
    if (
      n.textContent
        .trim()
        .toLowerCase()
        .includes(
          page === "panduan"
            ? "panduan"
            : page === "pengaturan"
              ? "konfigurasi"
              : page,
        )
    ) {
      n.classList.add("active");
    }
  });
  const titles = {
    dashboard: "Dashboard",
    transaksi: "Transaksi",
    laporan: "Laporan",
    anggaran: "Anggaran",
    pengaturan: "Konfigurasi",
    panduan: "Panduan Setup",
  };
  const subs = {
    //  dashboard: "Ringkasan Keuangan",
    // transaksi: "Kelola Transaksi",
    //  laporan: "Analisis Keuangan",
    //  anggaran: "Kelola Anggaran",
    //  pengaturan: "Pengaturan Akun",
    //  panduan: "Cara Integrasi",
  };
  document.getElementById("topbarTitle").innerHTML =
    (titles[page] || page) +
    ' <span id="topbarSub">' +
    (subs[page] || "") +
    "</span>";
  closeSidebar();

  if (page === "transaksi") renderTransactions();
  if (page === "laporan") renderLaporan();
  if (page === "anggaran") renderAnggaran();
  if (page === "pengaturan") renderCategoryList();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlayBg").classList.toggle("show");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlayBg").classList.remove("show");
}

// ─── MONTH CHANGE ───
function onMonthChange() {
  currentMonth = document.getElementById("globalMonth").value;
  saveToStorage();
  renderAll();
}

// ─── RENDER ALL ───
function renderAll() {
  const txs = getMonthTransactions();
  renderStats(txs);
  renderFormulas(txs);
  renderRecentTable(txs);
  renderTrendChart();
  renderDonut(txs);
  renderRule502030(txs);
}

// ─── GET MONTH TRANSACTIONS ───
function getMonthTransactions(month) {
  const m = month || currentMonth;
  return state.transactions.filter((t) => t.date && t.date.startsWith(m));
}

// ─── STATS ───
function renderStats(txs) {
  const income = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const saveRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
  const incomeCount = txs.filter((t) => t.type === "income").length;
  const expenseCount = txs.filter((t) => t.type === "expense").length;

  document.getElementById("stat-balance").textContent = fmtRp(balance);
  document.getElementById("stat-income").textContent = fmtRp(income);
  document.getElementById("stat-expense").textContent = fmtRp(expense);
  document.getElementById("stat-saving").textContent = saveRate + "%";
  document.getElementById("stat-income-sub").textContent =
    incomeCount + " transaksi";
  document.getElementById("stat-expense-sub").textContent =
    expenseCount + " transaksi";
  document.getElementById("stat-saving-sub").textContent = "dari pemasukan";
  document.getElementById("stat-balance-sub").textContent = currentMonth;

  // Color balance
  const balEl = document.getElementById("stat-balance");
  balEl.style.color = balance >= 0 ? "var(--blue)" : "var(--red)";
}

// ─── FORMULAS ───
function renderFormulas(txs) {
  const income = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const saveRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
  const expRatio = income > 0 ? ((expense / income) * 100).toFixed(1) : 0;

  // Days in month
  const [yr, mo] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const today = new Date();
  const daysPassed =
    today.getFullYear() === yr && today.getMonth() + 1 === mo
      ? today.getDate()
      : daysInMonth;
  const avgPerDay = daysPassed > 0 ? expense / daysPassed : 0;
  const projection = avgPerDay * daysInMonth;

  document.getElementById("f-income").textContent = fmtRp(income);
  document.getElementById("f-expense").textContent = fmtRp(expense);
  const fBal = document.getElementById("f-balance");
  fBal.textContent = fmtRp(balance);
  fBal.className = "f-val " + (balance >= 0 ? "positive" : "negative");
  document.getElementById("f-saverate").textContent = saveRate + "%";
  document.getElementById("f-expratio").textContent = expRatio + "%";
  document.getElementById("f-avgday").textContent = fmtRp(avgPerDay);
  document.getElementById("f-txcount").textContent = txs.length;
  document.getElementById("f-projection").textContent = fmtRp(projection);
}

// ─── RULE 50/30/20 ───
function renderRule502030(txs) {
  const income = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const needs = income * 0.5;
  const wants = income * 0.3;
  const save = income * 0.2;

  // Approximate categorization
  const needsCats = [
    "Makanan",
    "Transport",
    "Tagihan",
    "Kesehatan",
    "Pendidikan",
  ];
  const wantsCats = ["Hiburan", "Belanja"];
  const saveCats = ["Tabungan", "Investasi"];

  const needsSpent = txs
    .filter((t) => t.type === "expense" && needsCats.includes(t.category))
    .reduce((s, t) => s + t.amount, 0);
  const wantsSpent = txs
    .filter((t) => t.type === "expense" && wantsCats.includes(t.category))
    .reduce((s, t) => s + t.amount, 0);
  const saveSpent =
    txs
      .filter((t) => t.type === "expense" && saveCats.includes(t.category))
      .reduce((s, t) => s + t.amount, 0) + Math.max(0, balance);

  const setProgress = (id, valId, limitId, spent, limit) => {
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const el = document.getElementById(id);
    el.style.width = pct + "%";
    el.style.background =
      pct > 100 ? "var(--red)" : pct > 80 ? "var(--gold)" : undefined;
    document.getElementById(valId).textContent = fmtRp(spent);
    document.getElementById(limitId).textContent = fmtRp(limit);
  };

  setProgress(
    "prog-needs",
    "prog-needs-val",
    "prog-needs-limit",
    needsSpent,
    needs,
  );
  setProgress(
    "prog-wants",
    "prog-wants-val",
    "prog-wants-limit",
    wantsSpent,
    wants,
  );
  setProgress("prog-save", "prog-save-val", "prog-save-limit", saveSpent, save);

  // Health status
  const saveRate = income > 0 ? (balance / income) * 100 : 0;
  let status = "—",
    color = "var(--text3)";
  if (income === 0) {
    status = "Belum ada data";
  } else if (saveRate >= 20) {
    status = "✅ Sehat";
    color = "var(--green)";
  } else if (saveRate >= 10) {
    status = "⚠️ Perlu Perhatian";
    color = "var(--gold)";
  } else if (saveRate >= 0) {
    status = "🔴 Perlu Perbaikan";
    color = "var(--red)";
  } else {
    status = "❌ Defisit!";
    color = "var(--red)";
  }

  const healthEl = document.getElementById("health-status");
  healthEl.textContent = status;
  healthEl.style.color = color;

  // Days left
  const [yr, mo] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const today = new Date();
  const daysLeft =
    today.getFullYear() === yr && today.getMonth() + 1 === mo
      ? daysInMonth - today.getDate()
      : 0;
  document.getElementById("days-left").textContent = daysLeft + " hari";
}

// ─── RECENT TABLE ───
function renderRecentTable(txs) {
  const sorted = [...txs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);
  const tbody = document.getElementById("recentTxTable");
  if (!sorted.length) {
    tbody.innerHTML =
      '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Belum ada transaksi bulan ini</div></div></td></tr>';
    return;
  }
  tbody.innerHTML = sorted
    .map(
      (t) => `
    <tr>
      <td class="tx-desc">${esc(t.description)}</td>
      <td><span class="tx-cat ${t.type === "income" ? "badge-green" : "badge-red"} badge">${esc(t.category)}</span></td>
      <td class="tx-date">${fmtDate(t.date)}</td>
      <td class="tx-amount ${t.type}" style="text-align:right">${t.type === "income" ? "+" : "-"}${fmtRp(t.amount)}</td>
    </tr>`,
    )
    .join("");
}

// ─── TRANSACTIONS PAGE ───
function renderTransactions() {
  let txs = [...state.transactions];
  const tab = state.currentTab;
  if (tab === "income") txs = txs.filter((t) => t.type === "income");
  if (tab === "expense") txs = txs.filter((t) => t.type === "expense");

  const cat = document.getElementById("filterCat")?.value;
  const from = document.getElementById("filterFrom")?.value;
  const to = document.getElementById("filterTo")?.value;

  if (cat) txs = txs.filter((t) => t.category === cat);
  if (from) txs = txs.filter((t) => t.date >= from);
  if (to) txs = txs.filter((t) => t.date <= to);

  txs.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Update category filter options
  const filterCat = document.getElementById("filterCat");
  const allCats = [
    ...new Set(state.transactions.map((t) => t.category)),
  ].sort();
  filterCat.innerHTML =
    '<option value="">Semua Kategori</option>' +
    allCats
      .map(
        (c) =>
          `<option value="${c}"${cat === c ? " selected" : ""}>${c}</option>`,
      )
      .join("");

  const income = txs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  document.getElementById("tableTotal").textContent = txs.length;
  document.getElementById("tableIncome").textContent = fmtRp(income);
  document.getElementById("tableExpense").textContent = fmtRp(expense);

  const tbody = document.getElementById("txTable");
  if (!txs.length) {
    tbody.innerHTML =
      '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Tidak ada transaksi</div></div></td></tr>';
    return;
  }
  tbody.innerHTML = txs
    .map(
      (t, i) => `
    <tr>
      <td style="color:var(--text3);font-family:var(--mono);font-size:11px">${i + 1}</td>
      <td class="tx-desc">${esc(t.description)}</td>
      <td><span class="tx-cat ${t.type === "income" ? "badge-green" : "badge-red"} badge">${esc(t.category)}</span></td>
      <td class="tx-date">${fmtDate(t.date)}</td>
      <td style="color:var(--text3);font-size:12px">${esc(t.note || "")}</td>
      <td class="tx-amount ${t.type}" style="text-align:right">${t.type === "income" ? "+" : "-"}${fmtRp(t.amount)}</td>
      <td>
        <div class="tx-actions">
          <button class="icon-btn" onclick="editTransaction('${t.id}')" title="Edit">✏️</button>
          <button class="icon-btn delete" onclick="deleteTransaction('${t.id}')" title="Hapus">🗑</button>
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

function switchTab(el, tab) {
  document
    .querySelectorAll("#page-transaksi .tab")
    .forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
  state.currentTab = tab;
  renderTransactions();
}

// ─── LAPORAN ───
function renderLaporan() {
  // Monthly report
  const months = getLast6Months();
  const monthlyData = months.map((m) => {
    const txs = getMonthTransactions(m);
    const income = txs
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = txs
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { month: m, income, expense, balance: income - expense };
  });

  document.getElementById("monthlyReport").innerHTML = monthlyData
    .map(
      (d) => `
    <div class="summary-row">
      <span class="summary-key">${formatMonthLabel(d.month)}</span>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        <span style="font-family:var(--mono);font-size:12px;color:var(--green)">+${fmtRp(d.income)}</span>
        <span style="font-family:var(--mono);font-size:12px;color:var(--red)">-${fmtRp(d.expense)}</span>
        <span style="font-family:var(--mono);font-size:11px;color:${d.balance >= 0 ? "var(--blue)" : "var(--red)"}">${fmtRp(d.balance)}</span>
      </div>
    </div>`,
    )
    .join("");

  // Category breakdown
  const txs = state.transactions;
  const catTotals = {};
  txs
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);

  document.getElementById("categoryReport").innerHTML = sorted.length
    ? sorted
        .map(
          ([cat, val]) => `
        <div class="progress-item">
          <div class="progress-info">
            <span class="progress-label">${esc(cat)}</span>
            <span class="progress-val">${fmtRp(val)} (${total > 0 ? ((val / total) * 100).toFixed(1) : 0}%)</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${total > 0 ? (val / total) * 100 : 0}%;background:${getCatColor(cat)}"></div></div>
        </div>`,
        )
        .join("")
    : '<div style="color:var(--text3);font-size:13px">Belum ada data pengeluaran</div>';

  renderBarChart(monthlyData);
}

// ─── ANGGARAN ───
function renderAnggaran() {
  const txs = getMonthTransactions();
  const budgetCats = Object.keys(state.budgets);

  if (!budgetCats.length) {
    document.getElementById("budgetList").innerHTML =
      '<div class="empty-state"><div class="empty-icon">💸</div><div class="empty-text">Belum ada anggaran ditetapkan</div></div>';
    document.getElementById("budgetAnalysis").innerHTML =
      '<div style="color:var(--text3);font-size:13px">Tambah anggaran untuk melihat analisis</div>';
    return;
  }

  let totalBudget = 0,
    totalSpent = 0;
  const items = budgetCats.map((cat) => {
    const budget = state.budgets[cat];
    const spent = txs
      .filter((t) => t.type === "expense" && t.category === cat)
      .reduce((s, t) => s + t.amount, 0);
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    totalBudget += budget;
    totalSpent += spent;
    return { cat, budget, spent, pct };
  });

  document.getElementById("budgetList").innerHTML = items
    .map(
      (item) => `
    <div class="budget-meter">
      <div class="meter-header">
        <span class="meter-label">${esc(item.cat)}</span>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="meter-ratio">${fmtRp(item.spent)} / ${fmtRp(item.budget)}</span>
          <button class="icon-btn delete btn-sm" onclick="deleteBudget('${item.cat}')">✕</button>
        </div>
      </div>
      <div class="meter-bar">
        <div class="meter-fill" style="width:${Math.min(item.pct, 100)}%;background:${item.pct > 100 ? "var(--red)" : item.pct > 80 ? "var(--gold)" : "var(--green)"}"></div>
      </div>
      <div class="meter-labels">
        <span>${item.pct.toFixed(1)}% terpakai</span>
        <span>Sisa: ${fmtRp(Math.max(0, item.budget - item.spent))}</span>
      </div>
    </div>`,
    )
    .join("");

  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  document.getElementById("budgetAnalysis").innerHTML = `
    <div class="summary-row"><span class="summary-key">Total Anggaran</span><span class="summary-val" style="font-family:var(--mono)">${fmtRp(totalBudget)}</span></div>
    <div class="summary-row"><span class="summary-key">Total Terpakai</span><span class="summary-val" style="color:var(--red);font-family:var(--mono)">${fmtRp(totalSpent)}</span></div>
    <div class="summary-row"><span class="summary-key">Sisa Anggaran</span><span class="summary-val" style="color:var(--green);font-family:var(--mono)">${fmtRp(Math.max(0, totalBudget - totalSpent))}</span></div>
    <div class="summary-row"><span class="summary-key">Persentase Terpakai</span><span class="summary-val" style="color:${overallPct > 100 ? "var(--red)" : overallPct > 80 ? "var(--gold)" : "var(--green)"};font-family:var(--mono)">${overallPct.toFixed(1)}%</span></div>
    <div style="margin-top:12px">
      <div class="progress-bar" style="height:8px">
        <div class="progress-fill" style="width:${Math.min(overallPct, 100)}%;background:${overallPct > 100 ? "var(--red)" : overallPct > 80 ? "var(--gold)" : "var(--green)"}"></div>
      </div>
    </div>`;
}

function openBudgetModal() {
  const sel = document.getElementById("budgetCat");
  const cats = state.categories.expense;
  sel.innerHTML = cats
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");
  document.getElementById("budgetAmount").value = "";
  openModal("budgetModal");
}

function saveBudget() {
  const cat = document.getElementById("budgetCat").value;
  const amt = parseAmount(document.getElementById("budgetAmount").value);
  if (!cat || !amt) {
    toast("Lengkapi data anggaran", "warning");
    return;
  }
  state.budgets[cat] = amt;
  saveToStorage();
  closeModal("budgetModal");
  renderAnggaran();
  toast("Anggaran " + cat + " disimpan", "success");
}

function deleteBudget(cat) {
  delete state.budgets[cat];
  saveToStorage();
  renderAnggaran();
  toast("Anggaran dihapus", "info");
}

// ─── CATEGORY ───
function renderCategoryList() {
  const cont = document.getElementById("categoryList");
  if (!cont) return;
  const all = [
    ...state.categories.income.map((c) => ({ name: c, type: "income" })),
    ...state.categories.expense.map((c) => ({ name: c, type: "expense" })),
  ];
  cont.innerHTML = all
    .map(
      (c) => `
    <div class="badge ${c.type === "income" ? "badge-green" : "badge-red"}" style="gap:6px;padding:5px 10px">
      ${esc(c.name)}
      <button onclick="removeCategory('${c.name}','${c.type}')" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;font-size:12px;line-height:1">✕</button>
    </div>`,
    )
    .join("");
}

function addCategory() {
  const name = document.getElementById("newCatInput").value.trim();
  const type = document.getElementById("newCatType").value;
  if (!name) return;
  if (!state.categories[type].includes(name)) {
    state.categories[type].push(name);
    saveToStorage();
    renderCategoryList();
    document.getElementById("newCatInput").value = "";
    toast("Kategori ditambahkan", "success");
  } else {
    toast("Kategori sudah ada", "warning");
  }
}

function removeCategory(name, type) {
  state.categories[type] = state.categories[type].filter((c) => c !== name);
  saveToStorage();
  renderCategoryList();
}

// ─── CHARTS ───
function renderTrendChart() {
  const months = getLast6Months();
  const incomes = months.map((m) =>
    getMonthTransactions(m)
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0),
  );
  const expenses = months.map((m) =>
    getMonthTransactions(m)
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0),
  );
  const labels = months.map(formatMonthLabel);
  drawLineChart("trendChart", labels, incomes, expenses);
}

function drawLineChart(id, labels, incomes, expenses) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement.clientWidth || 400;
  const h = 160;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 16, right: 16, bottom: 28, left: 60 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const all = [...incomes, ...expenses];
  const maxV = Math.max(...all, 1);

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ch * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(139,155,180,0.6)";
    ctx.font = "10px DM Mono, monospace";
    ctx.textAlign = "right";
    ctx.fillText(shortFmt(maxV * (1 - i / 4)), pad.left - 6, y + 3);
  }

  // Labels
  ctx.fillStyle = "rgba(139,155,180,0.8)";
  ctx.font = "10px DM Sans, sans-serif";
  ctx.textAlign = "center";
  labels.forEach((lb, i) => {
    const x = pad.left + (i / (labels.length - 1 || 1)) * cw;
    ctx.fillText(lb, x, h - 4);
  });

  // Lines
  const drawLine = (data, color) => {
    if (data.length < 2) return;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.left + (i / (data.length - 1 || 1)) * cw;
      const y = pad.top + ch * (1 - v / maxV);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.left + (i / (data.length - 1 || 1)) * cw;
      const y = pad.top + ch * (1 - v / maxV);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, color + "40");
    grad.addColorStop(1, color + "00");
    ctx.fillStyle = grad;
    ctx.fill();

    // Dots
    data.forEach((v, i) => {
      const x = pad.left + (i / (data.length - 1 || 1)) * cw;
      const y = pad.top + ch * (1 - v / maxV);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  };

  drawLine(incomes, "#00e5a0");
  drawLine(expenses, "#ff5a7e");
}

function renderDonut(txs) {
  const expense = txs.filter((t) => t.type === "expense");
  const catTotals = {};
  expense.forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const entries = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const colors = [
    "#4d9fff",
    "#00e5a0",
    "#ff5a7e",
    "#f5c842",
    "#c084fc",
    "#fb923c",
  ];

  const canvas = document.getElementById("donutChart");
  if (!canvas) return;

  // HD: use physical pixel size for crisp rendering
  const SIZE = 180; // CSS size in px
  const dpr = Math.min(window.devicePixelRatio || 1, 3); // cap at 3x for perf
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  canvas.style.width = SIZE + "px";
  canvas.style.height = SIZE + "px";

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.scale(dpr, dpr);

  const cx = SIZE / 2,
    cy = SIZE / 2;
  const outerR = 78,
    innerR = 50; // ring thickness = 28px
  const GAP = 0.03; // radians gap between segments

  ctx.clearRect(0, 0, SIZE, SIZE);

  // Center value
  const centerEl = document.getElementById("donutCenterVal");
  if (centerEl) centerEl.textContent = total > 0 ? shortFmt(total) : "—";

  if (!entries.length) {
    // Empty ring
    ctx.beginPath();
    ctx.arc(cx, cy, (outerR + innerR) / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = outerR - innerR;
    ctx.stroke();
    document.getElementById("donutLegend").innerHTML =
      '<div style="color:var(--text3);font-size:13px">Belum ada data pengeluaran bulan ini</div>';
    return;
  }

  // Animate draw
  let progress = { v: 0 };
  const startAngles = [];
  const sweeps = [];
  let cumulative = -Math.PI / 2;
  entries.forEach(([, val]) => {
    const rawSweep = (val / total) * Math.PI * 2;
    const actualSweep = Math.max(rawSweep - GAP, 0.01);
    startAngles.push(cumulative + GAP / 2);
    sweeps.push(actualSweep);
    cumulative += rawSweep;
  });

  function drawFrame(p) {
    ctx.clearRect(0, 0, SIZE, SIZE);

    entries.forEach(([, val], i) => {
      const color = colors[i % colors.length];
      const start = startAngles[i];
      const sweep = sweeps[i] * p;
      if (sweep <= 0) return;

      // Subtle outer glow shadow
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      // Draw arc segment using stroke for perfect anti-aliasing
      ctx.beginPath();
      ctx.arc(cx, cy, (outerR + innerR) / 2, start, start + sweep);
      ctx.strokeStyle = color;
      ctx.lineWidth = outerR - innerR;
      ctx.lineCap = "butt";
      ctx.stroke();

      ctx.restore();
    });

    // Inner circle mask (clear center) — draw over for crisp hole
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fill();
    ctx.restore();

    // Thin inner border ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Smooth animation ~400ms
  const duration = 420;
  const start = performance.now();
  function animate(now) {
    const t = Math.min((now - start) / duration, 1);
    // ease-out cubic
    const p = 1 - Math.pow(1 - t, 3);
    drawFrame(p);
    if (t < 1) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // Legend
  document.getElementById("donutLegend").innerHTML = entries
    .map(
      ([cat, val], i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[i % colors.length]};box-shadow:0 0 6px ${colors[i % colors.length]}88"></div>
      <span class="legend-name">${esc(cat)}</span>
      <span class="legend-pct">${total > 0 ? ((val / total) * 100).toFixed(1) : 0}%</span>
    </div>`,
    )
    .join("");
}

function renderBarChart(monthlyData) {
  const canvas = document.getElementById("barChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement.clientWidth || 600;
  const h = 200;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 16, right: 16, bottom: 28, left: 60 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const n = monthlyData.length;
  const maxV = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
    1,
  );
  const barW = (cw / n) * 0.35;
  const gap = (cw / n) * 0.1;

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ch * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(139,155,180,0.6)";
    ctx.font = "10px DM Mono,monospace";
    ctx.textAlign = "right";
    ctx.fillText(shortFmt(maxV * (1 - i / 4)), pad.left - 6, y + 3);
  }

  monthlyData.forEach((d, i) => {
    const slotW = cw / n;
    const x = pad.left + i * slotW + slotW / 2;

    // Income bar
    const ih = (d.income / maxV) * ch;
    ctx.fillStyle = "#00e5a0";
    ctx.fillRect(x - barW - gap / 2, pad.top + ch - ih, barW, ih);

    // Expense bar
    const eh = (d.expense / maxV) * ch;
    ctx.fillStyle = "#ff5a7e";
    ctx.fillRect(x + gap / 2, pad.top + ch - eh, barW, eh);

    // Label
    ctx.fillStyle = "rgba(139,155,180,0.8)";
    ctx.font = "10px DM Sans,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(formatMonthLabel(d.month), x, h - 4);
  });
}

// ─── MODAL ───
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function openAddModal(editId) {
  state.editId = editId || null;
  document.getElementById("modalTitle").textContent = editId
    ? "Edit Transaksi"
    : "Tambah Transaksi";
  if (editId) {
    const tx = state.transactions.find((t) => t.id === editId);
    if (tx) {
      setType(tx.type);
      document.getElementById("txAmount").value = fmtNum(tx.amount);
      document.getElementById("txDate").value = tx.date;
      document.getElementById("txDesc").value = tx.description;
      document.getElementById("txNote").value = tx.note || "";
      updateCategoryOptions(tx.type, tx.category);
    }
  } else {
    setType("income");
    document.getElementById("txAmount").value = "";
    setTodayDate();
    document.getElementById("txDesc").value = "";
    document.getElementById("txNote").value = "";
  }
  openModal("addModal");
}

function setType(type) {
  state.currentType = type;
  const iBtn = document.getElementById("typeIncome");
  const eBtn = document.getElementById("typeExpense");
  iBtn.className = "type-btn" + (type === "income" ? " active-income" : "");
  eBtn.className = "type-btn" + (type === "expense" ? " active-expense" : "");
  updateCategoryOptions(type);
}

function updateCategoryOptions(type, selected) {
  const cats = state.categories[type] || [];
  const sel = document.getElementById("txCategory");
  sel.innerHTML = cats
    .map(
      (c) =>
        `<option value="${c}"${c === selected ? " selected" : ""}>${c}</option>`,
    )
    .join("");
}

function setTodayDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("txDate").value = today;
}

// ─── SUBMIT TRANSACTION ───
async function submitTransaction() {
  const amount = parseAmount(document.getElementById("txAmount").value);
  const date = document.getElementById("txDate").value;
  const category = document.getElementById("txCategory").value;
  const description = document.getElementById("txDesc").value.trim();
  const note = document.getElementById("txNote").value.trim();

  if (!amount || amount <= 0) {
    toast("Masukkan jumlah yang valid", "warning");
    return;
  }
  if (!date) {
    toast("Pilih tanggal", "warning");
    return;
  }
  if (!description) {
    toast("Isi deskripsi", "warning");
    return;
  }

  const tx = {
    id: state.editId || genId(),
    type: state.currentType,
    amount,
    date,
    category,
    description,
    note,
    timestamp: new Date().toISOString(),
  };

  setLoading("submitBtn", "submitSpinner", true);

  // Save to Google Sheets
  let synced = false;
  if (state.scriptUrl) {
    synced = await sendToSheet(state.editId ? "UPDATE" : "ADD", tx);
  }

  if (state.editId) {
    const idx = state.transactions.findIndex((t) => t.id === state.editId);
    if (idx >= 0) state.transactions[idx] = tx;
  } else {
    state.transactions.unshift(tx);
  }

  saveToStorage();
  setLoading("submitBtn", "submitSpinner", false);
  closeModal("addModal");
  renderAll();

  if (document.getElementById("page-transaksi").classList.contains("active"))
    renderTransactions();

  toast(
    (state.editId ? "Transaksi diperbarui" : "Transaksi disimpan") +
      (synced ? " & disinkronkan" : " (lokal)"),
    synced ? "success" : "info",
  );
}

function editTransaction(id) {
  openAddModal(id);
}

async function deleteTransaction(id) {
  if (!confirm("Hapus transaksi ini?")) return;
  const tx = state.transactions.find((t) => t.id === id);
  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveToStorage();
  renderAll();
  if (document.getElementById("page-transaksi").classList.contains("active"))
    renderTransactions();

  if (state.scriptUrl && tx) {
    await sendToSheet("DELETE", tx);
  }
  toast("Transaksi dihapus", "info");
}

// ─── GOOGLE SHEETS API ───
async function sendToSheet(action, data) {
  if (!state.scriptUrl) return false;
  setSyncStatus("syncing");
  try {
    const res = await fetch(state.scriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data, sheet: state.sheetName }),
    });
    setSyncStatus("connected");
    return true;
  } catch (e) {
    setSyncStatus("error");
    return false;
  }
}

async function syncAll() {
  if (!state.scriptUrl) {
    toast("Konfigurasikan URL Apps Script terlebih dahulu", "warning");
    return;
  }
  const spinner = document.getElementById("syncSpinner");
  if (spinner) {
    spinner.style.display = "inline-block";
  }
  setSyncStatus("syncing");
  try {
    const res = await fetch(
      state.scriptUrl +
        "?action=GET_ALL&sheet=" +
        encodeURIComponent(state.sheetName),
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.transactions) {
        // Merge: keep local new ones + server ones
        const serverIds = new Set(data.transactions.map((t) => t.id));
        const localNew = state.transactions.filter((t) => !serverIds.has(t.id));
        state.transactions = [...data.transactions, ...localNew];
        saveToStorage();
        renderAll();
        toast(
          "Sinkronisasi berhasil! " + state.transactions.length + " transaksi",
          "success",
        );
      }
    }
    setSyncStatus("connected");
  } catch (e) {
    setSyncStatus("error");
    toast("Gagal sinkronisasi — periksa koneksi atau URL", "error");
  }
  if (spinner) spinner.style.display = "none";
}

async function testConnection() {
  const url =
    document.getElementById("scriptUrlInput").value ||
    document.getElementById("settingsUrl").value;
  if (!url) {
    toast("Masukkan URL Apps Script", "warning");
    return;
  }
  setSyncStatus("syncing");
  toast("Menguji koneksi...", "info");
  try {
    await fetch(url + "?action=PING", { mode: "no-cors" });
    setSyncStatus("connected");
    toast("Koneksi berhasil! ✅", "success");
  } catch (e) {
    setSyncStatus("error");
    toast("Koneksi gagal. Periksa URL dan izin Apps Script", "error");
  }
}

// ─── CONFIG ───
function saveConfig() {
  const url =
    document.getElementById("scriptUrlInput").value ||
    document.getElementById("settingsUrl").value;
  const sheet = document.getElementById("settingsSheet")?.value || "Transaksi";
  if (!url) {
    toast("Masukkan URL Apps Script", "warning");
    return;
  }
  state.scriptUrl = url.trim();
  state.sheetName = sheet.trim() || "Transaksi";
  saveToStorage();
  document.getElementById("configBanner").classList.add("hidden");
  updateConnectionStatus();
  toast("Konfigurasi disimpan!", "success");
  testConnection();
}

function updateConnectionStatus() {
  if (state.scriptUrl) {
    setSyncStatus("connected");
  } else {
    setSyncStatus("");
  }
}

function setSyncStatus(status) {
  const dot = document.getElementById("syncDot");
  const txt = document.getElementById("syncText");
  dot.className = "sync-dot" + (status ? " " + status : "");
  txt.textContent =
    status === "connected"
      ? "Terhubung"
      : status === "syncing"
        ? "Menyinkronkan..."
        : status === "error"
          ? "Gagal terhubung"
          : "Tidak terhubung";
}

// ─── EXPORT ───
function exportCSV() {
  const rows = [
    ["ID", "Tanggal", "Tipe", "Kategori", "Deskripsi", "Jumlah", "Catatan"],
  ];
  state.transactions.forEach((t) =>
    rows.push([
      t.id,
      t.date,
      t.type,
      t.category,
      t.description,
      t.amount,
      t.note || "",
    ]),
  );
  const csv = rows
    .map((r) =>
      r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(","),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Abu Khaisa-" + currentMonth + ".csv";
  a.click();
  URL.revokeObjectURL(url);
  toast("CSV berhasil diexport", "success");
}

function importCSV() {
  toast("Fitur import CSV akan segera hadir", "info");
}
function clearLocalData() {
  if (
    !confirm("Hapus semua data lokal? Data di Google Sheets tidak terpengaruh.")
  )
    return;
  state.transactions = [];
  saveToStorage();
  renderAll();
  toast("Data lokal dihapus", "info");
}

// ─── APPS SCRIPT CODE ───
function renderAppsScriptCode() {
  const code = `// Abu Khaisa — Google Apps Script Backend
// Deploy sebagai Web App (Anyone can access)

const SHEET_NAME = 'Transaksi';
const HEADERS = ['ID','Tanggal','Tipe','Kategori','Deskripsi','Jumlah','Catatan','Timestamp'];

function doGet(e) {
  const action = e.parameter.action;
  const sheet = e.parameter.sheet || SHEET_NAME;
  
  if (action === 'PING') {
    return jsonResponse({status: 'ok', message: 'Abu Khaisa Connected'});
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
}`;

  document.getElementById("appsScriptCode").textContent = code;
  window._appsScriptCode = code;
}

function copyScript() {
  navigator.clipboard.writeText(window._appsScriptCode || "").then(() => {
    toast("Kode Apps Script berhasil dicopy!", "success");
  });
}

// ─── HELPERS ───
function fmtRp(n) {
  if (isNaN(n)) n = 0;
  return "Rp " + Math.abs(Math.round(n)).toLocaleString("id-ID");
}
function fmtNum(n) {
  return Math.round(n).toLocaleString("id-ID");
}
function parseAmount(s) {
  return (
    parseFloat(
      String(s)
        .replace(/[^\d,]/g, "")
        .replace(",", "."),
    ) || 0
  );
}
function formatAmountInput(input) {
  const raw = input.value.replace(/[^\d]/g, "");
  input.value = raw ? parseInt(raw).toLocaleString("id-ID") : "";
}
function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatMonthLabel(m) {
  const [y, mo] = m.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return months[parseInt(mo) - 1] + " " + y.slice(2);
}
function getLast6Months() {
  const result = [];
  const d = new Date(currentMonth + "-01");
  for (let i = 5; i >= 0; i--) {
    const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    result.push(dd.toISOString().slice(0, 7));
  }
  return result;
}
function getCatColor(cat) {
  const map = {
    Makanan: "#4d9fff",
    Transport: "#00e5a0",
    Tagihan: "#ff5a7e",
    Kesehatan: "#f5c842",
    Hiburan: "#c084fc",
    Belanja: "#fb923c",
    Pendidikan: "#34d399",
    Tabungan: "#38bdf8",
    Lainnya: "#94a3b8",
  };
  return map[cat] || "#94a3b8";
}
function shortFmt(n) {
  if (n >= 1e9) return "Rp" + (n / 1e9).toFixed(1) + "M";
  if (n >= 1e6) return "Rp" + (n / 1e6).toFixed(1) + "jt";
  if (n >= 1e3) return "Rp" + (n / 1e3).toFixed(0) + "rb";
  return "Rp" + n.toFixed(0);
}
function genId() {
  return "tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function setLoading(btnId, spinnerId, loading) {
  const btn = document.getElementById(btnId);
  const sp = document.getElementById(spinnerId);
  if (btn) btn.disabled = loading;
  if (sp) sp.style.display = loading ? "inline-block" : "none";
}

// ─── TOAST ───
function toast(msg, type = "info") {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<span>${icons[type] || ""}</span><span>${msg}</span>`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => {
    el.style.animation = "slideOut 0.3s forwards";
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ─── DEMO DATA ───
function loadDemoData() {
  if (state.transactions.length > 0) return;
  const now = new Date();
  const yr = now.getFullYear(),
    mo = String(now.getMonth() + 1).padStart(2, "0");
  const demos = [];
  demos.forEach((d) =>
    state.transactions.push({
      ...d,
      id: genId(),
      timestamp: new Date().toISOString(),
    }),
  );
  saveToStorage();
}

// ─── START ───
loadDemoData();
init();
