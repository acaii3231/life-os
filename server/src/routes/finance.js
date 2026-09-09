import express from 'express';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/finance/transactions - Lista transações com filtros
router.get('/transactions', async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;

    let query = supabase
      .from('transactions')
      .select('*, life_goals(id, title)')
      .eq('user_id', req.user.id)
      .order('transaction_date', { ascending: false });

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);

    const { data: transactions, error } = await query;

    if (error) throw error;

    res.json({ transactions });
  } catch (err) {
    console.error('Erro ao buscar transações:', err);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// POST /api/finance/transactions - Cria transação
router.post('/transactions', async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      transaction_date,
      is_paid = true,
      goal_id = null
    } = req.body;

    if (!type || !amount || !description || !category) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valor deve ser um número positivo' });
    }

    const { data: tx, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type,
        amount: numAmount,
        category,
        description,
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        is_paid: !!is_paid,
        goal_id: goal_id ? parseInt(goal_id) : null
      })
      .select()
      .single();

    if (error) throw error;

    // Se vinculado a uma meta de vida e for aporte/despesa/investimento
    if (goal_id) {
      const { data: goal } = await supabase
        .from('life_goals')
        .select('current_amount')
        .eq('id', goal_id)
        .single();

      if (goal) {
        const newCurrent = (parseFloat(goal.current_amount) || 0) + numAmount;
        await supabase
          .from('life_goals')
          .update({ current_amount: newCurrent })
          .eq('id', goal_id);
      }
    }

    res.status(201).json({ transaction: tx });
  } catch (err) {
    console.error('Erro ao registrar transação:', err);
    res.status(500).json({ error: 'Erro ao registrar transação' });
  }
});

// DELETE /api/finance/transactions/:id - Exclui transação
router.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Busca antes para reverter meta se aplicável
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!tx) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    if (tx.goal_id) {
      const { data: goal } = await supabase
        .from('life_goals')
        .select('current_amount')
        .eq('id', tx.goal_id)
        .single();

      if (goal) {
        const newCurrent = Math.max(0, (parseFloat(goal.current_amount) || 0) - parseFloat(tx.amount));
        await supabase
          .from('life_goals')
          .update({ current_amount: newCurrent })
          .eq('id', tx.goal_id);
      }
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Transação excluída' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

// GET /api/finance/summary - Dashboard financeiro com métricas e gráficos
router.get('/summary', async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};
    const timelineMap = {};

    transactions.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
      }

      // Agrupa por mês ou data para o gráfico de fluxo
      const monthKey = t.transaction_date.substring(0, 7); // YYYY-MM
      if (!timelineMap[monthKey]) {
        timelineMap[monthKey] = { month: monthKey, receitas: 0, despesas: 0, saldo: 0 };
      }
      if (t.type === 'income') {
        timelineMap[monthKey].receitas += amount;
      } else {
        timelineMap[monthKey].despesas += amount;
      }
      timelineMap[monthKey].saldo = timelineMap[monthKey].receitas - timelineMap[monthKey].despesas;
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0';

    const byCategory = Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: categoryTotals[cat]
    })).sort((a, b) => b.value - a.value);

    const timeline = Object.values(timelineMap).sort((a, b) => a.month.localeCompare(b.month));

    // Metas de vida para vincular no painel
    const { data: goals } = await supabase
      .from('life_goals')
      .select('id, title, horizon, target_amount, current_amount, color, status')
      .eq('user_id', req.user.id);

    res.json({
      metrics: {
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate: parseFloat(savingsRate)
      },
      byCategory,
      timeline,
      goals: goals || []
    });
  } catch (err) {
    console.error('Erro ao gerar resumo financeiro:', err);
    res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
  }
});

export default router;
