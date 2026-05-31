// ============================================
// ASSISTENCIAL DASHBOARD - LÓGICA COMPLETA
// ============================================

let state = {
    user: null,
    token: null,
    residents: [],
    currentResident: null,
    allResidents: [],
    filteredResidents: [],
    timelineEvents: [],
    currentPage: 'dashboard'
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Validar autenticação
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || !user.id) {
            window.location.href = '/';
            return;
        }

        state.token = token;
        state.user = user;

        // Atualizar UI com dados do user
        document.getElementById('userName').textContent = user.full_name || 'Usuário';

        // Carregar dados
        await loadResidents();
        await loadAlerts();
        loadTimelineSelector();

        console.log('✅ Dashboard Assistencial carregado');
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
        alert('Erro ao carregar dashboard');
    }
});

// ============================================
// CARREGAR RESIDENTES
// ============================================

async function loadResidents() {
    try {
        // Buscar residentes do banco
        const response = await fetch('/api/residents', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar residentes');

        const data = await response.json();
        state.allResidents = data.data || [];
        state.residents = [...state.allResidents];

        renderResidents();
    } catch (error) {
        console.error('❌ Erro ao carregar residentes:', error);
        document.getElementById('residentsGrid').innerHTML = `
            <div class="alert-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar residentes</p>
            </div>
        `;
    }
}

// ============================================
// RENDERIZAR CARDS DE RESIDENTES
// ============================================

function renderResidents() {
    const grid = document.getElementById('residentsGrid');
    
    if (!state.residents || state.residents.length === 0) {
        grid.innerHTML = `
            <div class="alert-empty" style="grid-column: 1/-1;">
                <i class="fas fa-inbox"></i>
                <p>Nenhum residente encontrado</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = state.residents.map(resident => {
        const risco = calculateRisk(resident);
        const status = getStatus(resident);

        return `
            <div class="resident-card">
                <div class="resident-card-header">
                    <div class="resident-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="resident-name">${resident.full_name}</div>
                    <div class="resident-quarto">Quarto ${resident.room || 'N/A'}</div>
                </div>
                <div class="resident-card-body">
                    <div class="resident-info">
                        <div class="info-item">
                            <span class="info-label">Idade</span>
                            <span class="info-value">${calculateAge(resident.date_of_birth)} anos</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Risco de Queda</span>
                            <span class="risk-badge risk-${risco.fall.toLowerCase()}">${risco.fall}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Úlcera de Pressão</span>
                            <span class="risk-badge risk-${risco.ulcer.toLowerCase()}">${risco.ulcer}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Status</span>
                            <span class="status-badge status-${status.toLowerCase()}">${capitalizar(status)}</span>
                        </div>
                    </div>
                </div>
                <div class="resident-card-footer">
                    <button class="resident-card-footer button btn-timeline" onclick="openTimeline('${resident.id}')">
                        <i class="fas fa-clock"></i> Timeline
                    </button>
                    <button class="resident-card-footer button btn-details" onclick="viewResidentDetails('${resident.id}')">
                        <i class="fas fa-info-circle"></i> Detalhes
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// CALCULAR RISCO (com base em escalas)
// ============================================

function calculateRisk(resident) {
    let fall = 'Baixo';
    let ulcer = 'Baixo';

    // Morse (Risco de Queda)
    if (resident.scales?.morse) {
        const morse = resident.scales.morse;
        if (morse >= 51) fall = 'Alto';
        else if (morse >= 25) fall = 'Moderado';
    }

    // Braden (Risco de Úlcera)
    if (resident.scales?.braden) {
        const braden = resident.scales.braden;
        if (braden <= 12) ulcer = 'Alto';
        else if (braden <= 14) ulcer = 'Moderado';
    }

    return { fall, ulcer };
}

function getStatus(resident) {
    const risco = calculateRisk(resident);
    if (risco.fall === 'Alto' || risco.ulcer === 'Alto') return 'Crítico';
    if (risco.fall === 'Moderado' || risco.ulcer === 'Moderado') return 'Observação';
    return 'Estável';
}

// ============================================
// CALCULAR IDADE
// ============================================

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// ============================================
// CARREGAR ALERTAS CRÍTICOS
// ============================================

async function loadAlerts() {
    const alertsContainer = document.getElementById('alertsContainer');
    const alerts = [];

    // Verificar residentes com risco crítico
    state.allResidents.forEach(resident => {
        const risco = calculateRisk(resident);
        const status = getStatus(resident);

        if (status === 'Crítico') {
            if (risco.fall === 'Alto') {
                alerts.push({
                    type: 'danger',
                    icon: 'fa-exclamation-circle',
                    title: `${resident.full_name} - RISCO ALTO DE QUEDA`,
                    message: `Morse: ${resident.scales?.morse || 'N/A'}`
                });
            }

            if (risco.ulcer === 'Alto') {
                alerts.push({
                    type: 'danger',
                    icon: 'fa-exclamation-circle',
                    title: `${resident.full_name} - RISCO ALTO DE ÚLCERA`,
                    message: `Braden: ${resident.scales?.braden || 'N/A'}`
                });
            }
        }
    });

    if (alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="alert-empty">
                <i class="fas fa-check-circle"></i>
                <p>Nenhum alerta crítico</p>
            </div>
        `;
        return;
    }

    alertsContainer.innerHTML = alerts.map(alert => `
        <div class="alert-card ${alert.type === 'danger' ? 'danger' : 'warning'}">
            <div class="alert-icon">
                <i class="fas ${alert.icon}"></i>
            </div>
            <div class="alert-content">
                <h3>${alert.title}</h3>
                <p>${alert.message}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// FILTROS
// ============================================

function applyFilters() {
    const risco = document.getElementById('filterRisco')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const search = document.getElementById('searchResident')?.value?.toLowerCase() || '';

    state.residents = state.allResidents.filter(resident => {
        const residentRisco = calculateRisk(resident);
        const residentStatus = getStatus(resident);
        const nome = resident.full_name?.toLowerCase() || '';
        const quarto = resident.room?.toString() || '';

        const matchRisco = !risco || 
            (risco === 'alto' && residentRisco.fall === 'Alto') ||
            (risco === 'moderado' && residentRisco.fall === 'Moderado') ||
            (risco === 'baixo' && residentRisco.fall === 'Baixo');

        const matchStatus = !status || residentStatus.toLowerCase() === status;
        const matchSearch = !search || nome.includes(search) || quarto.includes(search);

        return matchRisco && matchStatus && matchSearch;
    });

    renderResidents();
}

// ============================================
// TIMELINE
// ============================================

function loadTimelineSelector() {
    const select = document.getElementById('timelineResidentSelect');
    select.innerHTML = '<option value="">-- Escolha um residente --</option>' +
        state.allResidents.map(r => `<option value="${r.id}">${r.full_name}</option>`).join('');
}

async function openTimeline(residentId) {
    state.currentResident = state.allResidents.find(r => r.id === residentId);
    document.getElementById('timelineResidentSelect').value = residentId;
    switchPage('timeline');
    await loadTimeline();
}

async function loadTimeline() {
    const select = document.getElementById('timelineResidentSelect');
    const residentId = select.value;

    if (!residentId) {
        document.getElementById('timelineFeed').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Selecione um residente para ver a timeline</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`/api/timeline/${residentId}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar timeline');

        const data = await response.json();
        state.timelineEvents = data.data || [];

        renderTimeline();
    } catch (error) {
        console.error('❌ Erro ao carregar timeline:', error);
        document.getElementById('timelineFeed').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar timeline</p>
            </div>
        `;
    }
}

function renderTimeline() {
    const feed = document.getElementById('timelineFeed');

    if (!state.timelineEvents || state.timelineEvents.length === 0) {
        feed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhum evento na timeline</p>
            </div>
        `;
        return;
    }

    feed.innerHTML = state.timelineEvents.map(event => `
        <div class="timeline-event">
            <div class="event-header">
                <div>
                    <span class="event-type-badge">${capitalizar(event.event_type)}</span>
                </div>
                <span class="event-time">${formatDate(event.created_at)}</span>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-content">${event.content}</p>
            <div class="event-meta">
                <span>👤 ${event.author_name || 'Sistema'}</span>
                <span>🎯 ${capitalizar(event.audience)}</span>
                ${event.is_critical ? '<span style="color: #ef4444;">🚨 CRÍTICO</span>' : ''}
            </div>
            <div class="event-footer">
                <div class="event-action" onclick="openComments('${event.id}')">
                    <i class="fas fa-comment"></i>
                    <span>Comentar</span>
                </div>
                <div class="event-action" onclick="toggleReaction('${event.id}', '👍')">
                    <i class="fas fa-thumbs-up"></i>
                    <span>Reagir</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// NOVO EVENTO MODAL
// ============================================

function openNewEventModal() {
    if (!state.currentResident) {
        alert('Selecione um residente primeiro!');
        return;
    }
    document.getElementById('newEventModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function saveNewEvent() {
    if (!state.currentResident) {
        alert('Erro: residente não selecionado');
        return;
    }

    const eventType = document.getElementById('eventType').value;
    const title = document.getElementById('eventTitle').value;
    const content = document.getElementById('eventContent').value;
    const audience = document.getElementById('eventAudience').value;
    const isCritical = document.getElementById('eventCritical').checked;

    if (!title || !content) {
        alert('Preencha título e descrição');
        return;
    }

    try {
        const response = await fetch('/api/timeline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                resident_id: state.currentResident.id,
                event_type: eventType,
                title,
                content,
                audience,
                is_critical: isCritical,
                tags: []
            })
        });

        if (!response.ok) throw new Error('Erro ao salvar evento');

        // Limpar form
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventContent').value = '';
        document.getElementById('eventCritical').checked = false;

        // Fechar modal
        closeModal('newEventModal');

        // Recarregar timeline
        await loadTimeline();

        alert('✅ Evento criado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao salvar evento:', error);
        alert('Erro ao salvar evento');
    }
}

// ============================================
// COMENTÁRIOS
// ============================================

async function openComments(eventId) {
    alert('Funcionalidade de comentários em desenvolvimento');
    // TODO: Implementar interface de comentários
}

async function toggleReaction(eventId, reaction) {
    try {
        const response = await fetch(`/api/timeline/${eventId}/reactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ reaction })
        });

        if (!response.ok) throw new Error('Erro ao adicionar reação');

        await loadTimeline();
    } catch (error) {
        console.error('❌ Erro ao adicionar reação:', error);
    }
}

// ============================================
// NAVEGAÇÃO DE PÁGINAS
// ============================================

function switchPage(pageName) {
    // Remover active de todas as páginas
    document.querySelectorAll('.assistencial-page').forEach(page => {
        page.classList.remove('active');
    });

    // Remover active de todos os nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Ativar página selecionada
    const page = document.getElementById(`page-${pageName}`);
    if (page) {
        page.classList.add('active');
    }

    // Ativar nav item
    document.querySelector(`.nav-item[onclick*="${pageName}"]`)?.classList.add('active');

    // Atualizar title
    const titles = {
        'dashboard': 'Dashboard Assistencial',
        'residents': 'Todos os Residentes',
        'timeline': 'Timeline Clínica',
        'medicacoes': 'Medicações',
        'relatorios': 'Relatórios'
    };

    document.getElementById('pageTitle').textContent = titles[pageName] || 'VIVARIS CARE';
    state.currentPage = pageName;
}

function openTimeline(residentId) {
    state.currentResident = state.allResidents.find(r => r.id === residentId);
    document.getElementById('timelineResidentSelect').value = residentId;
    switchPage('timeline');
}

function viewResidentDetails(residentId) {
    alert('Página de detalhes do residente em desenvolvimento');
}

function toggleView() {
    alert('Toggle de visualização em desenvolvimento');
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// ============================================
// HELPERS
// ============================================

function capitalizar(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
