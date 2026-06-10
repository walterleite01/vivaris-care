// ============================================
// ASSISTENCIAL DASHBOARD - LÓGICA COMPLETA v2
// Chat tempo real + Medicações + Relatórios + Momentos
// ============================================

let state = {
    user: null,
    token: null,
    residents: [],
    currentResident: null,
    allResidents: [],
    timelineEvents: [],
    medications: [],
    chatResident: null,
    chatMessages: [],
    socket: null,
    currentPage: 'dashboard'
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

        document.getElementById('userName').textContent = user.full_name || 'Usuário';

        connectSocket();
        await loadResidents();
        await loadAlerts();
        loadTimelineSelector();

        console.log('✅ Dashboard Assistencial carregado');
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
    }
});

// ============================================
// SOCKET.IO - TEMPO REAL
// ============================================

function connectSocket() {
    if (typeof io === 'undefined') {
        console.warn('⚠️ Socket.IO não carregado');
        return;
    }

    state.socket = io({
        auth: { token: state.token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
    });

    state.socket.on('connect', () => {
        console.log('✅ Socket conectado');
        // Reentrar nas salas após reconexão
        if (state.chatResident) {
            state.socket.emit('subscribe_resident', { resident_id: state.chatResident.id });
        }
    });

    // Chat: nova mensagem
    state.socket.on('new_message', (msg) => {
        if (state.chatResident && msg.resident_id === state.chatResident.id) {
            // Evita duplicar a própria mensagem (já adicionada no envio)
            if (msg.sender_id !== state.user.id) {
                state.chatMessages.push(msg);
                renderChatMessages();
            }
        } else {
            // Badge de não lidas
            const badge = document.getElementById('chatBadge');
            badge.style.display = 'inline-block';
            badge.textContent = parseInt(badge.textContent || '0') + 1;
        }
    });

    // Indicador digitando
    let typingTimeout;
    state.socket.on('typing', ({ user_name }) => {
        const el = document.getElementById('chatTyping');
        el.textContent = `${user_name} está digitando...`;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => { el.textContent = ''; }, 2000);
    });

    // Timeline em tempo real
    state.socket.on('new_timeline_event', (event) => {
        const select = document.getElementById('timelineResidentSelect');
        if (select && select.value === event.resident_id && state.currentPage === 'timeline') {
            loadTimeline();
        }
    });
}

