import React, { useState } from 'react';
import { 
  Plus, 
  CheckSquare, 
  Paperclip, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Send,
  MoreVertical,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import api from '../services/api';

export function KanbanPage({ tasks = [], onOpenTaskModal, onTaskUpdated, onTriggerWhatsApp }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const columns = [
    { id: 'todo', title: 'A Fazer', icon: '📋', color: 'border-slate-700/50', badge: 'bg-slate-800 text-slate-300' },
    { id: 'doing', title: 'Fazendo', icon: '⚡', color: 'border-cyan-500/30', badge: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30' },
    { id: 'done', title: 'Concluído', icon: '✅', color: 'border-emerald-500/30', badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' }
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    try {
      await api.tasks.update(taskId, { status: targetStatus });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao mover tarefa: ' + err.message);
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleMoveStatus = async (task, newStatus) => {
    try {
      await api.tasks.update(task.id, { status: newStatus });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header do Kanban */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Quadro Kanban Operacional
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sincronizado automaticamente com a sua Agenda. Gerencie micro-atividades antes de concluir.
          </p>
        </div>

        <button
          onClick={() => onOpenTaskModal({ due_date: todayStr, priority: 'medium', status: 'todo' })}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-glow-emerald"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Cartão</span>
        </button>
      </div>

      {/* 3 Colunas do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="glass-panel rounded-2xl border border-white/5 flex flex-col min-h-[550px] bg-dark-900/40 p-4 transition-colors hover:border-white/10"
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.icon}</span>
                  <h3 className="font-bold text-sm text-slate-200 tracking-wide">
                    {col.title}
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Lista de Cartões */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-600 text-xs border-2 border-dashed border-white/5 rounded-xl">
                    <span>Arraste ou crie uma tarefa aqui</span>
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isOverdue = task.status !== 'done' && task.due_date < todayStr;
                    const hasSubtasks = task.totalSubtasks > 0;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onOpenTaskModal(task)}
                        className={`bg-dark-950/90 rounded-xl p-4 border border-white/5 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing transition-all shadow-md group space-y-3 relative ${
                          isOverdue ? 'ring-1 ring-rose-500/40' : ''
                        }`}
                      >
                        {/* Topo do Cartão: Categoria e Prioridade */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium px-2 py-0.5 rounded bg-dark-900 border border-white/5">
                            {task.category || 'Geral'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            task.priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' :
                            task.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                            task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                            'bg-slate-500/20 text-slate-400 border-slate-500/40'
                          }`}>
                            {task.priority === 'critical' ? '🔥 Crítica' : task.priority}
                          </span>
                        </div>

                        {/* Título e Descrição */}
                        <div>
                          <h4 className={`text-xs font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors ${
                            task.status === 'done' ? 'line-through text-slate-400' : ''
                          }`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Micro-atividades (Checklist Bar - Estilo Trello) */}
                        {hasSubtasks && (
                          <div className="bg-dark-900/80 p-2 rounded-lg border border-white/5 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="flex items-center gap-1 font-semibold">
                                <CheckSquare className="w-3 h-3 text-emerald-400" />
                                Micro-atividades
                              </span>
                              <span className="font-mono font-bold text-emerald-400">
                                {task.completedSubtasks}/{task.totalSubtasks} ({task.progress}%)
                              </span>
                            </div>

                            <div className="w-full bg-dark-950 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Rodapé do Cartão: Data, Anexos, WhatsApp e Ações de Movimento */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                          {/* Data e Anexos */}
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                              <Calendar className="w-3 h-3" />
                              <span>{task.due_date.substring(5)}</span>
                            </span>

                            {task.media && task.media.length > 0 && (
                              <span className="flex items-center gap-0.5 text-cyber-blue" title={`${task.media.length} anexo(s)`}>
                                <Paperclip className="w-3 h-3" />
                                <span className="font-mono text-[10px]">{task.media.length}</span>
                              </span>
                            )}
                          </div>

                          {/* Movimentação Rápida entre colunas */}
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {col.id !== 'todo' && (
                              <button
                                onClick={() => handleMoveStatus(task, col.id === 'done' ? 'doing' : 'todo')}
                                className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/5"
                                title="Voltar status anterior"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {col.id !== 'done' && (
                              <button
                                onClick={() => handleMoveStatus(task, col.id === 'todo' ? 'doing' : 'done')}
                                className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                title="Avançar status"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botão de adicionar cartão na coluna */}
              <button
                onClick={() => onOpenTaskModal({ due_date: todayStr, priority: 'medium', status: col.id })}
                className="mt-3 py-2 w-full rounded-xl border border-white/5 bg-dark-950/60 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Cartão
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KanbanPage;
