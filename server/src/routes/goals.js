import express from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/goals - Retorna metas e conexões do Life Builder
router.get('/', async (req, res) => {
  try {
    const { data: goals, error: goalsErr } = await supabase
      .from('life_goals')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (goalsErr) throw goalsErr;

    // Busca conexões entre as metas
    const { data: links, error: linksErr } = await supabase
      .from('life_goal_links')
      .select('*');

    if (linksErr) throw linksErr;

    res.json({ goals: goals || [], links: links || [] });
  } catch (err) {
    console.error('Erro ao buscar metas do Life Builder:', err);
    res.status(500).json({ error: 'Erro ao buscar metas de vida' });
  }
});

// POST /api/goals - Cria meta
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      horizon = 'short_term',
      target_date,
      target_amount = 0,
      current_amount = 0,
      status = 'in_progress',
      color = '#10b981',
      x_pos = 200,
      y_pos = 200,
      parent_id = null
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título da meta é obrigatório' });
    }

    const { data: goal, error } = await supabase
      .from('life_goals')
      .insert({
        user_id: req.user.id,
        title,
        description,
        horizon,
        target_date,
        target_amount: parseFloat(target_amount) || 0,
        current_amount: parseFloat(current_amount) || 0,
        status,
        color,
        x_pos: parseFloat(x_pos) || 200,
        y_pos: parseFloat(y_pos) || 200,
        parent_id: parent_id ? parseInt(parent_id) : null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ goal });
  } catch (err) {
    console.error('Erro ao criar meta:', err);
    res.status(500).json({ error: 'Erro ao criar meta de vida' });
  }
});

// PUT /api/goals/:id - Atualiza meta (inclusive coordenadas X/Y no mapa mental)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    delete updates.id;
    delete updates.user_id;

    const { data: goal, error } = await supabase
      .from('life_goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ goal });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

// DELETE /api/goals/:id - Exclui meta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('life_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Meta removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir meta' });
  }
});

// POST /api/goals/links - Conecta duas metas no fluxograma
router.post('/links', async (req, res) => {
  try {
    const { source_goal_id, target_goal_id, relationship_type = 'dependency' } = req.body;

    if (!source_goal_id || !target_goal_id) {
      return res.status(400).json({ error: 'IDs de origem e destino são obrigatórios' });
    }

    const { data: link, error } = await supabase
      .from('life_goal_links')
      .insert({
        source_goal_id,
        target_goal_id,
        relationship_type
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ link });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar conexão entre metas' });
  }
});

// DELETE /api/goals/links/:id - Remove conexão entre metas
router.delete('/links/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('life_goal_links')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Conexão removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir conexão' });
  }
});

export default router;
