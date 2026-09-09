import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, Flag, Palette, Loader2 } from 'lucide-react';
import api from '../services/api';

export function GoalModal({ goal, isOpen, onClose, onGoalSaved }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [horizon, setHorizon] = useState(goal?.horizon || 'short_term');
  const [targetDate, setTargetDate] = useState(goal?.target_date || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount || 0);
  const [status, setStatus] = useState(goal?.status || 'in_progress');
  const [color, setColor] = useState(goal?.color || '#10b981');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setHorizon(goal.horizon || 'short_term');
      setTargetDate(goal.target_date || '');
      setTargetAmount(goal.target_amount || '');
      setCurrentAmount(goal.current_amount || 0);
      setStatus(goal.status || 'in_progress');
      setColor(goal.color || '#10b981');
    } else {
      setTitle('');
      setDescription('');
      setHorizon('short_term');
      setTargetDate('');
      setTargetAmount('');
      setCurrentAmount(0);
      setStatus('in_progress');
      setColor('#10b981');
    }
  }, [goal, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Informe o título da meta');

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        horizon,
        target_date: targetDate || null,
        target_amount: parseFloat(targetAmount) || 0,
        current_amount: parseFloat(currentAmount) || 0,
        status,
        color
      };

      if (goal?.id) {
        await api.goals.update(goal.id, payload);
      } else {
        await api.goals.create(payload);
      }

      onClose();
      if (onGoalSaved) onGoalSaved();
    } catch (err) {
      alert('Erro ao salvar meta: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {goal ? 'Editar Meta de Vida' : 'Nova Meta de Vida'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Título da Meta</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reserva de Emergência R$ 30.000, Comprar Apartamento..."
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Horizonte Temporal</label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
              >
                <option value="short_term">🎯 Curto Prazo (&lt; 1 ano)</option>
                <option value="medium_term">🚀 Médio Prazo (1 a 3 anos)</option>
                <option value="long_term">👑 Longo Prazo (3 a 10 anos)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
              >
                <option value="planned">Planejado</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído / Batido</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Alvo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Ex: 50000"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Atual Acumulado (R$)</label>
              <input
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="Ex: 15000"
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Data Prevista para Conclusão</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cor no Fluxograma</label>
            <div className="flex items-center gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição e Justificativa</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por que essa meta é importante para seu Life OS?"
              className="w-full bg-dark-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-dark-950 hover:bg-emerald-400 disabled:opacity-50 shadow-glow-emerald flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{goal ? 'Salvar Alterações' : 'Criar Meta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GoalModal;
