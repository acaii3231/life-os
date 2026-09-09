import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Target,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function LifeLevelGauge({ data, onRefresh }) {
  if (!data) return null;

  const { score = 0, level = 'Normal', summary = '', metrics = {}, recommendations = [] } = data;
  const prod = metrics.productivity || {};
  const fin = metrics.financial || {};

  // Parâmetros do arco do velocímetro SVG
  const radius = 80;
  const circumference = Math.PI * radius; // Semi-círculo (180 graus)
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const levelStyles = {
    Excelente: {
      color: '#10b981',
      gradient: 'from-emerald-500 to-teal-400',
      border: 'border-emerald-500/30',
      shadow: 'shadow-glow-emerald',
      bgBadge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      icon: ShieldCheck,
      desc: 'Alta performance, equilíbrio e metas batidas'
    },
    Normal: {
      color: '#f59e0b',
      gradient: 'from-amber-500 to-yellow-400',
      border: 'border-amber-500/30',
      shadow: 'shadow-glow-amber',
      bgBadge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      icon: ShieldCheck,
      desc: 'Estável com boas oportunidades de evolução'
    },
    Perigoso: {
      color: '#ef4444',
      gradient: 'from-rose-500 to-red-600',
      border: 'border-rose-500/30',
      shadow: 'shadow-glow-rose',
      bgBadge: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
      icon: Flame,
      desc: 'Alerta! Finanças no negativo ou atrasos acumulados'
    }
  };

  const style = levelStyles[level] || levelStyles.Normal;
  const StatusIcon = style.icon;

  return (
    <div className={`glass-panel rounded-2xl p-6 border ${style.border} relative overflow-hidden transition-all duration-300`}>
      {/* Background ambient lighting */}
      <div 
        className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: style.color }}
      />

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Visual Gauge / Velocímetro */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="relative w-48 h-28 flex items-end justify-center">
            <svg className="w-48 h-28 overflow-visible" viewBox="0 0 200 110">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Trilho de Fundo */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#161F33"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Arco Preenchido com Gradiente */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Pontuação no Centro */}
            <div className="absolute bottom-0 flex flex-col items-center">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-md">
                {score}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest -mt-1">
                Score Geral
              </span>
            </div>
          </div>

          {/* Badge de Nível */}
          <div className="mt-3 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${style.bgBadge}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {level}
            </span>
          </div>
        </div>

        {/* Detalhamento dos Pilares: Produtividade e Finanças */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Pilar Produtividade */}
          <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Produtividade
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {prod.score || 0} / 50 pts
                </span>
              </div>
              <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden border border-white/5 mb-3">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${((prod.score || 0) / 50) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="bg-dark-950/80 p-2 rounded-lg border border-white/5">
                <span className="block text-[10px] text-slate-500">Concluídas</span>
                <span className="font-bold text-emerald-400">{prod.completedTasks || 0} de {prod.totalTasks || 0}</span>
              </div>
              <div className="bg-dark-950/80 p-2 rounded-lg border border-white/5">
                <span className="block text-[10px] text-slate-500">Atrasadas</span>
                <span className={`font-bold ${(prod.overdueTasks || 0) > 0 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-slate-300'}`}>
                  {prod.overdueTasks || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Card Pilar Financeiro */}
          <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-cyber-blue" />
                  Finanças
                </span>
                <span className="text-xs font-mono font-bold text-cyber-blue">
                  {fin.score || 0} / 50 pts
                </span>
              </div>
              <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden border border-white/5 mb-3">
                <div 
                  className="bg-cyber-blue h-full rounded-full transition-all duration-500"
                  style={{ width: `${((fin.score || 0) / 50) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="bg-dark-950/80 p-2 rounded-lg border border-white/5">
                <span className="block text-[10px] text-slate-500">Saldo Líquido</span>
                <span className={`font-bold ${(fin.netBalance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  R$ {(fin.netBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-dark-950/80 p-2 rounded-lg border border-white/5">
                <span className="block text-[10px] text-slate-500">Margem Poupança</span>
                <span className="font-bold text-cyber-blue">
                  {Math.round((fin.savingsRate || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnóstico & Recomendações em tempo real */}
      <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{summary}</span>
        </div>

        {recommendations.length > 0 && (
          <div className="text-slate-400 bg-dark-950/90 px-3 py-1.5 rounded-lg border border-white/5 text-[11px] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{recommendations[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LifeLevelGauge;
