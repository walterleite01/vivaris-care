const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://vivaris-care-production.up.railway.app/api';

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.init();
  }

  init() {
    const form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', (e) => this.handleLogin(e));
    const demoCards = document.querySelectorAll('.demo-card');
    demoCards.forEach(card => card.addEventListener('click', () => this.populateDemoCredentials(card)));
    if (this.token && this.user) this.redirectToDashboard();
  }

  handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pin = document.getElementById('pin').value;
    this.showLoading();
    this.hideError();
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao fazer login');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      this.token = data.token;
      this.user = data.user;
      setTimeout(() => this.redirectToDashboard(), 500);
    } catch (error) {
      console.error('Login error:', error);
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitText').textContent = 'Autenticando...';
  }

  hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitText').textContent = 'Entrar no Sistema';
  }

  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    document.getElementById('errorText').textContent = message;
    errorDiv.classList.remove('hidden');
  }

  hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
  }

  populateDemoCredentials(card) {
    const text = card.innerText;
    const lines = text.split('\n');
    if (lines[1]) document.getElementById('email').value = lines[1].trim();
    if (lines[2]) {
      const pin = lines[2].trim().replace('PIN: ', '');
      document.getElementById('pin').value = pin;
    }
    document.getElementById('pin').focus();
  }

  redirectToDashboard() {
    window.location.href = '/html/dashboard.html';
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AuthManager();
});
