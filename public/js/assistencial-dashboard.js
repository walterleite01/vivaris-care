/* ============================================
   ASSISTENCIAL DASHBOARD - JAVASCRIPT
   ============================================ */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://vivaris-care-production.up.railway.app/api';

// STATE
let state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  residents: [],
  selectedResident: null
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
  if (!state.token || !state.user || state.user.role !== 'assistencial') {
    window.location.href = '/';
    return;
  }

  setupUser();
  setupNavigation();
  setupLogout();
  setupDetailTabs();
  loadAssistencialData();
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
  document.querySelectorAll('.assistencial-page').forEach(page => {
    page.classList.remove('active');
  });

  const page = document.getElementById(`page-${pageName}`);
  if (page) {
    page.classList.add('active');

    const titles = {
      'dashboard': 'Dashboard',
      'residents': 'Residentes',
      'activities': 'Atividades Diárias',
      'chat': 'Chat em Tempo Real'
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

async function loadAssistencialData() {
  try {
    const residentsRes = await fetch(`${API_BASE}/residents`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    if (residentsRes.ok) {
      state.residents = await residentsRes.json();
      displayDashboardResidents();
      displayResidentsGrid();
      displayRecentActivities();
      updateStats();
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ============================================
// DISPLAY DASHBOARD RESIDENTS
// ============================================

function displayDashboardResidents() {
  const list = document.getElementById('dashboardResidentsList');

  if (!state.residents || state.residents.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum residente disponível</p></div>';
    return;
  }

  list.innerHTML = state.residents.slice(0, 5).map(r => `
    <div class="resident-card" style="padding: var(--space-4); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); cursor: pointer; transition: all var(--transition-fast);" onclick="openResidentDetail('${r.id}')">
      <div style="font-weight: var(--font-weight-semibold); color: var(--text-primary); margin-bottom: var(--space-1);">${r.full_name}</div>
      <div style="font-size: var(--text-sm); color: var(--text-tertiary);">
        <i class="fas fa-birthday-cake"></i> ${new Date(r.birth_date).toLocaleDateString('pt-BR')}
      </div>
    </div>
  `).join('');
}

// ============================================
// DISPLAY RESIDENTS GRID
// ============================================

function displayResidentsGrid() {
  const grid = document.getElementById('residentsList');

  if (!state.residents || state.residents.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum residente encontrado</p></div>';
    return;
  }

  grid.innerHTML = state.residents.map(r => `
    <div class="resident-card" onclick="openResidentDetail('${r.id}')" style="cursor: pointer;">
      <div class="resident-avatar">${r.full_name.charAt(0).toUpperCase()}</div>
      <div class="resident-name">${r.full_name}</div>
      <div class="resident-meta">
        <strong>Data de Nasc.:</strong> ${new Date(r.birth_date).toLocaleDateString('pt-BR')}<br>
        <strong>CPF:</strong> ${r.cpf || 'N/A'}<br>
        <strong>Status:</strong> Ativo
      </div>
    </div>
  `).join('');
}

// ============================================
// OPEN RESIDENT DETAIL
// ============================================

function openResidentDetail(residentId) {
  const resident = state.residents.find(r => r.id === residentId);
  
  if (!resident) return;

  state.selectedResident = resident;

  // Preencher dados
  document.getElementById('residentDetailName').textContent = resident.full_name;
  document.getElementById('residentDetailInfo').textContent = `${resident.gender === 'M' ? 'Masculino' : 'Feminino'} • ${new Date(resident.birth_date).toLocaleDateString('pt-BR')}`;

  // Overview
  document.getElementById('detail-birth').textContent = new Date(resident.birth_date).toLocaleDateString('pt-BR');
  document.getElementById('detail-gender').textContent = resident.gender === 'M' ? 'Masculino' : 'Feminino';
  document.getElementById('detail-phone').textContent = resident.phone_main || '-';
  document.getElementById('detail-responsible').textContent = resident.responsible_name || '-';
  document.getElementById('detail-diagnoses').textContent = resident.diagnoses || '-';
  document.getElementById('detail-history').textContent = resident.chronic_diseases || '-';

  // Scales (simulated)
  document.getElementById('detail-morse').textContent = '45';
  document.getElementById('detail-morse-risk').textContent = '🟡 RISCO MÉDIO - Implementar precauções moderadas';
  
  document.getElementById('detail-braden').textContent = '18';
  document.getElementById('detail-braden-risk').textContent = '🟠 RISCO MODERADO - Aplicar protocolo de prevenção';
  
  document.getElementById('detail-katz').textContent = '4';
  document.getElementById('detail-katz-risk').textContent = '🟡 SEMI-DEPENDENTE - Necessita assistência parcial';

  // Medications
  const medsList = resident.medications ? resident.medications.split('\n').filter(m => m.trim()) : [];
  document.getElementById('detail-medications').innerHTML = medsList.length > 0 
    ? medsList.map(m => `<div class="medication-item">${m}</div>`).join('')
    : '<p style="color: var(--text-secondary);">-</p>';

  // Allergies
  document.getElementById('detail-allergies-med').textContent = resident.allergies_medications || '-';
  document.getElementById('detail-allergies-food').textContent = resident.allergies_food || '-';
  document.getElementById('detail-allergies-other').textContent = resident.allergies_other || '-';

  // Clinical
  document.getElementById('detail-weight').textContent = resident.weight ? `${resident.weight} kg` : '-';
  document.getElementById('detail-height').textContent = resident.height ? `${resident.height} cm` : '-';
  document.getElementById('detail-imc').textContent = resident.imc ? resident.imc : '-';
  document.getElementById('detail-health-plan').textContent = resident.health_plan_name || '-';
  document.getElementById('detail-clinical-notes').textContent = resident.clinical_notes || '-';

  // Activities (simulated)
  document.getElementById('detail-activities').innerHTML = `
    <div class="timeline-item">
      <div class="timeline-time">Hoje - 14:30</div>
      <div class="timeline-desc">Banho realizado com sucesso</div>
    </div>
    <div class="timeline-item">
      <div class="timeline-time">Hoje - 12:00</div>
      <div class="timeline-desc">Almoço servido - Paciente comeu bem</div>
    </div>
    <div class="timeline-item">
      <div class="timeline-time">Hoje - 08:00</div>
      <div class="timeline-desc">Medicações da manhã administradas</div>
    </div>
  `;

  // Show detail page
  document.getElementById('page-resident-detail').style.display = 'block';
  document.querySelectorAll('.assistencial-page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-resident-detail').classList.add('active');

  // Reset tab
  document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-section="overview"]').classList.add('active');
  document.querySelectorAll('[data-section="overview"]').forEach(s => s.classList.add('active'));
}

// ============================================
// CLOSE RESIDENT DETAIL
// ============================================

function closeResidentDetail() {
  document.getElementById('page-resident-detail').style.display = 'none';
  switchPage('residents');
}

// ============================================
// SETUP DETAIL TABS
// ============================================

function setupDetailTabs() {
  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const section = tab.dataset.section;

      document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('[data-section]').forEach(s => {
        if (s.classList.contains('detail-section')) {
          s.classList.remove('active');
        }
      });

      document.querySelectorAll(`[data-section="${section}"]`).forEach(s => {
        if (s.classList.contains('detail-section')) {
          s.classList.add('active');
        }
      });
    });
  });
}

// ============================================
// DISPLAY RECENT ACTIVITIES
// ============================================

function displayRecentActivities() {
  const feed = document.getElementById('recentActivities');

  const activities = [
    { icon: '💊', title: 'Medicações administradas', time: 'Hoje - 08:00' },
    { icon: '🚿', title: 'Banho realizado', time: 'Hoje - 14:30' },
    { icon: '🍽️', title: 'Refeição servida', time: 'Hoje - 12:00' }
  ];

  feed.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-icon">${a.icon}</div>
      <div class="activity-content">
        <div class="activity-title">${a.title}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

// ============================================
// UPDATE STATS
// ============================================

function updateStats() {
  document.getElementById('statResidents').textContent = state.residents.length;
  document.getElementById('statAlerts').textContent = '2';
  document.getElementById('statPending').textContent = '4';
}

// ============================================
// OPEN ACTIVITY FORM
// ============================================

function openActivityForm() {
  alert('Formulário de atividade em desenvolvimento');
}
