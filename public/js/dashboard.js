const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://vivaris-care-production.up.railway.app/api';

class DashboardManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!this.token || !this.user) {
      window.location.href = '/';
      return;
    }
    this.init();
  }

  init() {
    this.setupUser();
    this.setupNavigation();
    this.setupLogout();
    this.loadDashboardData();
  }

  setupUser() {
    const nameMap = { 'admin': 'Administrador', 'comercial': 'Comercial', 'assistencial': 'Assistencial', 'familiar': 'Familiar' };
    document.getElementById('userName').textContent = this.user.full_name;
    document.getElementById('userRole').textContent = nameMap[this.user.role] || this.user.role;
    document.getElementById('userAvatar').textContent = this.user.full_name.charAt(0).toUpperCase();
    document.getElementById('welcomeMessage').textContent = `Bem-vindo, ${this.user.full_name.split(' ')[0]}! Aqui está o resumo de hoje.`;
    document.getElementById('pageTitle').textContent = 'Dashboard';
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.showPage(page);
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
      });
    });
    sidebarToggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    const page = document.getElementById(`page-${pageName}`);
    if (page) {
      page.style.display = 'block';
      const titles = { 'home': 'Dashboard', 'residents': 'Residentes', 'medications': 'Medicações', 'scales': 'Escalas Geriátricas', 'activities': 'Atividades', 'messages': 'Chat' };
      document.getElementById('pageTitle').textContent = titles[pageName] || 'VIVARIS CARE';
    }
  }

  setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    });
  }

  loadDashboardData() {
    this.loadResidents();
    this.loadMetrics();
    this.loadTimeline();
  }

  async loadResidents() {
    try {
      const response = await fetch(`${API_BASE}/residents`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const residents = await response.json();
      const list = document.getElementById('residentsList');
      const table = document.getElementById('residentsTable');
      if (!residents || residents.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum residente cadastrado</p></div>';
        table.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum residente encontrado</p></div>';
        return;
      }
      const homeResidents = residents.slice(0, 5);
      list.innerHTML = homeResidents.map(r => `
        <div class="resident-item">
          <div class="resident-info">
            <div class="resident-name">${r.full_name}</div>
            <div class="resident-meta">Quarto ${r.room} • Criado em ${new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
          </div>
          <span class="resident-status">Ativo</span>
        </div>
      `).join('');
      table.innerHTML = residents.map(r => `
        <div class="resident-item">
          <div class="resident-info">
            <div class="resident-name">${r.full_name}</div>
            <div class="resident-meta">
              <strong>Quarto:</strong> ${r.room || 'N/A'}<br>
              <strong>Data Nasc.:</strong> ${new Date(r.birth_date).toLocaleDateString('pt-BR')}<br>
              <strong>Criado:</strong> ${new Date(r.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
          <span class="resident-status">${r.status === 'active' ? 'Ativo' : 'Inativo'}</span>
        </div>
      `).join('');
      document.getElementById('metricResidents').textContent = residents.length;
    } catch (error) {
      console.error('Erro ao carregar residentes:', error);
    }
  }

  loadMetrics() {
    document.getElementById('metricActivities').textContent = Math.floor(Math.random() * 20) + 5;
    document.getElementById('metricAlerts').textContent = Math.floor(Math.random() * 5);
    document.getElementById('metricCompliance').textContent = (85 + Math.floor(Math.random() * 15)) + '%';
  }

  loadTimeline() {
    const timeline = document.getElementById('timeline');
    const activities = [
      { icon: 'fa-pill', title: 'Medicação administrada', time: 'Há 2 horas', resident: 'João Silva' },
      { icon: 'fa-shower', title: 'Banho realizado', time: 'Há 3 horas', resident: 'Maria Santos' },
      { icon: 'fa-utensils', title: 'Refeição registrada', time: 'Há 1 hora', resident: 'Pedro Oliveira' }
    ];
    if (activities.length === 0) {
      timeline.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>Nenhuma atividade registrada</p></div>';
      return;
    }
    timeline.innerHTML = activities.map((activity, idx) => `
      <div class="timeline-item">
        <div class="timeline-marker"><i class="fas ${activity.icon}"></i></div>
        <div class="timeline-content">
          <div class="timeline-title">${activity.title}</div>
          <div class="timeline-meta">${activity.resident} • ${activity.time}</div>
        </div>
      </div>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DashboardManager();
});
