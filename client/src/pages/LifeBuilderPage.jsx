import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Target, 
  Link2, 
  Trash2, 
  Move, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Compass, 
  Edit3,
  Unlink,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export function LifeBuilderPage({ goals = [], links = [], onOpenGoalModal, onRefresh }) {
  const [connectingSourceId, setConnectingSourceId] = useState(null);
  const [draggingGoalId, setDraggingGoalId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedHorizon, setSelectedHorizon] = useState('all');

  const canvasRef = useRef(null);

  // Filtragem por horizonte
  const filteredGoals = goals.filter(g => {
    if (selectedHorizon === 'all') return true;
    return g.horizon === selectedHorizon;
  });

  // Manipulação de Arraste (Drag & Drop na tela)
  const handleMouseDown = (e, goal) => {
    if (connectingSourceId) return; // Se estiver no modo de conexão
    setDraggingGoalId(goal.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingGoalId || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.min(canvasRect.width - 280, e.clientX - canvasRect.left - dragOffset.x));
    const newY = Math.max(20, Math.min(canvasRect.height - 180, e.clientY - canvasRect.top - dragOffset.y));

    // Atualiza localmente para suavidade
    const targetGoal = goals.find(g => g.id === draggingGoalId);
    if (targetGoal) {
      targetGoal.x_pos = newX;
      targetGoal.y_pos = newY;
    }
  };

  const handleMouseUp = async () => {
    if (draggingGoalId) {
      const targetGoal = goals.find(g => g.id === draggingGoalId);
      if (targetGoal) {
        try {
          await api.goals.update(targetGoal.id, {
            x_pos: Math.round(targetGoal.x_pos),
            y_pos: Math.round(targetGoal.y_pos)
          });
        } catch (err) {
          console.error('Erro ao salvar posição:', err);
        }
      }
      setDraggingGoalId(null);
    }
  };

  // Modo de conexão entre duas metas
  const handleNodeClick = async (goal) => {
    if (!connectingSourceId) return;

    if (connectingSourceId === goal.id) {
      setConnectingSourceId(null); // Cancela
      return;
    }

    try {
      await api.goals.createLink({
        source_goal_id: connectingSourceId,
        target_goal_id: goal.id,
        relationship_type: 'dependency'
      });
      setConnectingSourceId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Erro ao conectar metas: ' + err.message);
      setConnectingSourceId(null);
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await api.goals.deleteLink(linkId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Erro ao remover conexão');
    }
  };

  // Calcula linha SVG curva entre duas metas
  const renderConnections = () => {
    return links.map(link => {
      const source = goals.find(g => g.id === link.source_goal_id);
      const target = goals.find(g => g.id === link.target_goal_id);
      if (!source || !target) return null;

      const sx = (parseFloat(source.x_pos) || 200) + 130;
      const sy = (parseFloat(source.y_pos) || 200) + 80;
      const tx = (parseFloat(target.x_pos) || 400) + 130;
      const ty = (parseFloat(target.y_pos) || 200) + 80;

      const midX = (sx + tx) / 2;

      // Curva Bézier
      const pathD = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;

      return (
        <g key={link.id} className="group">
          {/* Linha externa de brilho */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeOpacity="0.4"
            className="transition-all group-hover:stroke-opacity-100"
          />
          {/* Linha principal com seta */}
          <path
            d={pathD}
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />
        </g>
      );
    });
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Barra de Ferramentas do Life Builder */}
      <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Life Builder | Mapa Mental Estratégico
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mapeie e interconecte suas metas de vida. Arraste os nós livremente pelo canvas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Horizonte */}
          <div className="flex items-center bg-dark-950 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setSelectedHorizon('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${selectedHorizon === 'all' ? 'bg-white/10 text-white font-bold' : 'text-slate-400'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedHorizon('short_term')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${selectedHorizon === 'short_term' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400'}`}
            >
              🎯 Curto
            </button>
            <button
              onClick={() => setSelectedHorizon('medium_term')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${selectedHorizon === 'medium_term' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              🚀 Médio
            </button>
            <button
              onClick={() => setSelectedHorizon('long_term')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${selectedHorizon === 'long_term' ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-slate-400'}`}
            >
              👑 Longo
            </button>
          </div>

          {/* Botão de Conexão */}
          <button
            onClick={() => setConnectingSourceId(connectingSourceId ? null : (goals[0]?.id || null))}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              connectingSourceId 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' 
                : 'bg-dark-950 text-slate-300 border-white/10 hover:border-white/20'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{connectingSourceId ? 'Clique no Destino...' : 'Conectar Metas'}</span>
          </button>

          {/* Botão Nova Meta */}
          <button
            onClick={() => onOpenGoalModal(null)}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-glow-emerald"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Canvas Interativo do Life Builder */}
      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full h-[650px] rounded-3xl border border-white/10 overflow-hidden bg-[#080B14] shadow-2xl select-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px, 120px 120px, 120px 120px'
        }}
      >
        {/* Camada SVG de Conexões */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
            </marker>
          </defs>
          {renderConnections()}
        </svg>

        {/* Empty State do Canvas */}
        {filteredGoals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center max-w-md pointer-events-auto bg-dark-900/90 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Canvas do Life Builder Pronto!</h3>
              <p className="text-xs text-slate-400 mb-5">
                Mapeie seus objetivos de Curto, Médio e Longo Prazo. Depois conecte metas para criar planos de dependência e acompanhar o progresso financeiro.
              </p>
              <button
                onClick={() => onOpenGoalModal(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 transition-all shadow-glow-emerald inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Minha Primeira Meta</span>
              </button>
            </div>
          </div>
        )}

        {/* Nós das Metas (Cards Flutuantes) */}
        {filteredGoals.map(goal => {
          const target = parseFloat(goal.target_amount) || 0;
          const current = parseFloat(goal.current_amount) || 0;
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          const isConnectingSource = connectingSourceId === goal.id;

          const horizonBadge = {
            short_term: { label: 'Curto Prazo', color: 'text-emerald-400 bg-emerald-500/10' },
            medium_term: { label: 'Médio Prazo', color: 'text-cyan-400 bg-cyan-500/10' },
            long_term: { label: 'Longo Prazo', color: 'text-purple-400 bg-purple-500/10' },
          }[goal.horizon] || { label: 'Geral', color: 'text-slate-400' };

          return (
            <div
              key={goal.id}
              onClick={() => handleNodeClick(goal)}
              style={{
                left: `${goal.x_pos || 100}px`,
                top: `${goal.y_pos || 100}px`,
              }}
              className={`absolute w-64 glass-panel rounded-2xl p-4 border transition-all z-10 cursor-grab active:cursor-grabbing shadow-xl ${
                isConnectingSource 
                  ? 'ring-2 ring-amber-400 scale-105 border-amber-400 bg-amber-950/40' 
                  : 'hover:border-emerald-500/50 hover:shadow-glow-emerald bg-dark-900/90'
              }`}
            >
              {/* Barra Superior do Card com Grip */}
              <div 
                onMouseDown={(e) => handleMouseDown(e, goal)}
                className="flex items-center justify-between pb-2 border-b border-white/5 cursor-move"
              >
                <div className="flex items-center gap-1.5">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: goal.color || '#10b981' }}
                  />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${horizonBadge.color}`}>
                    {horizonBadge.label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenGoalModal(goal); }}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Editar meta"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Excluir esta meta de vida?')) {
                        await api.goals.delete(goal.id);
                        if (onRefresh) onRefresh();
                      }
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-400"
                    title="Excluir meta"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Título e Descrição */}
              <div className="py-2.5">
                <h4 className="font-bold text-xs text-white leading-snug">
                  {goal.title}
                </h4>
                {goal.description && (
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                    {goal.description}
                  </p>
                )}
              </div>

              {/* Progresso Financeiro */}
              {target > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>R$ {current.toLocaleString('pt-BR')}</span>
                    <span className="font-bold text-emerald-400">{pct}%</span>
                    <span>R$ {target.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: goal.color || '#10b981'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic pt-1">
                  Meta conceitual / estratégica
                </div>
              )}

              {/* Data Prevista */}
              {goal.target_date && (
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {goal.target_date}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded font-semibold ${
                    goal.status === 'completed' ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {goal.status === 'completed' ? 'Batida!' : 'Em progresso'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LifeBuilderPage;
