import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ArrowRight, 
  AlertCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import LifeLevelGauge from '../components/LifeLevelGauge';

export function DashboardPage({ 
  lifeLevel, 
  tasks = [], 
  financeSummary = {}, 
  goals = [], 
  onRefresh, 
  onOpenTaskModal,
  onOpenGoalModal,
  onOpenTransactionModal,
  onSelectTab 
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Tarefas para hoje ou urgentes
  const todayTasks = tasks.filter(t => t.due_date === todayStr);
  const urgentTasks = tasks.filter(t => t.priority === 'critical' || (t.status !== 'done' && t.due_date < todayStr));

  const metrics = financeSummary.metrics || {};
  const totalIncome = metrics.totalIncome || 0;
  const totalExpense = metrics.totalExpense || 0;
  const netBalance = metrics.netBalance || 0;

  const completedTasksCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Algoritmo de Nível de Vida - HUD Superior */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Classificador de Nível de Vida
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <LifeLevelGauge data={lifeLevel} onRefresh={onRefresh} />
      </section>

      {/* 2. Barra de Atalhos Rápidos */}
      <section className="flex flex-wrap items-center justify-between gap-3 bg-dark-900/40 p-3 rounded-2xl border border-white/5">
        <span className="text-xs font-semibold text-slate-300">Ações Rápidas:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenTaskModal({ due_date: todayStr, priority: 'medium', status: 'todo' })}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-glow-emerald"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Atividade
          </button>
          <button
            onClick={onOpenTransactionModal}
            className="px-3 py-1.5 rounded-xl bg-cyber-blue text-dark-950 text-xs font-bold hover:bg-sky-400 transition-all flex items-center gap-1.5 shadow-glow-cyan"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Nova Transação
          </button>
          <button
            onClick={onOpenGoalModal}
            className="px-3 py-1.5 rounded-xl bg-dark-950 text-slate-200 border border-white/10 text-xs font-semibold hover:border-emerald-500/40 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            Nova Meta de Vida
          </button>
        </div>
      </section>

      {/* 3. Cards de Métricas Principais (KPIs) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Líquido */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Saldo Líquido</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className={`text-2xl font-extrabold font-mono tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Receitas R$ {totalIncome.toLocaleString('pt-BR')} | Despesas R$ {totalExpense.toLocaleString('pt-BR')}
          </span>
        </div>

        {/* Produtividade */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tarefas Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-cyber-blue" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono tracking-tight text-white">
              {completedTasksCount} <span className="text-sm font-normal text-slate-500">/ {tasks.length}</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            {tasks.length > 0 ? `${Math.round((completedTasksCount / tasks.length) * 100)}% de taxa de conclusão` : 'Sem tarefas criadas'}
          </span>
        </div>

        {/* Tarefas Críticas / Atrasadas */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Atenção Imediata</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <span className={`text-2xl font-extrabold font-mono tracking-tight ${urgentTasks.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {urgentTasks.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Tarefas críticas ou em atraso
          </span>
        </div>

        {/* Metas de Vida */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Metas no Life Builder</span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono tracking-tight text-white">
              {goals.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Curto, médio e longo prazo ativas
          </span>
        </div>
      </section>

      {/* 4. Duas Colunas: Atividades Recentes e Metas do Life Builder */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades Prioritárias e Hoje */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Foco do Dia & Urgências</h3>
            </div>
            <button
              onClick={() => onSelectTab('kanban')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              Ver Kanban <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-80">
            {tasks.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl">
                <Clock className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Nenhuma atividade agendada ainda.</p>
                <button
                  onClick={() => onOpenTaskModal({ due_date: todayStr, priority: 'medium', status: 'todo' })}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all border border-emerald-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Primeira Atividade</span>
                </button>
              </div>
            ) : (
              tasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  onClick={() => onOpenTaskModal(task)}
                  className="p-3 rounded-xl bg-dark-900/70 border border-white/5 hover:border-emerald-500/30 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === 'critical' ? 'bg-rose-500 animate-pulse' :
                      task.priority === 'high' ? 'bg-amber-400' :
                      task.status === 'done' ? 'bg-emerald-400' : 'bg-blue-400'
                    }`} />
                    <div className="truncate">
                      <span className={`text-xs font-semibold text-slate-200 block truncate ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Prazo: {task.due_date} {task.due_time || ''}</span>
                        {task.totalSubtasks > 0 && (
                          <span className="text-emerald-400/80 font-mono">
                            {task.completedSubtasks}/{task.totalSubtasks} checklist
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                    task.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    task.status === 'doing' ? 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {task.status === 'done' ? 'Concluído' : task.status === 'doing' ? 'Fazendo' : 'A Fazer'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Metas de Vida (Life Builder Preview) */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-white text-sm">Life Builder (Metas Estratégicas)</h3>
            </div>
            <button
              onClick={() => onSelectTab('life-builder')}
              className="text-xs text-purple-400 hover:underline flex items-center gap-1"
            >
              Abrir Mapa Mental <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-80">
            {goals.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl">
                <Target className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Nenhuma meta de vida criada ainda.</p>
                <button
                  onClick={() => onOpenGoalModal(null)}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition-all border border-purple-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Primeira Meta de Vida</span>
                </button>
              </div>
            ) : (
              goals.map(g => {
                const target = parseFloat(g.target_amount) || 0;
                const current = parseFloat(g.current_amount) || 0;
                const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

                const horizonLabel = {
                  short_term: 'Curto Prazo',
                  medium_term: 'Médio Prazo',
                  long_term: 'Longo Prazo'
                }[g.horizon] || 'Geral';

                return (
                  <div key={g.id} className="p-3 rounded-xl bg-dark-900/70 border border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color || '#10b981' }} />
                        <span className="text-xs font-bold text-slate-200">{g.title}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-dark-950 px-2 py-0.5 rounded border border-white/5">
                        {horizonLabel}
                      </span>
                    </div>

                    {target > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-slate-400">
                          <span>R$ {current.toLocaleString('pt-BR')}</span>
                          <span className="text-emerald-400 font-bold">{pct}%</span>
                          <span>Meta: R$ {target.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="w-full bg-dark-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: g.color || '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
