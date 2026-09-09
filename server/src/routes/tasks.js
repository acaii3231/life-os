import express from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from './auth.js';
import { PlugSendService } from '../services/plugsend.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/tasks - Lista todas as tarefas com resumo de micro-atividades e anexos
router.get('/', async (req, res) => {
  try {
    const { status, due_date, priority } = req.query;

    let query = supabase
      .from('tasks')
      .select('*, subtasks(*), media(*)')
      .eq('user_id', req.user.id)
      .order('due_date', { ascending: true });

    if (status) query = query.eq('status', status);
    if (due_date) query = query.eq('due_date', due_date);
    if (priority) query = query.eq('priority', priority);

    const { data: tasks, error } = await query;

    if (error) throw error;

    // Enriquece com contadores para a visualização no Kanban e Calendário
    const enriched = tasks.map(task => {
      const subtasks = task.subtasks || [];
      const totalSubtasks = subtasks.length;
      const completedSubtasks = subtasks.filter(s => s.is_completed).length;
      const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

      return {
        ...task,
        subtasks,
        media: task.media || [],
        totalSubtasks,
        completedSubtasks,
        progress
      };
    });

    res.json({ tasks: enriched });
  } catch (err) {
    console.error('Erro ao buscar tarefas:', err);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

// GET /api/tasks/:id - Busca tarefa detalhada
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*), media(*)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Ordena subtarefas por posição
    if (task.subtasks) {
      task.subtasks.sort((a, b) => (a.position || 0) - (b.position || 0));
    }

    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar detalhes da tarefa' });
  }
});

// POST /api/tasks - Cria nova atividade (reflete na Agenda e no Kanban)
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      due_date,
      due_time,
      priority = 'medium',
      status = 'todo',
      category = 'Geral',
      color = '#3b82f6',
      notify_whatsapp = true,
      initial_subtasks = []
    } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({ error: 'Título e data limite são obrigatórios' });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: req.user.id,
        title,
        description,
        due_date,
        due_time,
        priority,
        status,
        category,
        color,
        notify_whatsapp: !!notify_whatsapp
      })
      .select()
      .single();

    if (error) throw error;

    // Se foram enviadas micro-atividades iniciais
    if (initial_subtasks && Array.isArray(initial_subtasks) && initial_subtasks.length > 0) {
      const subtaskRecords = initial_subtasks.map((sub, idx) => ({
        task_id: task.id,
        title: typeof sub === 'string' ? sub : sub.title,
        is_completed: typeof sub === 'object' ? !!sub.is_completed : false,
        position: idx + 1
      }));

      await supabase.from('subtasks').insert(subtaskRecords);
    }

    // Se for prioridade crítica e notificação ativa, dispara WhatsApp
    if (priority === 'critical' && notify_whatsapp) {
      PlugSendService.sendTaskAlert(req.user.id, task, 'critica').catch(err => {
        console.error('Erro no disparo WhatsApp imediato:', err);
      });
    }

    res.status(201).json({ task });
  } catch (err) {
    console.error('Erro ao criar tarefa:', err);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

// PUT /api/tasks/:id - Atualiza tarefa (status, datas, etc.)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    // Remove campos calculados ou aninhados
    delete updates.id;
    delete updates.user_id;
    delete updates.subtasks;
    delete updates.media;
    delete updates.totalSubtasks;
    delete updates.completedSubtasks;
    delete updates.progress;

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// DELETE /api/tasks/:id - Remove tarefa
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Tarefa removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
});

// POST /api/tasks/:id/notify - Disparo manual de WhatsApp via Plugsend
router.post('/:id/notify', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const result = await PlugSendService.sendTaskAlert(req.user.id, task, 'manual');

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao disparar notificação WhatsApp' });
  }
});

export default router;
