// ============================================
// FAMILIAR DASHBOARD - LÓGICA PREMIUM
// ============================================

let state = {
    user: null,
    token: null,
    residents: [],
    currentResident: null,
    timelineEvents: [],
    moments: [],
    solicitacoes: [],
    notifications: [],
    socket: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || !user.id) {
            window.location.href = '/';
            return;
        }

        state.token = token;
        state.user = user;

        // Atualizar perfil
        document.getElementById('profileName').textContent = user.full_name || 'Usuário';
        document.getElementById('profileEmail').textContent = user.email || 'N/A';

        // Conectar Socket.IO
        connectSocket();

        // Carregar dados
        await loadResidents();

        // Carregar primeira página
        switchPage('home');

        console.log('✅ Familiar Dashboard carregado');
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
    }
});

// ============================================
// SOCKET.IO - TEMPO REAL
// ============================================

function connectSocket() {
    state.socket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });

    state.socket.on('connect', () => {
        console.log('✅ Socket conectado');
        if (state.currentResident) {
            state.socket.emit('subscribe_timeline', { resident_id: state.currentResident.id });
        }
    });

    // Novo evento em tempo real
    state.socket.on('new_timeline_event', (event) => {
        if (event.resident_id === state.currentResident?.id && event.audience === 'family_visible') {
            state.timelineEvents.unshift(event);
            renderTimeline();
            addNotification('Nova atualização', event.title);
        }
    });

    // Novo momento
    state.socket.on('new_moment', (moment) => {
        if (moment.resident_id === state.currentResident?.id) {
            state.moments.unshift(moment);
            renderMoments();
            addNotification('Novo momento', moment.title);
        }
    });

    // Resposta de solicitação
    state.socket.on('request_response', (response) => {
        const request = state.solicitacoes.find(r => r.id === response.request_id);
        if (request) {
            request.status = 'respondida';
            request.response = response.response;
            renderSolicitacoes();
            addNotification('Resposta recebida', 'A equipe respondeu sua mensagem');
        }
    });
}

// ============================================
// CARREGAR RESIDENTES
// ============================================

