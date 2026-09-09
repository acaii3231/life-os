import express from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// POST /api/tasks/:taskId/subtasks - Adiciona uma micro-atividade
router.post('/tasks/:taskId/subtasks', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Título da micro-atividade é obrigatório' });
    }

    // Verifica se a tarefa pertence ao usuário
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('user_id', req.user.id)
      .single();

    if (taskErr || !task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Obtém contagem para definir posição
    const { count } = await supabase
      .from('subtasks')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId);

    const { data: subtask, error } = await supabase
      .from('subtasks')
      .insert({
        task_id: taskId,
        title: title.trim(),
        is_completed: false,
        position: (count || 0) + 1
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ subtask });
  } catch (err) {
    console.error('Erro ao adicionar micro-atividade:', err);
    res.status(500).json({ error: 'Erro ao adicionar micro-atividade' });
  }
});

// PUT /api/subtasks/:id - Atualiza ou marca/desmarca micro-atividade
router.put('/subtasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, is_completed, position } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (is_completed !== undefined) updates.is_completed = !!is_completed;
    if (position !== undefined) updates.position = position;

    const { data: subtask, error } = await supabase
      .from('subtasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ subtask });
  } catch (err) {
    console.error('Erro ao atualizar micro-atividade:', err);
    res.status(500).json({ error: 'Erro ao atualizar micro-atividade' });
  }
});

// DELETE /api/subtasks/:id - Remove micro-atividade
router.delete('/subtasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Micro-atividade removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir micro-atividade' });
  }
});

export default router;
