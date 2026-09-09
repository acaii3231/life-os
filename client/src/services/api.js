const API_BASE = '/api';

/**
 * Helper para requisições autenticadas com JWT
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('life_os_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (options.body instanceof FormData) {
    delete headers['Content-Type']; // O browser define o boundary para multipart/form-data
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('life_os_token');
    localStorage.removeItem('life_os_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Erro HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  // Autenticação
  auth: {
    login: (username, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    me: () => request('/auth/me')
  },

  // Tarefas (Kanban & Agenda)
  tasks: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/tasks${q ? `?${q}` : ''}`);
    },
    get: (id) => request(`/tasks/${id}`),
    create: (data) => request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
    notify: (id) => request(`/tasks/${id}/notify`, { method: 'POST' })
  },

  // Subtarefas (Micro-atividades estilo Trello)
  subtasks: {
    create: (taskId, title) => request(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title })
    }),
    update: (id, data) => request(`/subtasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => request(`/subtasks/${id}`, { method: 'DELETE' })
  },

  // Mídias / Anexos
  media: {
    upload: (taskId, file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request(`/tasks/${taskId}/media`, {
        method: 'POST',
        body: formData
      });
    },
    delete: (id) => request(`/media/${id}`, { method: 'DELETE' })
  },

  // Finanças
  finance: {
    getSummary: () => request('/finance/summary'),
    getTransactions: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/finance/transactions${q ? `?${q}` : ''}`);
    },
    createTransaction: (data) => request('/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    deleteTransaction: (id) => request(`/finance/transactions/${id}`, { method: 'DELETE' })
  },

  // Life Builder (Metas de Vida)
  goals: {
    list: () => request('/goals'),
    create: (data) => request('/goals', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
    createLink: (data) => request('/goals/links', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    deleteLink: (id) => request(`/goals/links/${id}`, { method: 'DELETE' })
  },

  // Nível de Vida
  lifeLevel: {
    get: () => request('/life-level')
  },

  // Configurações
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Notificações WhatsApp
  notifications: {
    getLogs: () => request('/notifications/logs'),
    sendTest: (phone) => request('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ phone })
    })
  }
};

export default api;
