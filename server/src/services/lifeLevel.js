import { supabase } from './supabase.js';

export class LifeLevelService {
  /**
   * Calcula a pontuação completa de Nível de Vida cruzando produtividade e finanças
   */
  static async calculate(userId) {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. DADOS DE TAREFAS E PRODUTIVIDADE
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, priority, due_date')
      .eq('user_id', userId);

    const { data: subtasks } = await supabase
      .from('subtasks')
      .select('id, is_completed, task_id');

    // 2. DADOS FINANCEIROS
    const { data: transactions } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId);

    // 3. DADOS DE METAS DE VIDA
    const { data: goals } = await supabase
      .from('life_goals')
      .select('target_amount, current_amount, status')
      .eq('user_id', userId);

    // --- CÁLCULO DE PRODUTIVIDADE (0 A 50 PONTOS) ---
    const allTasks = tasks || [];
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done').length;
    const overdueTasks = allTasks.filter(t => t.status !== 'done' && t.due_date < todayStr).length;
    const criticalPending = allTasks.filter(t => t.status !== 'done' && t.priority === 'critical').length;
    const doingTasks = allTasks.filter(t => t.status === 'doing').length;

    const allSubtasks = subtasks || [];
    const totalSubtasks = allSubtasks.length;
    const completedSubtasks = allSubtasks.filter(s => s.is_completed).length;

    let prodScore = 0;
    if (totalTasks > 0) {
      // Base de conclusão de tarefas (até 30 pts)
      prodScore += (completedTasks / totalTasks) * 30;
      // Bônus de micro-atividades (até 10 pts)
      if (totalSubtasks > 0) {
        prodScore += (completedSubtasks / totalSubtasks) * 10;
      } else {
        prodScore += 5;
      }
      // Bônus de engajamento em andamento (até 10 pts)
      if (doingTasks > 0) {
        prodScore += 10;
      }
      // Penalidades
      prodScore -= (overdueTasks * 12); // -12 pts por tarefa atrasada
      prodScore -= (criticalPending * 8); // -8 pts por tarefa crítica não concluída
    } else {
      prodScore = 25; // Neutro se não houver tarefas
    }
    prodScore = Math.max(0, Math.min(50, Math.round(prodScore)));

    // --- CÁLCULO FINANCEIRO (0 A 50 PONTOS) ---
    const allTx = transactions || [];
    let totalIncome = 0;
    let totalExpense = 0;

    allTx.forEach(tx => {
      const val = parseFloat(tx.amount) || 0;
      if (tx.type === 'income') totalIncome += val;
      else if (tx.type === 'expense') totalExpense += val;
    });

    const netBalance = totalIncome - totalExpense;
    let finScore = 0;

    if (totalIncome === 0 && totalExpense === 0) {
      finScore = 25; // Neutro sem transações
    } else if (netBalance < 0) {
      // Finanças no negativo: penalidade drástica
      const deficitRatio = Math.abs(netBalance) / (totalExpense || 1);
      finScore = Math.max(0, 15 - Math.round(deficitRatio * 20));
    } else {
      // Finanças saudáveis
      const savingsRate = netBalance / (totalIncome || 1); // Taxa de sobra
      // Até 35 pontos proporcionais à margem de poupança (ex: 30% de sobra = 25 pts)
      const baseSavingsScore = Math.min(35, savingsRate * 50);

      // Progresso em Metas de Vida (até 15 pontos)
      let goalsAvgProgress = 0;
      if (goals && goals.length > 0) {
        const progresses = goals.map(g => {
          const target = parseFloat(g.target_amount) || 1;
          const current = parseFloat(g.current_amount) || 0;
          return Math.min(1, current / target);
        });
        goalsAvgProgress = progresses.reduce((a, b) => a + b, 0) / progresses.length;
      }
      const goalsScore = goalsAvgProgress * 15;

      finScore = Math.min(50, Math.round(baseSavingsScore + goalsScore));
    }

    // --- SCORE GERAL (0 A 100 PONTOS) ---
    const totalScore = Math.max(0, Math.min(100, prodScore + finScore));

    // --- CLASSIFICAÇÃO DE STATUS ---
    let level = 'Normal';
    let color = '#f59e0b'; // Amarelo
    let badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    let summary = 'Vida equilibrada. Suas finanças estão estáveis e o fluxo de atividades sob controle.';

    if (totalScore < 45 || netBalance < -1000 || overdueTasks >= 3) {
      level = 'Perigoso';
      color = '#ef4444'; // Vermelho
      badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      summary = 'Atenção Crítica! Finanças no negativo ou acúmulo severo de atividades em atraso.';
    } else if (totalScore >= 75) {
      level = 'Excelente';
      color = '#10b981'; // Verde
      badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      summary = 'Alta Performance! Metas em evolução acelerada, tarefas concluídas e finanças prósperas.';
    }

    // --- RECOMENDAÇÕES INTELIGENTES ---
    const recommendations = [];
    if (totalTasks === 0 && totalIncome === 0 && totalExpense === 0) {
      summary = 'Seu Life OS está limpo e pronto! Cadastre suas metas, tarefas e receitas reais para iniciar o acompanhamento.';
      recommendations.push('Comece criando suas primeiras Metas de Vida no Life Builder e agendando atividades no Kanban.');
      recommendations.push('Lance suas receitas e despesas no Painel Financeiro para calcular seu Nível de Vida.');
    } else {
      if (overdueTasks > 0) {
        recommendations.push(`Você tem ${overdueTasks} atividade(s) atrasada(s). Conclua ou reagende para recuperar até ${overdueTasks * 12} pontos.`);
      }
      if (criticalPending > 0) {
        recommendations.push(`Atenção a ${criticalPending} tarefa(s) com prioridade Crítica pendente(s).`);
      }
      if (netBalance < 0) {
        recommendations.push(`Saldo mensal negativo em R$ ${Math.abs(netBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Corte despesas supérfluas imediatamente.`);
      } else if (netBalance > 1000) {
        recommendations.push(`Superávit de R$ ${netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Aproveite para fazer um aporte em suas Metas de Vida.`);
      }
      if (recommendations.length === 0) {
        recommendations.push('Ritmo exemplar! Mantenha a consistência no Kanban e a disciplina nos aportes financeiros.');
      }
    }

    return {
      score: totalScore,
      level,
      color,
      badgeClass,
      summary,
      metrics: {
        productivity: {
          score: prodScore,
          max: 50,
          totalTasks,
          completedTasks,
          doingTasks,
          overdueTasks,
          criticalPending,
          totalSubtasks,
          completedSubtasks
        },
        financial: {
          score: finScore,
          max: 50,
          totalIncome,
          totalExpense,
          netBalance,
          savingsRate: totalIncome > 0 ? (netBalance / totalIncome) : 0,
          goalsCount: goals?.length || 0
        }
      },
      recommendations
    };
  }
}

export default LifeLevelService;
