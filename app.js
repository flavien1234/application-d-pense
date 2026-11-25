'use strict';

const STORAGE_KEY = 'mes-depenses-v1';

const CATEGORIES = [
  { id: 'courses',    name: 'Courses',     emoji: '🛒', color: '#16a34a' },
  { id: 'restaurant', name: 'Restaurant',  emoji: '🍽️', color: '#ea580c' },
  { id: 'transport',  name: 'Transport',   emoji: '🚗', color: '#2563eb' },
  { id: 'logement',   name: 'Logement',    emoji: '🏠', color: '#7c3aed' },
  { id: 'factures',   name: 'Factures',    emoji: '💡', color: '#ca8a04' },
  { id: 'sante',      name: 'Santé',       emoji: '💊', color: '#db2777' },
  { id: 'loisirs',    name: 'Loisirs',     emoji: '🎉', color: '#0891b2' },
  { id: 'shopping',   name: 'Shopping',    emoji: '🛍️', color: '#c026d3' },
  { id: 'abonnements',name: 'Abonnements', emoji: '📱', color: '#4f46e5' },
  { id: 'enfants',    name: 'Enfants',     emoji: '🧸', color: '#f59e0b' },
  { id: 'cadeaux',    name: 'Cadeaux',     emoji: '🎁', color: '#dc2626' },
  { id: 'autre',      name: 'Autre',       emoji: '📦', color: '#64748b' },
];
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// ---------- State ----------
let state = load();
const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth(); // 0-11
let editingId = null;
let selectedCat = 'courses';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { expenses: Array.isArray(s.expenses) ? s.expenses : [], budget: s.budget ?? null };
    }
  } catch (e) { /* ignore */ }
  return { expenses: [], budget: null };
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Impossible d’enregistrer sur cet appareil'); }
}

