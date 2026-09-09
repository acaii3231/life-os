import { supabase } from './supabase.js';
import { PlugSendService } from './plugsend.js';
import { LifeLevelService } from './lifeLevel.js';

export const api = {
  // Autenticação
  auth: {
    login: async (username, password) => {
      const u = username?.trim().toLowerCase();
      if (u === 'venom' && password === 'venom198') {
        const user = { id: 1, username: 'venom', name: 'Administrador Venom', role: 'admin' };
        const fakeToken = 'life_os_session_token_' + Date.now();
        localStorage.setItem('life_os_token', fakeToken);
        localStorage.setItem('life_os_user', JSON.stringify(user));
        return { success: true, token: fakeToken, user };
      }
      throw new Error('Usuário ou senha incorretos (Use: venom / venom198)');
    },
    me: async () => {
      const saved = localStorage.getItem('life_os_user');
      return { user: saved ? JSON.parse(saved) : null };
    }
  },

  // Tarefas (Kanban & Agenda)
  tasks: {
    list: async (params = {}) => {
      let query = supabase
        .from('tasks')
        .select('*, subtasks(*), media(*)')
        .order('due_date', { ascending: true });

      if (params.status) query = query.eq('status', params.status);
      if (params.due_date) query = query.eq('due_date', params.due_date);
      if (params.priority) query = query.eq('priority', params.priority);

      const { data: tasks, error } = await query;
      if (error) throw error;

      const enriched = (tasks || []).map(task => {
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

      return { tasks: enriched };
    },

    get: async (id) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID da tarefa inválido para busca');
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*, subtasks(*), media(*)')
        .eq('id', numId)
        .single();

      if (error) throw error;
      if (task?.subtasks) {
        task.subtasks.sort((a, b) => (a.position || 0) - (b.position || 0));
      }
      return { task };
    },

    create: async (data) => {
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
      } = data;

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          user_id: 1,
          title: title || 'Sem título',
          description: description || '',
          due_date: due_date || null,
          due_time: due_time || null,
          priority,
          status,
          category: category || 'Geral',
          color,
          notify_whatsapp: !!notify_whatsapp
        })
        .select()
        .single();

      if (error) throw error;

      if (initial_subtasks && initial_subtasks.length > 0) {
        const subtaskRecords = initial_subtasks.map((sub, idx) => ({
          task_id: task.id,
          title: typeof sub === 'string' ? sub : (sub.title || 'Micro-atividade'),
          is_completed: typeof sub === 'object' ? !!sub.is_completed : false,
          position: idx + 1
        }));
        await supabase.from('subtasks').insert(subtaskRecords);
      }

      if (priority === 'critical' && notify_whatsapp) {
        PlugSendService.sendTaskAlert(1, task, 'critica').catch(console.error);
      }

      return { task };
    },

    update: async (id, data) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) {
        throw new Error('ID da tarefa inválido para atualização');
      }

      const updates = { ...data, updated_at: new Date().toISOString() };
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
        .eq('id', numId)
        .select()
        .single();

      if (error) throw error;
      return { task };
    },

    delete: async (id) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID da tarefa inválido para exclusão');
      const { error } = await supabase.from('tasks').delete().eq('id', numId);
      if (error) throw error;
      return { success: true };
    },

    notify: async (id) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID da tarefa inválido para notificação');
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', numId)
        .single();

      if (error || !task) throw new Error('Tarefa não encontrada');
      return await PlugSendService.sendTaskAlert(1, task, 'manual');
    }
  },

  // Subtarefas / Checklists
  subtasks: {
    create: async (taskId, title) => {
      const numTaskId = parseInt(taskId, 10);
      if (!numTaskId || isNaN(numTaskId)) {
        throw new Error('Salve a tarefa antes de adicionar micro-atividades');
      }

      const { count } = await supabase
        .from('subtasks')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', numTaskId);

      const { data: subtask, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: numTaskId,
          title: title.trim(),
          is_completed: false,
          position: (count || 0) + 1
        })
        .select()
        .single();

      if (error) throw error;
      return { subtask };
    },

    update: async (id, data) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID da subtarefa inválido');
      const updates = { ...data, updated_at: new Date().toISOString() };
      const { data: subtask, error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', numId)
        .select()
        .single();

      if (error) throw error;
      return { subtask };
    },

    delete: async (id) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID da subtarefa inválido');
      const { error } = await supabase.from('subtasks').delete().eq('id', numId);
      if (error) throw error;
      return { success: true };
    }
  },

  // Mídias / Anexos
  media: {
    upload: async (taskId, file) => {
      const numTaskId = parseInt(taskId, 10);
      if (!numTaskId || isNaN(numTaskId)) {
        throw new Error('Salve a atividade antes de anexar arquivos.');
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result;
            const { data: media, error } = await supabase
              .from('media')
              .insert({
                task_id: numTaskId,
                user_id: 1,
                original_name: file.name,
                filename: file.name,
                file_path: dataUrl,
                mime_type: file.type,
                file_size: file.size
              })
              .select()
              .single();

            if (error) throw error;
            resolve({ media });
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    },

    delete: async (id) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID do anexo inválido');
      const { error } = await supabase.from('media').delete().eq('id', numId);
      if (error) throw error;
      return { success: true };
    }
  },

  // Finanças
  finance: {
    getSummary: async () => {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', 1)
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      let totalIncome = 0;
      let totalExpense = 0;
      const categoryTotals = {};
      const timelineMap = {};

      (transactions || []).forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpense += amount;
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
        }

        const monthKey = t.transaction_date?.substring(0, 7) || 'Atual';
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

      const { data: goals } = await supabase
        .from('life_goals')
        .select('id, title, horizon, target_amount, current_amount, color, status')
        .eq('user_id', 1);

      return {
        metrics: {
          totalIncome,
          totalExpense,
          netBalance,
          savingsRate: parseFloat(savingsRate)
        },
        byCategory,
        timeline,
        goals: goals || []
      };
    },

    getTransactions: async (params = {}) => {
      let query = supabase
        .from('transactions')
        .select('*, life_goals(id, title)')
        .eq('user_id', 1)
        .order('transaction_date', { ascending: false });

      if (params.type && params.type !== 'all') query = query.eq('type', params.type);
      if (params.category) query = query.eq('category', params.category);

      const { data: transactions, error } = await query;
      if (error) throw error;
      return { transactions: transactions || [] };
    },

    createTransaction: async (data) => {
      const numAmount = parseFloat(data.amount);
      const goalId = data.goal_id ? parseInt(data.goal_id) : null;

      const { data: tx, error } = await supabase
        .from('transactions')
        .insert({
          user_id: 1,
          type: data.type,
          amount: numAmount,
          category: data.category,
          description: data.description,
          transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
          is_paid: true,
          goal_id: goalId
        })
        .select()
        .single();

      if (error) throw error;

      if (goalId) {
        const { data: goal } = await supabase
          .from('life_goals')
          .select('current_amount')
          .eq('id', goalId)
          .single();

        if (goal) {
          const newCurrent = (parseFloat(goal.current_amount) || 0) + numAmount;
          await supabase.from('life_goals').update({ current_amount: newCurrent }).eq('id', goalId);
        }
      }

      return { transaction: tx };
    },

    deleteTransaction: async (id) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID da transação inválido');

      const { data: tx } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', numId)
        .single();

      if (!tx) throw new Error('Transação não encontrada');

      if (tx.goal_id) {
        const { data: goal } = await supabase
          .from('life_goals')
          .select('current_amount')
          .eq('id', tx.goal_id)
          .single();

        if (goal) {
          const newCurrent = Math.max(0, (parseFloat(goal.current_amount) || 0) - parseFloat(tx.amount));
          await supabase.from('life_goals').update({ current_amount: newCurrent }).eq('id', tx.goal_id);
        }
      }

      const { error } = await supabase.from('transactions').delete().eq('id', numId);
      if (error) throw error;
      return { success: true };
    }
  },

  // Life Builder (Metas de Vida)
  goals: {
    list: async () => {
      const { data: goals, error: goalsErr } = await supabase
        .from('life_goals')
        .select('*')
        .eq('user_id', 1)
        .order('created_at', { ascending: true });

      if (goalsErr) throw goalsErr;

      const { data: links, error: linksErr } = await supabase
        .from('life_goal_links')
        .select('*');

      if (linksErr) throw linksErr;

      return { goals: goals || [], links: links || [] };
    },

    create: async (data) => {
      const { data: goal, error } = await supabase
        .from('life_goals')
        .insert({
          user_id: 1,
          title: data.title,
          description: data.description,
          horizon: data.horizon || 'short_term',
          target_date: data.target_date || null,
          target_amount: parseFloat(data.target_amount) || 0,
          current_amount: parseFloat(data.current_amount) || 0,
          status: data.status || 'in_progress',
          color: data.color || '#10b981',
          x_pos: parseFloat(data.x_pos) || 200,
          y_pos: parseFloat(data.y_pos) || 200,
          parent_id: data.parent_id ? parseInt(data.parent_id) : null
        })
        .select()
        .single();

      if (error) throw error;
      return { goal };
    },

    update: async (id, data) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID da meta inválido');

      const updates = { ...data, updated_at: new Date().toISOString() };
      delete updates.id;
      delete updates.user_id;

      const { data: goal, error } = await supabase
        .from('life_goals')
        .update(updates)
        .eq('id', numId)
        .select()
        .single();

      if (error) throw error;
      return { goal };
    },

    delete: async (id) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID da meta inválido');
      const { error } = await supabase.from('life_goals').delete().eq('id', numId);
      if (error) throw error;
      return { success: true };
    },

    createLink: async (data) => {
      const { data: link, error } = await supabase
        .from('life_goal_links')
        .insert({
          source_goal_id: data.source_goal_id,
          target_goal_id: data.target_goal_id,
          relationship_type: data.relationship_type || 'dependency'
        })
        .select()
        .single();

      if (error) throw error;
      return { link };
    },

    deleteLink: async (id) => {
      const numId = parseInt(id, 10);
      if (!numId || isNaN(numId)) throw new Error('ID do vínculo inválido');
      const { error } = await supabase.from('life_goal_links').delete().eq('id', numId);
      if (error) throw error;
      return { success: true };
    }
  },

  // Nível de Vida
  lifeLevel: {
    get: async () => {
      return await LifeLevelService.calculate(1);
    }
  },

  // Configurações
  settings: {
    get: async () => {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('key, value')
        .eq('user_id', 1);

      if (error) throw error;

      const map = {
        plugsend_api_url: 'https://api.plugsend.com',
        plugsend_token: '',
        plugsend_phone: '5511999999999',
        plugsend_simulation_mode: 'false',
        notify_due_tasks: 'true',
        notify_critical_tasks: 'true'
      };

      if (settings) {
        settings.forEach(s => {
          map[s.key] = s.value;
        });
      }

      return { settings: map };
    },

    update: async (entries) => {
      const updates = Object.keys(entries).map(key => ({
        user_id: 1,
        key,
        value: String(entries[key]),
        updated_at: new Date().toISOString()
      }));

      for (const item of updates) {
        await supabase.from('settings').upsert(item, { onConflict: 'user_id,key' });
      }

      return { success: true };
    }
  },

  // Notificações WhatsApp
  notifications: {
    getLogs: async () => {
      const { data: logs, error } = await supabase
        .from('notification_logs')
        .select('*, tasks(title, priority)')
        .eq('user_id', 1)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return { logs: logs || [] };
    },

    sendTest: async (phone) => {
      return await PlugSendService.sendTestMessage(1, phone);
    }
  }
};

export default api;
