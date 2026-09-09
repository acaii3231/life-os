import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, Target, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import api from '../services/api';

export function TransactionModal({ isOpen, onClose, onTransactionSaved, goals = [] }) {
  if (!isOpen) return null;

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [goalId, setGoalId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const expenseCategories = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Tecnologia', 'Educação', 'Lazer', 'Investimentos', 'Outros'];
  const incomeCategories = ['Salário / Faturamento', 'Consultoria', 'Investimentos', 'Vendas', 'Dividendos', 'Outros'];

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  useEffect(() => {
    setCategory(categories[0]);
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description.trim()) {
      return alert('Informe o valor e a descrição da transação');
    }

    setIsSaving(true);
    try {
      await api.finance.createTransaction({
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        transaction_date: transactionDate,
        goal_id: goalId ? parseInt(goalId) : null
      });

      onClose();
      if (onTransactionSaved) onTransactionSaved();
    } catch (err) {
      alert('Erro ao salvar transação: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyber-blue" />
            <h3 className="font-bold text-white text-base">Nova Transação Financeira</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Transação (Receita vs Despesa) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-dark-950 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'income' 
                  ? 'bg-emerald-500 text-dark-950 shadow-glow-emerald' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Receita (+)
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense' 
                  ? 'bg-rose-500 text-white shadow-glow-rose' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Despesa (-)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyber-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Faturamento cliente X, Supermercado, Aporte..."
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyber-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyber-blue"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyber-blue"
              >
              </input>
            </div>
          </div>

          {/* Vínculo opcional com Meta de Vida do Life Builder */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Vincular à Meta de Vida (Opcional)</span>
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
            >
              <option value="">Nenhuma meta vinculada</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>
                  🎯 {g.title} (Atual: R$ {parseFloat(g.current_amount || 0).toLocaleString('pt-BR')})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Se você vincular, o valor atualizará o progresso financeiro da meta automaticamente no Life Builder!
            </span>
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyber-blue text-dark-950 hover:bg-sky-400 disabled:opacity-50 shadow-glow-cyan flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Registrar Transação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionModal;