// ---------- Helpers ----------
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
const parseAmount = str => {
  const n = parseFloat(String(str).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dateFromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

function monthExpenses(y, m) {
  const key = monthKey(y, m);
  return state.expenses.filter(e => e.date.startsWith(key));
}

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- Render ----------
function render() {
  const label = monthFmt.format(new Date(viewYear, viewMonth, 1));
  $('monthLabel').textContent = label;

  const items = monthExpenses(viewYear, viewMonth);
  const total = items.reduce((s, e) => s + e.amount, 0);
  $('monthTotal').textContent = eur.format(total);

  // Comparison with previous month
  const pm = viewMonth === 0 ? 11 : viewMonth - 1;
  const py = viewMonth === 0 ? viewYear - 1 : viewYear;
  const prevTotal = monthExpenses(py, pm).reduce((s, e) => s + e.amount, 0);
  let sub = `${items.length} dépense${items.length > 1 ? 's' : ''}`;
  if (prevTotal > 0) {
    const diff = total - prevTotal;
    const pct = Math.round((diff / prevTotal) * 100);
    sub += ` · ${diff >= 0 ? '+' : ''}${pct} % vs mois précédent`;
  }
  $('monthSub').textContent = sub;

  // Budget
  const fill = $('budgetFill');
  fill.classList.remove('warn', 'over');
  if (state.budget) {
    const ratio = total / state.budget;
    fill.style.width = Math.min(100, ratio * 100) + '%';
    if (ratio > 1) fill.classList.add('over'); else if (ratio > 0.8) fill.classList.add('warn');
    const left = state.budget - total;
    $('budgetText').textContent = left >= 0
      ? `Reste ${eur.format(left)} sur ${eur.format(state.budget)}`
      : `Dépassement de ${eur.format(-left)} (budget ${eur.format(state.budget)})`;
  } else {
    fill.style.width = '0';
    $('budgetText').textContent = 'Aucun budget défini';
  }

  // Categories
  const byCat = {};
  items.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;
  $('categoryList').innerHTML = cats.map(([id, amt]) => {
    const c = CAT_BY_ID[id] || CAT_BY_ID.autre;
    const pct = total ? Math.round(amt / total * 100) : 0;
    return `<li class="cat-row" data-cat="${c.id}">
      <span class="cat-emoji">${c.emoji}</span>
      <span class="cat-name">${c.name}<span class="cat-pct">${pct} %</span></span>
      <span class="cat-amount">${eur.format(amt)}</span>
      <div class="cat-bar"><div style="width:${(amt / max) * 100}%;background:${c.color}"></div></div>
    </li>`;
  }).join('');
  $('catEmpty').hidden = cats.length > 0;

  // Filter select
  const filter = $('filterCat');
  const current = filter.value;
  filter.innerHTML = '<option value="">Toutes</option>' +
    cats.map(([id]) => `<option value="${id}">${CAT_BY_ID[id]?.name || id}</option>`).join('');
  filter.value = cats.some(([id]) => id === current) ? current : '';

  // Expense list grouped by day
  const shown = items
    .filter(e => !filter.value || e.category === filter.value)
    .sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
  const groups = new Map();
  shown.forEach(e => { if (!groups.has(e.date)) groups.set(e.date, []); groups.get(e.date).push(e); });
  $('expenseList').innerHTML = [...groups].map(([date, list]) => {
    const dayTotal = list.reduce((s, e) => s + e.amount, 0);
    return `<div class="day-group">
      <h4><span>${dayFmt.format(dateFromIso(date))}</span><span>${eur.format(dayTotal)}</span></h4>
      ${list.map(e => {
        const c = CAT_BY_ID[e.category] || CAT_BY_ID.autre;
        return `<button class="exp-item" data-id="${e.id}">
          <span class="exp-icon" style="background:${c.color}22">${c.emoji}</span>
          <span class="exp-main">
            <div class="exp-title">${escapeHtml(e.note || c.name)}</div>
            <div class="exp-cat">${c.name}</div>
          </span>
          <span class="exp-amount">${eur.format(e.amount)}</span>
        </button>`;
      }).join('')}
    </div>`;
  }).join('');
  $('listEmpty').hidden = shown.length > 0;
}

// ---------- Expense dialog ----------
function renderCatPicker() {
  $('catPicker').innerHTML = CATEGORIES.map(c =>
    `<button type="button" class="cat-chip" data-cat="${c.id}" aria-pressed="${c.id === selectedCat}">
      <span>${c.emoji}</span><span>${c.name}</span></button>`).join('');
}

function openExpense(exp) {
  editingId = exp ? exp.id : null;
  $('dialogTitle').textContent = exp ? 'Modifier la dépense' : 'Nouvelle dépense';
  $('fAmount').value = exp ? String(exp.amount).replace('.', ',') : '';
  $('fNote').value = exp ? exp.note || '' : '';
  // Default date: today if viewing current month, else 1st of viewed month
  let d = today;
  if (viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) d = new Date(viewYear, viewMonth, 1);
  $('fDate').value = exp ? exp.date : isoDate(d);
  selectedCat = exp ? exp.category : selectedCat;
  renderCatPicker();
  $('deleteBtn').hidden = !exp;
  $('expenseDialog').showModal();
  if (!exp) setTimeout(() => $('fAmount').focus(), 50);
}

$('catPicker').addEventListener('click', e => {
  const chip = e.target.closest('.cat-chip');
  if (!chip) return;
  selectedCat = chip.dataset.cat;
  renderCatPicker();
});

$('expenseForm').addEventListener('submit', e => {
  e.preventDefault();
  const amount = parseAmount($('fAmount').value);
  if (!(amount > 0)) { toast('Entrez un montant valide'); $('fAmount').focus(); return; }
  const date = $('fDate').value;
  if (!date) { toast('Choisissez une date'); return; }
  const data = { amount, category: selectedCat, note: $('fNote').value.trim(), date };
  if (editingId) {
    const exp = state.expenses.find(x => x.id === editingId);
    Object.assign(exp, data);
    toast('Dépense modifiée');
  } else {
    state.expenses.push({ id: uid(), created: Date.now(), ...data });
    toast('Dépense ajoutée');
  }
  save();
  // Jump to the month of the expense
  const d = dateFromIso(date);
  viewYear = d.getFullYear(); viewMonth = d.getMonth();
  $('expenseDialog').close();
  render();
});

$('deleteBtn').addEventListener('click', () => {
  if (!editingId || !confirm('Supprimer cette dépense ?')) return;
  state.expenses = state.expenses.filter(x => x.id !== editingId);
  save();
  $('expenseDialog').close();
  toast('Dépense supprimée');
  render();
});
$('cancelBtn').addEventListener('click', () => $('expenseDialog').close());

$('expenseList').addEventListener('click', e => {
  const item = e.target.closest('.exp-item');
  if (!item) return;
  const exp = state.expenses.find(x => x.id === item.dataset.id);
  if (exp) openExpense(exp);
});
$('categoryList').addEventListener('click', e => {
  const row = e.target.closest('.cat-row');
  if (!row) return;
  const f = $('filterCat');
  f.value = f.value === row.dataset.cat ? '' : row.dataset.cat;
  render();
  if (window.innerWidth < 768) document.querySelector('.expenses').scrollIntoView({ behavior: 'smooth' });
});
$('filterCat').addEventListener('change', render);
$('addBtn').addEventListener('click', () => openExpense(null));

// ---------- Month navigation ----------
function shiftMonth(delta) {
  viewMonth += delta;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  $('filterCat').value = '';
  render();
}
$('prevMonth').addEventListener('click', () => shiftMonth(-1));
$('nextMonth').addEventListener('click', () => shiftMonth(1));

// Swipe left/right on main area to change month
let touchX = null, touchY = null;
document.querySelector('.layout').addEventListener('touchstart', e => {
  touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
}, { passive: true });
document.querySelector('.layout').addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) shiftMonth(dx < 0 ? 1 : -1);
  touchX = null;
}, { passive: true });

