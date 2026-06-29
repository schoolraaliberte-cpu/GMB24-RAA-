import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, orderBy, limit, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const $ = s => document.querySelector(s);

const state = {
  user: null,
  profile: null,
  settings: null,
  sales: [],
  admin: false,
  ready: false
};

const uid = () => state.user?.uid || null;
const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);
const fmt = n => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0)));

const refs = {
  connState: $('#connState'),
  logoutBtn: $('#logoutBtn'),
  loginView: $('#loginView'),
  homeView: $('#homeView'),
  loginForm: $('#loginForm'),
  email: $('#email'),
  password: $('#password'),
  loginMsg: $('#loginMsg'),
  welcomeTitle: $('#welcomeTitle'),
  welcomeText: $('#welcomeText'),
  trialBadge: $('#trialBadge'),
  todaySales: $('#todaySales'),
  monthSales: $('#monthSales'),
  monthProfit: $('#monthProfit'),
  stockRemaining: $('#stockRemaining'),
  saleProduct: $('#saleProduct'),
  saleQty: $('#saleQty'),
  salePrice: $('#salePrice'),
  saveSaleBtn: $('#saveSaleBtn'),
  taxRegime: $('#taxRegime'),
  vatEnabled: $('#vatEnabled'),
  vatRate: $('#vatRate'),
  taxRate: $('#taxRate'),
  saveSettingsBtn: $('#saveSettingsBtn'),
  adminUsersCount: $('#adminUsersCount'),
  adminLicensesCount: $('#adminLicensesCount'),
  adminPaymentsCount: $('#adminPaymentsCount'),
  genLicenseBtn: $('#genLicenseBtn'),
  licenseOutput: $('#licenseOutput'),
  monthlyRevenue: $('#monthlyRevenue'),
  monthlyExpenses: $('#monthlyExpenses'),
  monthlyTax: $('#monthlyTax'),
  pdfBtn: $('#pdfBtn'),
  salesList: $('#salesList')
};

async function ensureUserDoc(user) {
  const uref = doc(db, 'users', user.uid);
  const snap = await getDoc(uref);

  if (!snap.exists()) {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);

    await setDoc(uref, {
      displayName: user.email?.split('@')[0] || 'Client',
      email: user.email || '',
      phone: '',
      role: 'client',
      status: 'active',
      shopId: '',
      trialStart: Timestamp.fromDate(now),
      trialEnd: Timestamp.fromDate(trialEnd),
      subscriptionActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  return (await getDoc(uref)).data();
}

async function loadSettings() {
  const sref = doc(db, 'settings', uid());
  const snap = await getDoc(sref);

  if (snap.exists()) return snap.data();

  const defaults = {
    taxRegime: 'reel_sans_tva',
    vatEnabled: false,
    vatRate: 0,
    taxRate: 0,
    businessName: '',
    paymentPhones: ['+22870346852', '+22896766875'],
    confirmPhone: '+22870346852',
    updatedAt: serverTimestamp()
  };

  await setDoc(sref, defaults, { merge: true });
  return defaults;
}

async function loadSales() {
  const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function calc() {
  const sales = state.sales.filter(s => (s.dateKey || '').startsWith(monthKey()));
  const today = sales.filter(s => s.dateKey === todayKey());
  const revenue = sales.reduce((a, s) => a + Number(s.total || 0), 0);
  const expenses = sales.reduce((a, s) => a + Number(s.expense || 0), 0);
  const profit = revenue - expenses;
  const taxRate = Number(state.settings?.taxRate || 0) / 100;
  const vatRate = Number(state.settings?.vatRate || 0) / 100;
  const vat = state.settings?.vatEnabled ? revenue * vatRate : 0;
  const tax = Math.max(0, profit * taxRate) + vat;

  return {
    todayCount: today.length,
    monthCount: sales.length,
    revenue,
    expenses,
    profit,
    tax
  };
}

function renderSales() {
  refs.salesList.innerHTML =
    state.sales.slice(0, 20).map(s =>
      `<div class="sale"><div><strong>${s.product || 'Vente'}</strong><div class="subtle">${s.dateKey || ''} · qté ${s.qty || 0}</div></div><div><strong>${fmt(s.total || 0)}</strong></div></div>`
    ).join('') || '<p class="muted">Aucune vente pour le moment.</p>';
}

function render() {
  const c = calc();

  refs.connState.textContent = navigator.onLine ? 'En ligne' : 'Hors connexion';
  refs.welcomeTitle.textContent = `Bonjour ${state.profile?.displayName || state.user?.email || ''}`;
  refs.welcomeText.textContent = `Régime: ${state.settings?.taxRegime || '---'} | TVA: ${state.settings?.vatEnabled ? 'Oui' : 'Non'}`;

  const trialEnd = state.profile?.trialEnd?.toDate ? state.profile.trialEnd.toDate() : null;
  refs.trialBadge.textContent = trialEnd ? `Essai expire le ${trialEnd.toLocaleDateString('fr-FR')}` : 'Essai: --';

  refs.todaySales.textContent = fmt(c.todayCount);
  refs.monthSales.textContent = fmt(c.monthCount);
  refs.monthProfit.textContent = fmt(c.profit);
  refs.stockRemaining.textContent = fmt(state.profile?.stockRemaining || 0);
  refs.monthlyRevenue.textContent = fmt(c.revenue);
  refs.monthlyExpenses.textContent = fmt(c.expenses);
  refs.monthlyTax.textContent = fmt(c.tax);

  if (state.settings) {
    refs.taxRegime.value = state.settings.taxRegime || 'reel_sans_tva';
    refs.vatEnabled.value = String(!!state.settings.vatEnabled);
    refs.vatRate.value = Number(state.settings.vatRate || 0);
    refs.taxRate.value = Number(state.settings.taxRate || 0);
  }

  refs.homeView.classList.toggle('hidden', !state.user);
  refs.loginView.classList.toggle('hidden', !!state.user);
  refs.logoutBtn.classList.toggle('hidden', !state.user);

  refs.adminUsersCount.textContent = fmt(window._adminUsersCount || 0);
  refs.adminLicensesCount.textContent = fmt(window._adminLicensesCount || 0);
  refs.adminPaymentsCount.textContent = fmt(window._adminPaymentsCount || 0);

  renderSales();
}

async function refreshAdminCounts() {
  const [u, l, p] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'licenses')),
    getDocs(collection(db, 'payments'))
  ]);

  window._adminUsersCount = u.size;
  window._adminLicensesCount = l.size;
  window._adminPaymentsCount = p.size;
}

