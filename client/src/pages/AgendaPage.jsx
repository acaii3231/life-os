import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react';

export function AgendaPage({ tasks = [], onOpenTaskModal, onTaskUpdated }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Navegação de Datas
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtragem de tarefas
  const filteredTasks = tasks.filter(t => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  // Dias do Mês
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Grid de 35 a 42 células para o mês
  const calendarCells = [];
  // Dias vazios antes do 1º dia
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ empty: true, key: `empty-${i}` });
  }
  // Dias do mês atual
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = filteredTasks.filter(t => t.due_date === dateStr);
    calendarCells.push({
      empty: false,
      day,
      dateStr,
      isToday: dateStr === todayStr,
      tasks: dayTasks,
      key: dateStr
    });
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Barra de Ferramentas da Agenda */}
      <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navegador de Data */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-xl border border-white/10">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-base sm:text-lg font-bold text-white tracking-wide">
            {monthNames[month]} <span className="text-slate-400 font-mono">{year}</span>
          </span>
        </div>

        {/* Filtros e Modos de Visualização */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Filtro de Prioridade */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-dark-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:border-emerald-500"
          >
            <option value="all">Todas Prioridades</option>
            <option value="critical">🔥 Crítica</option>
            <option value="high">⚡ Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          {/* Filtro de Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-dark-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:border-emerald-500"
          >
            <option value="all">Todos os Status</option>
            <option value="todo">📋 A Fazer</option>
            <option value="doing">⚡ Fazendo</option>
            <option value="done">✅ Concluído</option>
          </select>

          {/* Botão Nova Atividade */}
          <button
            onClick={() => onOpenTaskModal({ due_date: todayStr, priority: 'medium', status: 'todo' })}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-glow-emerald"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Atividade</span>
          </button>
        </div>
      </div>

      {/* Grade do Calendário (Mês) */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-dark-950/60 text-center py-2.5 text-xs font-bold text-slate-400">
          <span className="text-rose-400/80">Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span className="text-cyan-400/80">Sáb</span>
        </div>

        {/* Grade de Células */}
        <div className="grid grid-cols-7 auto-rows-fr gap-px bg-white/5">
          {calendarCells.map(cell => {
            if (cell.empty) {
              return <div key={cell.key} className="bg-dark-950/40 min-h-[110px]" />;
            }

            return (
              <div
                key={cell.key}
                onClick={() => onOpenTaskModal({ due_date: cell.dateStr, priority: 'medium', status: 'todo' })}
                className={`bg-dark-950 p-2 min-h-[110px] sm:min-h-[130px] flex flex-col justify-between hover:bg-dark-900/60 cursor-pointer transition-colors group relative ${
                  cell.isToday ? 'ring-1 ring-emerald-500/50 bg-emerald-950/10' : ''
                }`}
              >
                {/* Cabeçalho do Dia */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    cell.isToday 
                      ? 'bg-emerald-500 text-dark-950 font-black shadow-glow-emerald' 
                      : 'text-slate-400 group-hover:text-white'
                  }`}>
                    {cell.day}
                  </span>

                  {cell.tasks.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {cell.tasks.length} {cell.tasks.length === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </div>

                {/* Atividades Agendadas no Dia */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                  {cell.tasks.map(t => (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTaskModal(t);
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium truncate flex items-center justify-between transition-all hover:scale-[1.02] border ${
                        t.priority === 'critical' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                        t.priority === 'high' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                        t.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 line-through opacity-70' :
                        'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}
                      title={`${t.title} (${t.due_time || 'Sem hora'})`}
                    >
                      <span className="truncate">{t.title}</span>
                      {t.due_time && (
                        <span className="text-[9px] font-mono opacity-80 ml-1 shrink-0">
                          {t.due_time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Botão de Adição Rápida no Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end pt-1">
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <Plus className="w-3 h-3" /> Agendar
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AgendaPage;