async function loadResidents() {
    try {
        const response = await fetch('/api/residents', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar residentes');

        const data = await response.json();
        state.residents = data.data || [];

        if (state.residents.length > 0) {
            state.currentResident = state.residents[0];
            document.getElementById('residentName').textContent = state.currentResident.full_name;
            document.getElementById('profileResident').textContent = state.currentResident.full_name;

            // Carregar timeline e momentos
            await loadTimeline();
            await loadMoments();
            await loadSolicitacoes();
            updateHeroStatus();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar residentes:', error);
    }
}

// ============================================
// ATUALIZAR HERO STATUS
// ============================================

function updateHeroStatus() {
    if (!state.currentResident) return;

    const resident = state.currentResident;
    const escalaBraden = resident.scales?.braden || 0;

    // Status simulados (em produção vem da API)
    const humor = escalaBraden > 15 ? 'Bem-disposto 😊' : 'Tranquilo 😌';
    const alimentacao = Math.random() > 0.3 ? 'Alimentação OK 🍽️' : 'Reduzida 🥣';
    const sono = Math.random() > 0.2 ? 'Sono normal 😴' : 'Inquieto 😵';
    const saude = escalaBraden > 14 ? 'Estável ✅' : 'Sob observação ⚠️';

    document.getElementById('humor').textContent = humor;
    document.getElementById('alimentacao').textContent = alimentacao;
    document.getElementById('sono').textContent = sono;
    document.getElementById('saude').textContent = saude;

    // Resumo do dia
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = `
        <div class="summary-item">
            <i class="fas fa-check-circle"></i>
            <span>Medicações administradas corretamente</span>
        </div>
        <div class="summary-item">
            <i class="fas fa-heart"></i>
            <span>${humor}</span>
        </div>
        <div class="summary-item">
            <i class="fas fa-utensils"></i>
            <span>${alimentacao}</span>
        </div>
        <div class="summary-item">
            <i class="fas fa-check-circle"></i>
            <span>Atividades realizadas conforme programação</span>
        </div>
    `;

    // Última atualização
    document.getElementById('lastUpdate').textContent = 'Última atualização: agora';
}

// ============================================
// TIMELINE
// ============================================

async function loadTimeline() {
    try {
        const response = await fetch(`/api/timeline/${state.currentResident.id}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar timeline');

        const data = await response.json();
        
        // Filtrar apenas family_visible
        state.timelineEvents = (data.data || []).filter(e => e.audience === 'family_visible');

        renderTimeline();
    } catch (error) {
        console.error('❌ Erro ao carregar timeline:', error);
    }
}

function renderTimeline() {
    const feed = document.getElementById('timelineFeed');

    if (!state.timelineEvents || state.timelineEvents.length === 0) {
        feed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma atualização ainda</p>
            </div>
        `;
        return;
    }

    document.getElementById('timelineResidentName').textContent = state.currentResident.full_name;

    feed.innerHTML = state.timelineEvents.map(event => `
        <div class="timeline-event">
            <div class="event-header">
                <div>
                    <span class="event-type-badge">${humanizeType(event.event_type)}</span>
                </div>
                <span class="event-time">${formatDate(event.created_at)}</span>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-content">${event.content}</p>
            <div class="event-meta">
                <span>👤 ${event.author_name || 'Equipe'}</span>
                <span>⏰ ${timeAgo(event.created_at)}</span>
            </div>
            <div class="event-actions">
                <div class="event-action" onclick="reactToEvent('${event.id}', '❤️')">
                    <i class="fas fa-heart"></i>
                    <span>Reagir</span>
                </div>
                <div class="event-action" onclick="openCommentModal('${event.id}')">
                    <i class="fas fa-comment"></i>
                    <span>Comentar</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// MOMENTOS
// ============================================

async function loadMoments() {
    try {
        const response = await fetch(`/api/moments/${state.currentResident.id}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar momentos');

        const data = await response.json();
        state.moments = data.data || [];

        renderMoments();
    } catch (error) {
        console.error('❌ Erro ao carregar momentos:', error);
    }
}

function renderMoments() {
    const carousel = document.getElementById('momentsCarousel');
    const grid = document.getElementById('momentosGrid');

    if (!state.moments || state.moments.length === 0) {
        carousel.innerHTML = `
            <div class="moment-empty">
                <i class="fas fa-images"></i>
                <p>Nenhum momento registrado hoje</p>
            </div>
        `;
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-camera"></i>
                <p>Nenhum momento registrado ainda</p>
            </div>
        `;
        return;
    }

    // Carousel no home
    carousel.innerHTML = state.moments.slice(0, 3).map(moment => `
        <div class="moment-card">
            ${moment.media_url ? `<img src="${moment.media_url}" alt="" class="moment-image">` : ''}
            <div class="moment-caption">
                <div>${moment.title}</div>
                <div class="moment-time">${formatDate(moment.created_at)}</div>
            </div>
        </div>
    `).join('');

    // Grid na página de momentos
    grid.innerHTML = state.moments.map(moment => `
        <div class="momento-item">
            <div class="momento-image-container">
                ${moment.media_url ? `<img src="${moment.media_url}" alt="">` : '<div style="background: #f0f0f0;"></div>'}
            </div>
            <div class="momento-info">
                <div class="momento-caption-small">${moment.title}</div>
                <div class="momento-date">${formatDate(moment.created_at)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// SOLICITAÇÕES
// ============================================

async function loadSolicitacoes() {
    try {
        const response = await fetch('/api/family-requests', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (!response.ok) throw new Error('Erro ao buscar solicitações');

        const data = await response.json();
        state.solicitacoes = data.data || [];

        renderSolicitacoes();
    } catch (error) {
        console.error('❌ Erro ao carregar solicitações:', error);
    }
}

function renderSolicitacoes() {
    const list = document.getElementById('solicitacoesList');

    if (!state.solicitacoes || state.solicitacoes.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope"></i>
                <p>Nenhuma solicitação ainda</p>
            </div>
        `;
        return;
    }

    list.innerHTML = state.solicitacoes.map(req => `
        <div class="solicitacao-card">
            <div class="solicitacao-header">
                <div class="solicitacao-title">${req.title}</div>
                <span class="solicitacao-status status-${req.status}">${req.status}</span>
            </div>
            <div class="solicitacao-content">${req.description}</div>
            ${req.response ? `
                <div style="background: #f0fdf4; padding: 10px; border-radius: 8px; margin-top: 10px;">
                    <div style="font-weight: 600; color: #166534; font-size: 12px;">Resposta da equipe:</div>
                    <div style="color: #374151; font-size: 13px; margin-top: 5px;">${req.response}</div>
                </div>
            ` : ''}
            <div class="solicitacao-footer">
                <span>${req.request_type}</span>
                <span>${formatDate(req.created_at)}</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// ENVIAR SOLICITAÇÃO
// ============================================

function openNewRequest() {
    document.getElementById('newRequestModal').classList.add('active');
}

async function sendRequest() {
    const type = document.getElementById('requestType').value;
    const content = document.getElementById('requestContent').value;

    if (!content.trim()) {
        alert('Digite sua mensagem');
        return;
    }

    try {
        const response = await fetch('/api/family-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                resident_id: state.currentResident.id,
                request_type: type,
                title: type.replace(/_/g, ' '),
                description: content,
                priority: 'medium'
            })
        });

        if (!response.ok) throw new Error('Erro ao enviar solicitação');

        document.getElementById('requestContent').value = '';
        closeModal('newRequestModal');

        await loadSolicitacoes();
        addNotification('✅ Enviado', 'Sua mensagem foi enviada para a equipe');
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao enviar mensagem');
    }
}

function openSolicitacao() {
    openNewRequest();
}

// ============================================
// COMENTÁRIOS
// ============================================

async function reactToEvent(eventId, reaction) {
    try {
        const response = await fetch(`/api/timeline/${eventId}/reactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ reaction })
        });

        if (response.ok) {
            await loadTimeline();
        }
    } catch (error) {
        console.error('❌ Erro ao reagir:', error);
    }
}

function openCommentModal(eventId) {
    // Implementar comentários depois
    alert('Funcionalidade de comentários em desenvolvimento');
}

// ============================================
// EMOJIS
// ============================================

function insertEmoji(emoji) {
    const textarea = document.getElementById('requestContent');
    textarea.value += emoji;
    textarea.focus();
}

// ============================================
// NOTIFICAÇÕES
// ============================================

function addNotification(title, message) {
    const notification = { title, message, time: new Date() };
    state.notifications.unshift(notification);

    // Atualizar badge
    const badge = document.getElementById('notificationBadge');
    badge.textContent = state.notifications.length;

    // Limitar a 10 notificações
    if (state.notifications.length > 10) {
        state.notifications.pop();
    }

    renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById('notificationsList');

    if (state.notifications.length === 0) {
        list.innerHTML = `
            <div class="empty-notification">
                <i class="fas fa-check"></i>
                <p>Sem notificações</p>
            </div>
        `;
        return;
    }

    list.innerHTML = state.notifications.map(notif => `
        <div class="notification-item">
            <div class="notification-title">${notif.title}</div>
            <div class="notification-message">${notif.message}</div>
            <div class="notification-time">${timeAgo(notif.time)}</div>
        </div>
    `).join('');
}

// ============================================
// NAVEGAÇÃO
// ============================================

function switchPage(pageName) {
    document.querySelectorAll('.familiar-page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');

    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.querySelector(`.menu-item[onclick*="${pageName}"]`)?.classList.add('active');

    closeMenu();
}

function toggleMenu() {
    document.getElementById('familiarMenu').classList.toggle('active');
}

function closeMenu() {
    document.getElementById('familiarMenu').classList.remove('active');
}

function toggleNotifications() {
    document.getElementById('notificationsPanel').classList.toggle('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    if (confirm('Deseja sair?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)}d atrás`;
}

function humanizeType(type) {
    const types = {
        'nurse_note': '👩‍⚕️ Enfermagem',
        'physician_note': '👨‍⚕️ Médico',
        'medication': '💊 Medicação',
        'incident': '⚠️ Incidente',
        'scale': '📊 Escala',
        'physio': '🧍 Fisioterapia',
        'nutrition': '🥗 Nutrição'
    };
    return types[type] || type;
}
