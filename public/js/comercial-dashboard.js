/* ============================================
   COMERCIAL DASHBOARD - JAVASCRIPT v2
   ============================================ */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';

// STATE
let state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  residents: [],
  contracts: []
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
  if (!state.token || !state.user || !['comercial', 'admin'].includes(state.user.role)) {
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
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) switchPage(page);
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

    // Sincronizar item ativo da sidebar (corrige Ações Rápidas)
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === pageName);
    });
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
// MODAIS
// ============================================

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
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
      const json = await residentsRes.json();
      state.residents = json.data || [];
      displayRecentSales();
      displaySalesTable();
    }

    await loadContracts();
    updateMetrics();

  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ============================================
// CONTRATOS (API REAL)
// ============================================

async function loadContracts() {
  const contractsList = document.getElementById('contractsList');

  try {
    const res = await fetch(`${API_BASE}/contracts`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (!res.ok) throw new Error('Erro ao buscar contratos');

    const json = await res.json();
    state.contracts = json.data || [];

    if (state.contracts.length === 0) {
      contractsList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum contrato registrado. Clique em "Novo Contrato" para criar o primeiro!</p></div>';
      return;
    }

    const statusLabels = {
      'draft': 'Rascunho',
      'pending': 'Pendente',
      'active': 'Ativo',
      'signed': 'Assinado',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };

    contractsList.innerHTML = state.contracts.map(c => `
      <div class="contract-item">
        <div class="contract-info">
          <div class="contract-title">${c.contract_number || 'S/N'} — ${c.resident_name || 'Residente'}</div>
          <div class="contract-meta">
            Início: ${formatDate(c.start_date)} •
            R$ ${Number(c.monthly_fee || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}/mês
            ${c.responsible_name ? ' • Resp: ' + c.responsible_name : ''}
          </div>
        </div>
        <span class="contract-status ${c.contract_status}">
          ${statusLabels[c.contract_status] || c.contract_status}
        </span>
      </div>
    `).join('');

  } catch (error) {
    console.error('Erro ao carregar contratos:', error);
    contractsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar contratos</p></div>';
  }
}

function openNewContractModal() {
  // Popular o seletor de residentes
  const select = document.getElementById('contractResident');
  select.innerHTML = '<option value="">-- Selecione um residente --</option>' +
    state.residents.map(r => `<option value="${r.id}">${r.full_name}</option>`).join('');

  // Data de início padrão: hoje
  document.getElementById('contractStartDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('contractFee').value = '4500.00';

  document.getElementById('newContractModal').classList.add('active');
}

async function saveContract() {
  const residentId = document.getElementById('contractResident').value;
  const startDate = document.getElementById('contractStartDate').value;
  const fee = document.getElementById('contractFee').value;

  if (!residentId || !startDate || !fee) {
    alert('Preencha residente, data de início e mensalidade!');
    return;
  }

  const btn = document.getElementById('saveContractBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  try {
    const res = await fetch(`${API_BASE}/contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        resident_id: residentId,
        start_date: startDate,
        end_date: document.getElementById('contractEndDate').value || null,
        monthly_fee: parseFloat(fee),
        payment_method: document.getElementById('contractPayment').value,
        responsible_name: document.getElementById('contractResponsible').value || null,
        health_plan: document.getElementById('contractHealthPlan').value || null,
        contract_status: document.getElementById('contractStatus').value
      })
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || 'Erro ao criar contrato');
      return;
    }

    closeModal('newContractModal');
    await loadContracts();
    updateMetrics();
    alert(`✅ Contrato ${json.data.contract_number} criado com sucesso!`);

  } catch (error) {
    console.error('Erro ao salvar contrato:', error);
    alert('Erro ao salvar contrato');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Contrato';
  }
}

// ============================================
// DETALHES DO RESIDENTE (botão "Ver")
// ============================================

function viewResident(residentId) {
  const r = state.residents.find(res => res.id === residentId);
  if (!r) return;

  const contract = state.contracts.find(c => c.resident_id === residentId);

  document.getElementById('detailResidentName').textContent = r.full_name;
  document.getElementById('residentDetailBody').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <label>Data de Nascimento</label>
        <span>${formatDate(r.birth_date || r.date_of_birth)}</span>
      </div>
      <div class="detail-item">
        <label>Quarto</label>
        <span>${r.room || 'N/A'}</span>
      </div>
      <div class="detail-item">
        <label>Status</label>
        <span>${r.status === 'active' ? '🟢 Ativo' : r.status || 'N/A'}</span>
      </div>
      <div class="detail-item">
        <label>Cadastrado em</label>
        <span>${formatDate(r.created_at)}</span>
      </div>
      <div class="detail-item">
        <label>Contrato</label>
        <span>${contract ? `${contract.contract_number} (R$ ${Number(contract.monthly_fee).toLocaleString('pt-BR')}/mês)` : '❌ Sem contrato — crie um na aba Contratos'}</span>
      </div>
    </div>
  `;

  document.getElementById('residentDetailModal').classList.add('active');
}

// ============================================
// EXPORTAR CSV
// ============================================

function exportSalesCSV() {
  if (!state.residents || state.residents.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  const header = 'Nome;Data de Cadastro;Quarto;Status;Contrato;Mensalidade\n';
  const rows = state.residents.map(r => {
    const c = state.contracts.find(ct => ct.resident_id === r.id);
    return [
      r.full_name,
      formatDate(r.created_at),
      r.room || '',
      r.status || '',
      c ? c.contract_number : 'Sem contrato',
      c ? Number(c.monthly_fee).toFixed(2).replace('.', ',') : ''
    ].join(';');
  }).join('\n');

  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `vivaris-vendas-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
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
        <div class="sale-meta">Criado em ${formatDate(r.created_at)}</div>
      </div>
      <div class="sale-value">${getResidentFee(r.id)}</div>
    </div>
  `).join('');
}

// ============================================
// DISPLAY SALES TABLE
// ============================================

function displaySalesTable() {
  const tableContainer = document.getElementById('salesTableContainer');

  if (!state.residents || state.residents.length === 0) {
    tableContainer.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhuma venda registrada ainda</p></div>';
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
          ${state.residents.map(r => `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: var(--space-4);">${r.full_name}</td>
              <td style="padding: var(--space-4);">${formatDate(r.created_at)}</td>
              <td style="padding: var(--space-4);">${getResidentFee(r.id)}</td>
              <td style="padding: var(--space-4);">
                <span style="display: inline-block; padding: 4px 8px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 4px; font-size: 12px; font-weight: 600;">
                  ${r.status === 'active' ? 'Ativo' : (r.status || 'Ativo')}
                </span>
              </td>
              <td style="padding: var(--space-4);">
                <button class="btn btn-sm btn-secondary" onclick="viewResident('${r.id}')">
                  <i class="fas fa-eye"></i> Ver
                </button>
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

  // Receita real: soma das mensalidades dos contratos
  const monthlyRevenue = state.contracts.reduce((sum, c) => sum + Number(c.monthly_fee || 0), 0);
  document.getElementById('metricRevenue').textContent = monthlyRevenue > 0
    ? `R$ ${(monthlyRevenue / 1000).toFixed(1)}K`
    : 'R$ 0';

  // Taxa de conversão real: contratos ÷ residentes
  const conversion = state.residents.length > 0
    ? Math.round((state.contracts.length / state.residents.length) * 100)
    : 0;
  document.getElementById('metricConversion').textContent = conversion + '%';

  document.getElementById('metricContacts').textContent = state.contracts.length;
}

// ============================================
// HELPERS
// ============================================

function getResidentFee(residentId) {
  const c = state.contracts.find(ct => ct.resident_id === residentId);
  return c ? `R$ ${Number(c.monthly_fee).toLocaleString('pt-BR')}/mês` : '—';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR');
}
