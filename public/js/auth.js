// ============================================
// AUTH - Login com redirecionamento por perfil
// ============================================

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : `${window.location.protocol}//${window.location.hostname}/api`;

// INIT
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

// LOGIN
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const pin = document.getElementById('pin').value;

  if (!email || !pin) {
    showError('Email e PIN são obrigatórios!');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || 'Erro ao fazer login');
      showLoading(false);
      return;
    }

    // Salvar no localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // REDIRECIONAR por perfil
    const role = data.user.role;
    let dashboardUrl = '/html/dashboard.html';

    switch(role) {
      case 'admin':
        dashboardUrl = '/html/admin-dashboard.html';
        break;
      case 'comercial':
        dashboardUrl = '/html/comercial-dashboard.html';
        break;
      case 'assistencial':
        dashboardUrl = '/html/assistencial-dashboard.html';
        break;
      case 'familiar':
        dashboardUrl = '/html/familiar-dashboard.html';
        break;
    }

    window.location.href = dashboardUrl;

  } catch (error) {
    console.error('Erro:', error);
    showError('Erro ao conectar com servidor');
    showLoading(false);
  }
}

// HELPERS
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  errorText.textContent = message;
  errorDiv.classList.remove('hidden');
}

function showLoading(show) {
  const loading = document.getElementById('loadingState');
  const button = document.getElementById('submitBtn');
  
  if (show) {
    loading.classList.remove('hidden');
    button.disabled = true;
  } else {
    loading.classList.add('hidden');
    button.disabled = false;
  }
}

// LOGOUT
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// VERIFICAR se está autenticado
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
  }
}