async function bootUser(user) {
  state.user = user;
  state.profile = await ensureUserDoc(user);
  state.settings = await loadSettings();
  state.sales = await loadSales();
  state.admin = state.profile?.role === 'admin';

  if (state.admin) await refreshAdminCounts();
  state.ready = true;
  refs.loginMsg.textContent = '';
  render();
}

refs.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  refs.loginMsg.textContent = 'Connexion en cours...';

  try {
    await signInWithEmailAndPassword(auth, refs.email.value.trim(), refs.password.value);
    refs.loginMsg.textContent = 'Connexion réussie.';
  } catch (error) {
    refs.loginMsg.textContent = error.message;
  }
});

refs.logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

refs.saveSettingsBtn.addEventListener('click', async () => {
  if (!uid()) return;

  const payload = {
    taxRegime: refs.taxRegime.value,
    vatEnabled: refs.vatEnabled.value === 'true',
    vatRate: Number(refs.vatRate.value || 0),
    taxRate: Number(refs.taxRate.value || 0),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'settings', uid()), payload, { merge: true });
  state.settings = { ...(state.settings || {}), ...payload };
  render();
});

refs.saveSaleBtn.addEventListener('click', async () => {
  if (!uid()) return;

  const qty = Number(refs.saleQty.value || 0);
  const price = Number(refs.salePrice.value || 0);

  if (!refs.saleProduct.value.trim() || qty <= 0) return;

  await addDoc(collection(db, 'sales'), {
    uid: uid(),
    shopId: state.profile?.shopId || '',
    product: refs.saleProduct.value.trim(),
    qty,
    unitPrice: price,
    total: qty * price,
    expense: 0,
    dateKey: todayKey(),
    monthKey: monthKey(),
    createdAt: serverTimestamp()
  });

  refs.saleProduct.value = '';
  refs.saleQty.value = 1;
  refs.salePrice.value = 0;

  state.sales = await loadSales();
  render();
});

refs.genLicenseBtn.addEventListener('click', async () => {
  const code = `LIC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const now = new Date();
  const ex = new Date(now);
  ex.setDate(ex.getDate() + 30);

  await addDoc(collection(db, 'licenses'), {
    code,
    clientUid: uid() || '',
    shopId: state.profile?.shopId || '',
    activated: false,
    issuedAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(ex),
    createdAt: serverTimestamp()
  });

  refs.licenseOutput.textContent = code;

  if (state.admin) {
    await refreshAdminCounts();
    render();
  }
});

refs.pdfBtn.addEventListener('click', () => window.print());

window.addEventListener('online', render);
window.addEventListener('offline', render);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

onAuthStateChanged(auth, async user => {
  if (user) {
    await bootUser(user);
  } else {
    state.user = null;
    state.profile = null;
    state.settings = null;
    state.sales = [];
    state.admin = false;
    state.ready = true;
    render();
  }
});

render();
