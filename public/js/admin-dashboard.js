/* ============================================
   ADMIN DASHBOARD - JAVASCRIPT
   ============================================ */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://vivaris-care-production.up.railway.app/api';

// STATE
let state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  residents: [],
  users: []
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
  if (!state.token || !state.user || state.user.role !== 'admin') {
    window.location.href = '/';
    return;
  }

  setupUser();
  setupNavigation();
  setupLogout();
  loadAdminData();
});

// ============================================
// SETUP USER
// ============================================

function setupUser() {
  document.getElementById('userName').textContent = state.user.full_name;
  document.getElementById('userAvatar').textContent = state.user.full_name.charAt(0).toUpperCase();
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (item.classList.contains('logout-btn')) return;
      
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        switchPage(page);
        
        // Remove active de todos
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

function switchPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.admin-page').forEach(page => {
    page.classList.remove('active');
  });

  // Show selected page
  const page = document.getElementById(`page-${pageName}`);
  if (page) {
    page.classList.add('active');

    // Update title
    const titles = {
      'dashboard': 'Dashboard',
      'residents': 'Gestão de Residentes',
      'users': 'Gestão de Usuários',
      'pricing': 'Preços & Pacotes',
      'units': 'Unidades',
      'reports': 'Relatórios',
      'audit-log': 'Audit Trail'
    };

    document.getElementById('pageTitle').textContent = titles[pageName] || 'VIVARIS CARE';
  }
}

// ============================================
// LOGOUT
// ============================================

function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });
}

// ============================================
// LOAD DATA
// ============================================

async function loadAdminData() {
  try {
    // Load residents
    const residentsRes = await fetch(`${API_BASE}/residents`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    if (residentsRes.ok) {
      state.residents = await residentsRes.ok;
      displayResidents();
      updateStats();
    }

    // Load users (simulated)
    loadUsers();

  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ============================================
// DISPLAY RESIDENTS
// ============================================

function displayResidents() {
  const list = document.getElementById('adminResidentsList');
  const table = document.getElementById('adminResidentsTable');

  if (!state.residents || state.residents.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum residente cadastrado</p></div>';
    table.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum residente encontrado</p></div>';
    return;
  }

  // Home list (últimos 5)
  const homeResidents = state.residents.slice(0, 5);
  list.innerHTML = homeResidents.map(r => `
    <div class="resident-item">
      <div class="resident-info">
        <div class="resident-name">${r.full_name}</div>
        <div class="resident-meta">Quarto ${r.room} • Criado em ${new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
      </div>
      <span class="resident-status">${r.status === 'active' ? 'Ativo' : 'Inativo'}</span>
    </div>
  `).join('');

  // Table (todos)
  table.innerHTML = `
    <div style="overflow-x: auto;">
      <table style="width: 100%;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color);">
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Nome</th>
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Quarto</th>
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Data Nasc.</th>
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Status</th>
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${state.residents.map(r => `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: var(--space-4);">${r.full_name}</td>
              <td style="padding: var(--space-4);">${r.room || 'N/A'}</td>
              <td style="padding: var(--space-4);">${new Date(r.birth_date).toLocaleDateString('pt-BR')}</td>
              <td style="padding: var(--space-4);"><span class="resident-status">${r.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
              <td style="padding: var(--space-4);">
                <button class="btn btn-sm btn-secondary" style="margin-right: var(--space-2);">Editar</button>
                <button class="btn btn-sm btn-danger">Deletar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================
// UPDATE STATS
// ============================================

function updateStats() {
  document.getElementById('statResidents').textContent = state.residents.length;
  
  // Calcular receita (estimado)
  const monthlyRevenue = state.residents.length * 4500; // 4.5K por residente
  document.getElementById('statRevenue').textContent = `R$ ${(monthlyRevenue / 1000).toFixed(1)}K`;
}

// ============================================
// LOAD USERS (Simulated)
// ============================================

function loadUsers() {
  const usersData = [
    { id: 1, name: 'Admin Master', email: 'admin@vivaris.test', role: 'admin', unit: 'BSL Saúde', status: 'online' },
    { id: 2, name: 'João Comercial', email: 'comercial@vivaris.test', role: 'comercial', unit: 'BSL Saúde', status: 'online' },
    { id: 3, name: 'Maria Assistencial', email: 'maria@vivaris.test', role: 'assistencial', unit: 'BSL Saúde', status: 'offline' },
    { id: 4, name: 'Silva Assistencial', email: 'silva@vivaris.test', role: 'assistencial', unit: 'BSL Saúde', status: 'online' },
    { id: 5, name: 'Familiar Test', email: 'familiar@vivaris.test', role: 'familiar', unit: 'BSL Saúde', status: 'offline' }
  ];

  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = usersData.map(u => `
    <tr>
      <td style="padding: var(--space-4);">${u.name}</td>
      <td style="padding: var(--space-4);">${u.email}</td>
      <td style="padding: var(--space-4);">
        <span style="padding: 4px 8px; background: rgba(251, 191, 36, 0.1); color: #f59e0b; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}
        </span>
      </td>
      <td style="padding: var(--space-4);">${u.unit}</td>
      <td style="padding: var(--space-4);">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          <i class="fas fa-circle" style="font-size: 8px; color: ${u.status === 'online' ? '#10b981' : '#9ca3af'};"></i>
          ${u.status === 'online' ? 'Online' : 'Offline'}
        </span>
      </td>
      <td style="padding: var(--space-4);">
        <button class="btn btn-sm btn-secondary">Editar</button>
      </td>
    </tr>
  `).join('');
}
