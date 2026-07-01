import { auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

const $ = s => document.querySelector(s);

const loginView = $('#loginView');
const homeView = $('#homeView');
const loginForm = $('#loginForm');
const email = $('#email');
const password = $('#password');
const loginMsg = $('#loginMsg');
const statusText = $('#statusText');
const logoutBtn = $('#logoutBtn');

function showLogin(msg = '') {
  loginView.classList.remove('hidden');
  homeView.classList.add('hidden');
  loginMsg.textContent = msg;
}

function showHome(text = 'Connecté') {
  loginView.classList.add('hidden');
  homeView.classList.remove('hidden');
  statusText.textContent = text;
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginMsg.textContent = 'Connexion en cours...';

  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    loginMsg.textContent = 'Connexion réussie.';
  } catch (err) {
    showLogin(err.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, user => {
  if (user) {
    showHome(`Connecté: ${user.email || 'utilisateur'}`);
  } else {
    showLogin('');
  }
});