function emitTyping() {
    if (state.socket && state.chatResident) {
        state.socket.emit('typing', { resident_id: state.chatResident.id });
    }
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
        state.allResidents = data.data || [];
        state.residents = [...state.allResidents];

        renderResidents();
        renderResidentsTable();
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
                            <span class="info-value">${calculateAge(resident.birth_date || resident.date_of_birth)} anos</span>
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
                            <span class="status-badge status-${status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">${status}</span>
                        </div>
                    </div>
                </div>
                <div class="resident-card-footer">
                    <button class="btn-timeline" onclick="openTimeline('${resident.id}')">
                        <i class="fas fa-clock"></i> Timeline
                    </button>
                    <button class="btn-details" onclick="openChatWith('${resident.id}')">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// TABELA COMPLETA DE RESIDENTES
// ============================================

function renderResidentsTable() {
    const tbody = document.getElementById('residentsTableBody');
    if (!tbody) return;

    if (!state.residents || state.residents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Nenhum residente</td></tr>';
        return;
    }

    tbody.innerHTML = state.residents.map(r => {
        const risco = calculateRisk(r);
        const status = getStatus(r);
        return `
            <tr>
                <td>${r.full_name}</td>
                <td>${r.room || 'N/A'}</td>
                <td>${calculateAge(r.birth_date || r.date_of_birth)}</td>
                <td><span class="risk-badge risk-${risco.fall.toLowerCase()}">${risco.fall}</span></td>
                <td><span class="risk-badge risk-${risco.ulcer.toLowerCase()}">${risco.ulcer}</span></td>
                <td>${status}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="openTimeline('${r.id}')">
                        <i class="fas fa-clock"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// CALCULAR RISCO (com base em escalas)
// ============================================

function calculateRisk(resident) {
    let fall = 'Baixo';
    let ulcer = 'Baixo';

    if (resident.scales?.morse) {
        const morse = resident.scales.morse;
        if (morse >= 51) fall = 'Alto';
        else if (morse >= 25) fall = 'Moderado';
    }

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
// ALERTAS CRÍTICOS
// ============================================

async function loadAlerts() {
    const alertsContainer = document.getElementById('alertsContainer');
    const alerts = [];

    state.allResidents.forEach(resident => {
        const risco = calculateRisk(resident);
        if (risco.fall === 'Alto') {
            alerts.push({
                icon: 'fa-person-falling',
                title: `${resident.full_name} - RISCO ALTO DE QUEDA`,
                message: `Morse: ${resident.scales?.morse || 'N/A'} • Quarto ${resident.room || 'N/A'}`
            });
        }
        if (risco.ulcer === 'Alto') {
            alerts.push({
                icon: 'fa-bed-pulse',
                title: `${resident.full_name} - RISCO ALTO DE ÚLCERA`,
                message: `Braden: ${resident.scales?.braden || 'N/A'} • Quarto ${resident.room || 'N/A'}`
            });
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
        <div class="alert-card danger">
            <div class="alert-icon"><i class="fas ${alert.icon}"></i></div>
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
    const search = (document.getElementById('searchResident')?.value ||
                    document.getElementById('searchAllResidents')?.value || '').toLowerCase();

    const statusMap = { 'estavel': 'Estável', 'observacao': 'Observação', 'critico': 'Crítico' };

    state.residents = state.allResidents.filter(resident => {
        const residentRisco = calculateRisk(resident);
        const residentStatus = getStatus(resident);
        const nome = resident.full_name?.toLowerCase() || '';
        const quarto = resident.room?.toString().toLowerCase() || '';

        const matchRisco = !risco ||
            (risco === 'alto' && residentRisco.fall === 'Alto') ||
            (risco === 'moderado' && residentRisco.fall === 'Moderado') ||
            (risco === 'baixo' && residentRisco.fall === 'Baixo');

        const matchStatus = !status || residentStatus === statusMap[status];
        const matchSearch = !search || nome.includes(search) || quarto.includes(search);

        return matchRisco && matchStatus && matchSearch;
    });

    renderResidents();
    renderResidentsTable();
}

// ============================================
// TIMELINE
// ============================================

function loadTimelineSelector() {
    const select = document.getElementById('timelineResidentSelect');
    select.innerHTML = '<option value="">-- Escolha um residente --</option>' +
        state.allResidents.map(r => `<option value="${r.id}">${r.full_name}</option>`).join('');
}

// ÚNICO openTimeline (bug do duplicado corrigido!)
async function openTimeline(residentId) {
    state.currentResident = state.allResidents.find(r => r.id === residentId);
    document.getElementById('timelineResidentSelect').value = residentId;
    switchPage('timeline');
    await loadTimeline();
}

async function loadTimeline() {
    const select = document.getElementById('timelineResidentSelect');
    const residentId = select.value;

    state.currentResident = state.allResidents.find(r => r.id === residentId) || null;

    if (!residentId) {
        document.getElementById('timelineFeed').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Selecione um residente para ver a timeline</p>
            </div>
        `;
        return;
    }

    // Entrar na sala do residente para receber eventos em tempo real
    if (state.socket) {
        state.socket.emit('subscribe_resident', { resident_id: residentId });
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
        <div class="timeline-event ${event.is_critical ? 'critical' : ''}">
            <div class="event-header">
                <span class="event-type-badge">${capitalizar(event.event_type)}</span>
                <span class="event-time">${formatDate(event.created_at)}</span>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-content">${event.content}</p>
            <div class="event-meta">
                <span>👤 ${event.author_name || 'Sistema'}</span>
                <span>🎯 ${capitalizar(event.audience)}</span>
                ${event.is_critical ? '<span style="color: #ef4444;">🚨 CRÍTICO</span>' : ''}
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
                title, content, audience,
                is_critical: isCritical,
                tags: []
            })
        });

        if (!response.ok) throw new Error('Erro ao salvar evento');

        document.getElementById('eventTitle').value = '';
        document.getElementById('eventContent').value = '';
        document.getElementById('eventCritical').checked = false;
        closeModal('newEventModal');
        await loadTimeline();
    } catch (error) {
        console.error('❌ Erro ao salvar evento:', error);
        alert('Erro ao salvar evento');
    }
}

// ============================================
// NOVO MOMENTO (COM UPLOAD CLOUDINARY)
// ============================================

let momentFileData = null;

function openNewMomentModal() {
    if (!state.currentResident) {
        alert('Selecione um residente primeiro!');
        return;
    }
    momentFileData = null;
    document.getElementById('momentFile').value = '';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadAreaText').textContent = 'Clique para escolher uma foto ou vídeo';
    document.getElementById('newMomentModal').classList.add('active');
}