// ---------- Budget ----------
$('editBudget').addEventListener('click', () => {
  $('fBudget').value = state.budget ? String(state.budget).replace('.', ',') : '';
  $('budgetDialog').showModal();
});
$('budgetCancel').addEventListener('click', () => $('budgetDialog').close());
$('budgetForm').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('fBudget').value.trim();
  if (!v) state.budget = null;
  else {
    const n = parseAmount(v);
    if (!(n > 0)) { toast('Montant invalide'); return; }
    state.budget = n;
  }
  save();
  $('budgetDialog').close();
  render();
});

// ---------- Export / Import ----------
function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const file = new File([blob], filename, { type });
  // On iOS, the share sheet lets the user save to Files / AirDrop to iPad
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: filename }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

$('exportBtn').addEventListener('click', () => {
  download(`depenses-${isoDate(new Date())}.json`, JSON.stringify(state, null, 2), 'application/json');
});

$('csvBtn').addEventListener('click', () => {
  const rows = [['Date', 'Catégorie', 'Description', 'Montant']];
  [...state.expenses].sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
    rows.push([e.date, CAT_BY_ID[e.category]?.name || e.category, e.note || '', String(e.amount).replace('.', ',')]);
  });
  const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
  download(`depenses-${isoDate(new Date())}.csv`, csv, 'text/csv');
});

$('importInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.expenses)) throw new Error('format');
    const valid = data.expenses.filter(x => x && x.id && typeof x.amount === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(x.date));
    const existing = new Set(state.expenses.map(x => x.id));
    const added = valid.filter(x => !existing.has(x.id));
    state.expenses.push(...added.map(x => ({
      id: String(x.id), created: Number(x.created) || Date.now(), amount: x.amount,
      category: CAT_BY_ID[x.category] ? x.category : 'autre', note: String(x.note || '').slice(0, 80), date: x.date,
    })));
    if (data.budget && !state.budget) state.budget = Number(data.budget) || null;
    save();
    render();
    toast(`${added.length} dépense${added.length > 1 ? 's' : ''} importée${added.length > 1 ? 's' : ''}`);
  } catch (err) {
    toast('Fichier invalide');
  }
});

// ---------- Init ----------
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
