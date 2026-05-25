/* ============================================
   COMERCIAL DASHBOARD - JAVASCRIPT
   ============================================ */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://vivaris-care-production.up.railway.app/api';

// STATE
let state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  residents: [],
  contracts: []
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
  if (!state.token || !state.user || state.user.role !== 'comercial') {
    window.location.href = '/';
    return;
  }

  setupUser();
  setupNavigation();
  setupLogout();
  loadComercialData();
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
        
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

function switchPage(pageName) {
  document.querySelectorAll('.comercial-page').forEach(page => {
    page.classList.remove('active');
  });

  const page = document.getElementById(`page-${pageName}`);
  if (page) {
    page.classList.add('active');

    const titles = {
      'dashboard': 'Dashboard de Vendas',
      'new-resident': 'Cadastrar Novo Residente',
      'sales-history': 'Histórico de Vendas',
      'contracts': 'Contratos'
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

async function loadComercialData() {
  try {
    const residentsRes = await fetch(`${API_BASE}/residents`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    if (residentsRes.ok) {
      state.residents = await residentsRes.json();
      displayRecentSales();
      displaySalesTable();
      updateMetrics();
    }

    loadContracts();

  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ============================================
// DISPLAY RECENT SALES
// ============================================

function displayRecentSales() {
  const list = document.getElementById('recentSalesList');

  if (!state.residents || state.residents.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma venda registrada</p></div>';
    return;
  }

  const recentSales = state.residents.slice(0, 5);
  list.innerHTML = recentSales.map(r => `
    <div class="sale-item">
      <div class="sale-info">
        <div class="sale-name">${r.full_name}</div>
        <div class="sale-meta">Criado em ${new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="sale-value">R$ 4.500/mês</div>
    </div>
  `).join('');
}

// ============================================
// DISPLAY SALES TABLE
// ============================================

function displaySalesTable() {
  const tableContainer = document.getElementById('salesTableContainer');

  if (!state.residents || state.residents.length === 0) {
    tableContainer.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma venda registrada</p></div>';
    return;
  }

  tableContainer.innerHTML = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color);">
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Nome do Residente</th>
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Data de Venda</th>
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Custo Mensal</th>
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Status</th>
            <th style="padding: var(--space-4); text-align: left; font-weight: 600;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${state.residents.map((r, idx) => `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: var(--space-4);">${r.full_name}</td>
              <td style="padding: var(--space-4);">${new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
              <td style="padding: var(--space-4);">R$ 4.500</td>
              <td style="padding: var(--space-4);">
                <span style="display: inline-block; padding: 4px 8px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 4px; font-size: 12px; font-weight: 600;">
                  Ativo
                </span>
              </td>
              <td style="padding: var(--space-4);">
                <button class="btn btn-sm btn-secondary" style="margin-right: var(--space-2);">Ver</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================
// UPDATE METRICS
// ============================================

function updateMetrics() {
  document.getElementById('metricSold').textContent = state.residents.length;
  
  const monthlyRevenue = state.residents.length * 4500;
  document.getElementById('metricRevenue').textContent = `R$ ${(monthlyRevenue / 1000).toFixed(1)}K`;
  
  // Taxa de conversão (simulado)
  const conversion = state.residents.length > 0 ? 85 : 0;
  document.getElementById('metricConversion').textContent = conversion + '%';
  
  // Contatos em andamento (simulado)
  document.getElementById('metricContacts').textContent = Math.max(0, state.residents.length);
}

// ============================================
// LOAD CONTRACTS
// ============================================

function loadContracts() {
  const contractsList = document.getElementById('contractsList');

  // Simular contratos baseado em residentes
  if (!state.residents || state.residents.length === 0) {
    contractsList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum contrato registrado</p></div>';
    return;
  }

  const contracts = state.residents.map((r, idx) => ({
    id: idx + 1,
    resident: r.full_name,
    status: idx % 3 === 0 ? 'draft' : idx % 3 === 1 ? 'pending' : 'signed',
    date: new Date(r.created_at).toLocaleDateString('pt-BR')
  }));

  contractsList.innerHTML = contracts.map(c => `
    <div class="contract-item">
      <div class="contract-info">
        <div class="contract-title">Contrato - ${c.resident}</div>
        <div class="contract-meta">Criado em ${c.date}</div>
      </div>
      <span class="contract-status ${c.status}">
        ${c.status === 'draft' ? 'Rascunho' : c.status === 'pending' ? 'Pendente' : 'Assinado'}
      </span>
    </div>
  `).join('');
}
