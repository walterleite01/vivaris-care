/* ============================================
   FAMILIAR DASHBOARD - JAVASCRIPT
   ============================================ */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://vivaris-care-production.up.railway.app/api';

// STATE
let state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  resident: null
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
  if (!state.token || !state.user || state.user.role !== 'familiar') {
    window.location.href = '/';
    return;
  }

  setupNavigation();
  setupLogout();
  setupMenu();
  loadFamiliarData();
  displayActivitiesAndMedical();
});

// ============================================
// SETUP NAVIGATION
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
        
        // Fechar menu no mobile
        document.getElementById('sidebarMenu').classList.remove('open');
      }
    });
  });
}

function switchPage(pageName) {
  document.querySelectorAll('.familiar-page').forEach(page => {
    page.classList.remove('active');
  });

  const page = document.getElementById(`page-${pageName}`);
  if (page) {
    page.classList.add('active');
  }
}

// ============================================
// MENU MOBILE
// ============================================

function setupMenu() {
  document.getElementById('menuBtn').addEventListener('click', toggleMenu);
}

function toggleMenu() {
  const sidebar = document.getElementById('sidebarMenu');
  sidebar.classList.toggle('open');
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

async function loadFamiliarData() {
  try {
    // Para familiar, ele só vê um residente (seu parente)
    // Aqui simulamos com o primeiro residente da lista
    const residentsRes = await fetch(`${API_BASE}/residents`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    if (residentsRes.ok) {
      const residents = await residentsRes.json();
      if (residents && residents.length > 0) {
        state.resident = residents[0];
        displayResidentInfo();
        displayActivitiesAndMedical();
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ============================================
// DISPLAY RESIDENT INFO
// ============================================

function displayResidentInfo() {
  if (!state.resident) return;

  const r = state.resident;

  document.getElementById('residentName').textContent = r.full_name;
  document.getElementById('residentAvatar').textContent = r.full_name.charAt(0).toUpperCase();
  document.getElementById('residentStatus').textContent = 'Tudo bem! 🟢';
}

// ============================================
// DISPLAY ACTIVITIES
// ============================================

function displayActivitiesAndMedical() {
  // Activities (simuladas)
  const activities = [
    { time: '08:00', icon: '💊', title: 'Medicações da Manhã', description: 'Losartana 50mg, Metformina 500mg administradas' },
    { time: '10:30', icon: '🚿', title: 'Banho Realizado', description: 'Paciente colaborativo, sem queixas' },
    { time: '12:00', icon: '🍽️', title: 'Almoço Servido', description: 'Comeu bem, apetite excelente' },
    { time: '14:30', icon: '🎵', title: 'Atividade Recreativa', description: 'Ouviu músicas preferidas por 45 minutos' },
    { time: '17:00', icon: '💊', title: 'Medicações da Tarde', description: 'Losartana 50mg administrada' }
  ];

  const todayActivities = document.getElementById('todayActivities');
  todayActivities.innerHTML = activities.map(a => `
    <div class="activity-timeline-item">
      <div class="activity-time">${a.time}</div>
      <div class="activity-content">
        <div class="activity-icon">${a.icon}</div>
        <div class="activity-description">${a.title}</div>
        <div class="activity-detail">${a.description}</div>
      </div>
    </div>
  `).join('');

  const activitiesList = document.getElementById('activitiesList');
  activitiesList.innerHTML = activities.map(a => `
    <div class="activity-timeline-item">
      <div class="activity-time">${a.time}</div>
      <div class="activity-content">
        <div class="activity-icon">${a.icon}</div>
        <div class="activity-description">${a.title}</div>
        <div class="activity-detail">${a.description}</div>
      </div>
    </div>
  `).join('');
}

// ============================================
// EMERGENCY CONTACT
// ============================================

function openEmergency() {
  alert('📞 EMERGÊNCIA\n\nEquipe de Emergência: (11) 3000-0000\nUnidade BSL Saúde - 24h');
}
