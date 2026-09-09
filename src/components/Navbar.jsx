import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  KanbanSquare, 
  BrainCircuit, 
  Wallet, 
  Settings, 
  LogOut, 
  MessageSquare,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Flame
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, lifeLevel, onOpenNotifications, onLogout, user }) {
  const getLevelBadge = () => {
    if (!lifeLevel) return null;
    const { level, score, color } = lifeLevel;

    const config = {
      Excelente: { icon: Zap, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      Normal: { icon: ShieldCheck, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      Perigoso: { icon: Flame, bg: 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse' }
    };

    const current = config[level] || config.Normal;
    const Icon = current.icon;

    return (
      <div 
        onClick={() => setActiveTab('dashboard')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all hover:scale-105 ${current.bg}`}
        title={`Nível de Vida: ${level} (${score}/100)`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold tracking-wide uppercase">{level}</span>
        <span className="text-xs font-mono font-bold bg-dark-900/80 px-1.5 py-0.5 rounded-full">
          {score}
        </span>
      </div>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
    { id: 'mind-map', label: 'Mapa Mental', icon: BrainCircuit },
    { id: 'finance', label: 'Finanças', icon: Wallet },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 hud-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-glow-emerald flex items-center justify-center">
            <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                LIFE<span className="text-emerald-400 font-black">OS</span>
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-dark-900/60 p-1 rounded-xl border border-white/5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-dark-950 font-bold shadow-glow-emerald'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right tools: Life Level badge, WhatsApp trigger, Profile */}
        <div className="flex items-center gap-3">
          {getLevelBadge()}

          {/* WhatsApp Plugsend Button */}
          <button
            onClick={onOpenNotifications}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-900/50 hover:border-emerald-500/40 transition-all text-xs font-medium"
            title="Central WhatsApp Plugsend"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          {/* User Profile and Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200">{user?.name || 'Venom'}</span>
              <span className="text-[10px] font-mono text-emerald-400">@venom</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-white/5 bg-dark-950/90 overflow-x-auto px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-medium transition-all ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

export default Navbar;
