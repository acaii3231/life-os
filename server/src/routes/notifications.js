import express from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from './auth.js';
import { PlugSendService } from '../services/plugsend.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/notifications/logs - Histórico de mensagens enviadas
router.get('/logs', async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('notification_logs')
      .select('*, tasks(title, priority)')
      .eq('user_id', req.user.id)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ logs: logs || [] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter histórico de notificações' });
  }
});

// POST /api/notifications/test - Envia mensagem de teste para o WhatsApp
router.post('/test', async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await PlugSendService.sendTestMessage(req.user.id, phone);
    res.json(result);
  } catch (err) {
    console.error('Erro ao enviar teste Plugsend:', err);
    res.status(500).json({ error: 'Erro ao disparar mensagem de teste' });
  }
});

export default router;