function previewMomentFile() {
    const file = document.getElementById('momentFile').files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande! Máximo: 10MB');
        return;
    }

    momentFileData = file;
    document.getElementById('uploadAreaText').textContent = `📎 ${file.name}`;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('uploadPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function saveMoment() {
    const title = document.getElementById('momentTitle').value;
    if (!title) {
        alert('Dê um título ao momento!');
        return;
    }

    const btn = document.getElementById('saveMomentBtn');
    btn.disabled = true;

    try {
        let mediaUrl = null;
        let mediaType = null;

        // 1. Upload do arquivo (se houver)
        if (momentFileData) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando foto...';

            const formData = new FormData();
            formData.append('file', momentFileData);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${state.token}` },
                body: formData
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error || 'Erro no upload');
            }

            const uploadJson = await uploadRes.json();
            mediaUrl = uploadJson.url;
            mediaType = uploadJson.media_type;
        }

        // 2. Criar o momento
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

        const response = await fetch('/api/moments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                resident_id: state.currentResident.id,
                moment_type: document.getElementById('momentType').value,
                title,
                description: document.getElementById('momentDescription').value || null,
                media_url: mediaUrl,
                media_type: mediaType,
                audience: 'family_visible'
            })
        });

        if (!response.ok) throw new Error('Erro ao criar momento');

        closeModal('newMomentModal');
        document.getElementById('momentTitle').value = '';
        document.getElementById('momentDescription').value = '';
        alert('✅ Momento publicado! A família já pode ver. ❤️');

    } catch (error) {
        console.error('❌ Erro ao salvar momento:', error);
        alert('Erro: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-heart"></i> Publicar Momento';
    }
}

// ============================================
// MEDICAÇÕES
// ============================================

async function loadMedicacoes() {
    const container = document.getElementById('medicacoesContainer');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';

    // Popular seletor (uma vez)
    const select = document.getElementById('medResidentSelect');
    if (select.options.length <= 1) {
        select.innerHTML = '<option value="">Todos os residentes</option>' +
            state.allResidents.map(r => `<option value="${r.id}">${r.full_name}</option>`).join('');
    }

    const selectedId = select.value;
    const residentsToLoad = selectedId
        ? state.allResidents.filter(r => r.id === selectedId)
        : state.allResidents;

    try {
        const all = [];
        // Busca medicações de cada residente em paralelo
        const results = await Promise.all(residentsToLoad.map(async r => {
            const res = await fetch(`/api/medications/resident/${r.id}`, {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            if (!res.ok) return [];
            const meds = await res.json();
            return (Array.isArray(meds) ? meds : []).map(m => ({ ...m, resident_name: r.full_name }));
        }));

        results.forEach(meds => all.push(...meds));
        state.medications = all;
        renderMedicacoes(all);

    } catch (error) {
        console.error('❌ Erro ao carregar medicações:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar medicações</p>
            </div>
        `;
    }
}

