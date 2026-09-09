import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import subtaskRoutes from './routes/subtasks.js';
import mediaRoutes from './routes/media.js';
import financeRoutes from './routes/finance.js';
import goalRoutes from './routes/goals.js';
import settingsRoutes from './routes/settings.js';
import notificationRoutes from './routes/notifications.js';
import lifeLevelRoutes from './routes/lifeLevel.js';
import { supabase } from './services/supabase.js';
import { PlugSendService } from './services/plugsend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Life OS Backend',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'standalone-node',
    time: new Date().toISOString()
  });
});

// Endpoint para Cron Job (Vercel Crons & Webhooks)
app.get('/api/cron/notifications', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('notify_whatsapp', true)
      .neq('status', 'done')
      .is('notified_at', null);

    if (error || !tasks || tasks.length === 0) {
      return res.json({ status: 'ok', message: 'Nenhuma tarefa pendente de notificação' });
    }

    const dispatched = [];
    for (const task of tasks) {
      const isToday = task.due_date === todayStr;
      const isPast = task.due_date < todayStr;
      const isCritical = task.priority === 'critical';

      if (isToday || isPast || isCritical) {
        const trigger = isPast ? 'atrasada' : (isCritical ? 'critica' : 'vencimento');
        const alertResult = await PlugSendService.sendTaskAlert(task.user_id, task, trigger);
        await supabase
          .from('tasks')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', task.id);
        dispatched.push({ taskId: task.id, title: task.title, trigger, alertResult });
      }
    }

    res.json({ status: 'ok', processed: dispatched.length, dispatched });
  } catch (err) {
    console.error('Erro no cron de notificações:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', subtaskRoutes);
app.use('/api', mediaRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/life-level', lifeLevelRoutes);

// Servir frontend compilado se existir (para execução standalone local)
const rootDistPath = path.join(__dirname, '../../dist');
const clientDistPath = path.join(__dirname, '../../client/dist');
const finalDist = fs.existsSync(rootDistPath) ? rootDistPath : (fs.existsSync(clientDistPath) ? clientDistPath : null);

if (finalDist) {
  app.use(express.static(finalDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(finalDist, 'index.html'));
  });
}

export default app;
