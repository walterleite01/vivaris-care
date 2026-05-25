// ============================================
// APP CONFIG - Detecta ambiente e configura API
// ============================================

const APP_CONFIG = {
  isDev: window.location.hostname === 'localhost',
  apiBase: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : `${window.location.protocol}//${window.location.hostname}/api`,
  
  // Token do localStorage
  getToken() {
    return localStorage.getItem('token');
  },
  
  // Headers padrão
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    };
  },
  
  // Fazer requisição
  async request(method, endpoint, data = null) {
    const url = `${this.apiBase}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : null
      });
      
      if (response.status === 401) {
        window.location.href = '/';
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error: ${method} ${endpoint}`, error);
      alert('Erro ao conectar com API');
      return null;
    }
  }
};