function renderMedicacoes(meds) {
    const container = document.getElementById('medicacoesContainer');

    if (!meds || meds.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pills"></i>
                <p>Nenhuma medicação cadastrada. Clique em "Nova Medicação" para adicionar.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = meds.map(m => `
        <div class="med-card">
            <div class="med-icon"><i class="fas fa-pills"></i></div>
            <div class="med-info">
                <div class="med-name">${m.medication_name}</div>
                <div class="med-details">
                    ${m.dose ? `${Number(m.dose)} ${m.dose_unit || ''}` : ''}
                    ${m.frequency ? ` • ${m.frequency}` : ''}
                    ${m.route ? ` • Via ${m.route}` : ''}
                </div>
                <div class="med-resident">👤 ${m.resident_name} • Desde ${formatDateShort(m.start_date)}</div>
            </div>
            <span class="med-status ${m.active ? 'active' : 'inactive'}">${m.active ? 'Ativa' : 'Suspensa'}</span>
        </div>
    `).join('');
}

function filterMedicacoes() {
    const search = document.getElementById('medSearch').value.toLowerCase();
    const filtered = state.medications.filter(m =>
        m.medication_name?.toLowerCase().includes(search) ||
        m.resident_name?.toLowerCase().includes(search)
    );
    renderMedicacoes(filtered);
}

function openNewMedicationModal() {
    const select = document.getElementById('newMedResident');
    select.innerHTML = '<option value="">-- Selecione --</option>' +
        state.allResidents.map(r => `<option value="${r.id}">${r.full_name}</option>`).join('');
    document.getElementById('newMedStartDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('newMedicationModal').classList.add('active');
}

async function saveMedication() {
    const residentId = document.getElementById('newMedResident').value;
    const name = document.getElementById('newMedName').value;
    const startDate = document.getElementById('newMedStartDate').value;

    if (!residentId || !name || !startDate) {
        alert('Preencha residente, nome da medicação e data de início!');
        return;
    }

    try {
        const res = await fetch('/api/medications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                resident_id: residentId,
                medication_name: name,
                dose: parseFloat(document.getElementById('newMedDose').value) || null,
                dose_unit: document.getElementById('newMedUnit').value,
                frequency: document.getElementById('newMedFrequency').value || null,
                route: document.getElementById('newMedRoute').value,
                start_date: startDate
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Erro ao salvar');
        }

        closeModal('newMedicationModal');
        document.getElementById('newMedName').value = '';
        document.getElementById('newMedDose').value = '';
        document.getElementById('newMedFrequency').value = '';
        await loadMedicacoes();
        alert('✅ Medicação cadastrada!');
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// ============================================
// CHAT TEMPO REAL
// ============================================

function renderChatResidentList() {
    const list = document.getElementById('chatResidentList');
    if (!state.allResidents.length) {
        list.innerHTML = '<p class="empty-hint">Nenhum residente</p>';
        return;
    }

    list.innerHTML = state.allResidents.map(r => `
        <div class="chat-resident-item ${state.chatResident?.id === r.id ? 'active' : ''}"
             onclick="openChatWith('${r.id}')">
            <div class="chat-resident-avatar"><i class="fas fa-user"></i></div>
            <div>
                <div class="chat-resident-name">${r.full_name}</div>
                <div class="chat-resident-room">Quarto ${r.room || 'N/A'}</div>
            </div>
        </div>
    `).join('');
}

async function openChatWith(residentId) {
    state.chatResident = state.allResidents.find(r => r.id === residentId);
    if (!state.chatResident) return;

    // Zerar badge
    const badge = document.getElementById('chatBadge');
    badge.style.display = 'none';
    badge.textContent = '0';

    switchPage('mensagens');
    renderChatResidentList();

    document.getElementById('chatHeader').innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span>Conversa sobre <strong>${state.chatResident.full_name}</strong> (com a família)</span>
    `;
    document.getElementById('chatInputBar').style.display = 'flex';

    // Entrar na sala
    if (state.socket) {
        state.socket.emit('subscribe_resident', { resident_id: residentId });
    }

    // Carregar histórico
    try {
        const res = await fetch(`/api/messages/resident/${residentId}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        // API retorna DESC, invertemos para ordem cronológica
        state.chatMessages = (json.data || []).reverse();
        renderChatMessages();
    } catch (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
    }
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');

    if (!state.chatMessages.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-dots"></i>
                <p>Nenhuma mensagem ainda. Comece a conversa!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = state.chatMessages.map(m => {
        const isMine = m.sender_id === state.user.id;
        return `
            <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}">
                ${!isMine ? `<div class="bubble-sender">${m.sender_name || 'Família'}</div>` : ''}
                <div class="bubble-text">${escapeHtml(m.message_text)}</div>
                <div class="bubble-time">${formatTime(m.sent_at || m.created_at)}</div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !state.chatResident) return;

    input.value = '';

    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                resident_id: state.chatResident.id,
                message_text: text
            })
        });

        if (!res.ok) throw new Error('Erro ao enviar');

        const json = await res.json();
        state.chatMessages.push({
            ...json.data,
            sender_name: state.user.full_name
        });
        renderChatMessages();
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem');
        input.value = text; // devolve o texto
    }
}

// ============================================
// RELATÓRIOS
// ============================================

async function loadRelatorios() {
    const cardsEl = document.getElementById('reportCards');
    cardsEl.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Calculando...</div>';

    const total = state.allResidents.length;
    let altoQueda = 0, modQueda = 0, baixoQueda = 0;
    let altoUlcera = 0, modUlcera = 0, baixoUlcera = 0;
    let criticos = 0;

    state.allResidents.forEach(r => {
        const risco = calculateRisk(r);
        if (risco.fall === 'Alto') altoQueda++;
        else if (risco.fall === 'Moderado') modQueda++;
        else baixoQueda++;

        if (risco.ulcer === 'Alto') altoUlcera++;
        else if (risco.ulcer === 'Moderado') modUlcera++;
        else baixoUlcera++;

        if (getStatus(r) === 'Crítico') criticos++;
    });

    // Buscar eventos críticos da timeline (amostra dos primeiros residentes)
    let totalEventos = 0, eventosCriticos = 0;
    const eventTypes = {};
    try {
        const sample = state.allResidents.slice(0, 10);
        const results = await Promise.all(sample.map(r =>
            fetch(`/api/timeline/${r.id}`, {
                headers: { 'Authorization': `Bearer ${state.token}` }
            }).then(res => res.ok ? res.json() : { data: [] })
        ));
        results.forEach(json => {
            (json.data || []).forEach(ev => {
                totalEventos++;
                if (ev.is_critical) eventosCriticos++;
                eventTypes[ev.event_type] = (eventTypes[ev.event_type] || 0) + 1;
            });
        });
    } catch (e) { /* segue sem eventos */ }

    cardsEl.innerHTML = `
        <div class="report-card">
            <div class="report-value">${total}</div>
            <div class="report-label">Residentes Ativos</div>
        </div>
        <div class="report-card ${criticos > 0 ? 'danger' : ''}">
            <div class="report-value">${criticos}</div>
            <div class="report-label">Em Estado Crítico</div>
        </div>
        <div class="report-card ${altoQueda > 0 ? 'warning' : ''}">
            <div class="report-value">${altoQueda}</div>
            <div class="report-label">Alto Risco de Queda</div>
        </div>
        <div class="report-card ${altoUlcera > 0 ? 'warning' : ''}">
            <div class="report-value">${altoUlcera}</div>
            <div class="report-label">Alto Risco de Úlcera</div>
        </div>
        <div class="report-card">
            <div class="report-value">${totalEventos}</div>
            <div class="report-label">Eventos Registrados</div>
        </div>
        <div class="report-card ${eventosCriticos > 0 ? 'danger' : ''}">
            <div class="report-value">${eventosCriticos}</div>
            <div class="report-label">Eventos Críticos</div>
        </div>
    `;

    // Barras de risco
    renderBar('riskBars', [
        { label: 'Queda — Alto', value: altoQueda, total, color: '#ef4444' },
        { label: 'Queda — Moderado', value: modQueda, total, color: '#f59e0b' },
        { label: 'Queda — Baixo', value: baixoQueda, total, color: '#10b981' },
        { label: 'Úlcera — Alto', value: altoUlcera, total, color: '#ef4444' },
        { label: 'Úlcera — Moderado', value: modUlcera, total, color: '#f59e0b' },
        { label: 'Úlcera — Baixo', value: baixoUlcera, total, color: '#10b981' }
    ]);

    // Barras de eventos por tipo
    const evEntries = Object.entries(eventTypes).sort((a, b) => b[1] - a[1]);
    if (evEntries.length > 0) {
        const maxEv = evEntries[0][1];
        renderBar('eventBars', evEntries.map(([type, count]) => ({
            label: capitalizar(type),
            value: count,
            total: maxEv,
            color: '#0d9488'
        })));
    } else {
        document.getElementById('eventBars').innerHTML = '<p class="report-hint">Nenhum evento registrado ainda.</p>';
    }
}

function renderBar(elementId, items) {
    const el = document.getElementById(elementId);
    el.innerHTML = items.map(item => {
        const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
        return `
            <div class="bar-row">
                <div class="bar-label">${item.label}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${Math.max(pct, 2)}%; background: ${item.color};"></div>
                </div>
                <div class="bar-value">${item.value}</div>
            </div>
        `;
    }).join('');
}

// ============================================
// NAVEGAÇÃO DE PÁGINAS
// ============================================

function switchPage(pageName) {
    document.querySelectorAll('.assistencial-page').forEach(page => {
        page.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const page = document.getElementById(`page-${pageName}`);
    if (page) page.classList.add('active');

    document.querySelector(`.nav-item[onclick*="'${pageName}'"]`)?.classList.add('active');

    const titles = {
        'dashboard': 'Dashboard Assistencial',
        'residents': 'Todos os Residentes',
        'timeline': 'Timeline Clínica',
        'medicacoes': 'Medicações',
        'mensagens': 'Mensagens (Chat)',
        'relatorios': 'Relatórios'
    };

    document.getElementById('pageTitle').textContent = titles[pageName] || 'VIVARIS CARE';
    state.currentPage = pageName;

    // Carregar dados da página ao entrar
    if (pageName === 'medicacoes') loadMedicacoes();
    if (pageName === 'relatorios') loadRelatorios();
    if (pageName === 'mensagens') renderChatResidentList();
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function formatTime(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return isToday
        ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
          d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
