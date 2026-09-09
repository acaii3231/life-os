import express from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/settings - Retorna todas as configurações do usuário
router.get('/', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const map = {
      plugsend_api_url: 'https://api.plugsend.com',
      plugsend_token: '',
      plugsend_phone: '5511999999999',
      plugsend_simulation_mode: 'true',
      notify_due_tasks: 'true',
      notify_critical_tasks: 'true'
    };

    if (settings) {
      settings.forEach(s => {
        map[s.key] = s.value;
      });
    }

    res.json({ settings: map });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

// POST /api/settings - Salva ou atualiza configurações
router.post('/', async (req, res) => {
  try {
    const entries = req.body; // { key: value, ... }

    if (!entries || typeof entries !== 'object') {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const updates = Object.keys(entries).map(key => ({
      user_id: req.user.id,
      key,
      value: String(entries[key]),
      updated_at: new Date().toISOString()
    }));

    for (const item of updates) {
      await supabase
        .from('settings')
        .upsert(item, { onConflict: 'user_id,key' });
    }

    res.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

export default router;
