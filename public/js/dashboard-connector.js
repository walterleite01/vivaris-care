/* ============================================
   DASHBOARD CONNECTOR - Conecta à API Real
   ============================================ */

class DashboardConnector {
  constructor() {
    this.apiBase = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api'
      : `${window.location.protocol}//${window.location.hostname}/api`;
    
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  // ============================================
  // RESIDENTES
  // ============================================

  async createResident(data) {
    return this.request('POST', '/residents', data);
  }

  async getResidents() {
    return this.request('GET', '/residents');
  }

  async getResidentById(id) {
    return this.request('GET', `/residents/${id}`);
  }

  // ============================================
  // ATIVIDADES
  // ============================================

  async createActivity(residentId, activityType, description) {
    return this.request('POST', '/activities', {
      resident_id: residentId,
      activity_type: activityType,
      description: description
    });
  }

  async getActivities(residentId) {
    return this.request('GET', `/activities/resident/${residentId}`);
  }

  async getTodayActivities(residentId) {
    return this.request('GET', `/activities/resident/${residentId}/today`);
  }

  // ============================================
  // MENSAGENS
  // ============================================

  async sendMessage(residentId, messageText, recipientIds = []) {
    return this.request('POST', '/messages', {
      resident_id: residentId,
      message_text: messageText,
      recipient_ids: recipientIds
    });
  }

  async getMessages(residentId) {
    return this.request('GET', `/messages/resident/${residentId}`);
  }

  async getUnreadMessages() {
    return this.request('GET', '/messages/unread');
  }

  // ============================================
  // HELPER
  // ============================================

  async request(method, endpoint, data = null) {
    const url = `${this.apiBase}${endpoint}`;

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return null;
      }

      const result = await response.json();

      if (!response.ok) {
        console.error(`API Error: ${result.error}`);
        alert(result.error || 'Erro na API');
        return null;
      }

      return result;

    } catch (error) {
      console.error(`Fetch Error: ${error}`);
      alert('Erro ao conectar com servidor');
      return null;
    }
  }
}

// Instância global
const dashApi = new DashboardConnector();
