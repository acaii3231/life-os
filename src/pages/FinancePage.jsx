import React, { useState } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Target, 
  PieChart as PieIcon, 
  BarChart3,
  Search,
  Filter,
  Tag
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import api from '../services/api';
import CategoryModal from '../components/CategoryModal';

export function FinancePage({ 
  financeSummary = {}, 
  transactions = [], 
  goals = [], 
  onOpenTransactionModal, 
  onRefresh 
}) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const metrics = financeSummary.metrics || {};
  const totalIncome = metrics.totalIncome || 0;
  const totalExpense = metrics.totalExpense || 0;
  const netBalance = metrics.netBalance || 0;
  const savingsRate = metrics.savingsRate || 0;

  const timeline = financeSummary.timeline || [];
  const byCategory = financeSummary.byCategory || [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

  // Filtragem de transações na tabela
  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir esta transação?')) return;
    try {
      await api.finance.deleteTransaction(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Erro ao excluir transação: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Topo: KPIs Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Líquido */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Saldo Acumulado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className={`text-2xl font-extrabold font-mono tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            {netBalance >= 0 ? 'Superávit financeiro saudável' : 'Déficit! Requer contenção de custos'}
          </span>
        </div>

        {/* Receitas */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Receitas Totais</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono tracking-tight text-emerald-400">
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Entradas e faturamentos</span>
        </div>

        {/* Despesas */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Despesas Totais</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono tracking-tight text-rose-400">
              R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Custos fixos, variáveis e aportes</span>
        </div>

        {/* Taxa de Poupança */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Margem de Sobra / Poupança</span>
            <BarChart3 className="w-4 h-4 text-cyber-blue" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono tracking-tight text-cyber-blue">
              {savingsRate}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Do total de receitas geradas</span>
        </div>
      </div>

      {/* Seção de Gráficos Integrados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolução do Fluxo de Caixa */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Evolução do Fluxo de Caixa
            </h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Receitas
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Despesas
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1F2B48', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" />
                <Area type="monotone" dataKey="despesas" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorDesp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Despesas por Categoria */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide mb-2">
            Despesas por Categoria
          </h3>

          <div className="h-56 w-full flex items-center justify-center">
            {byCategory.length === 0 ? (
              <p className="text-xs text-slate-500">Sem despesas registradas</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1F2B48', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 justify-center">
            {byCategory.slice(0, 4).map((cat, i) => (
              <span key={cat.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span>{cat.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Transações Financeiras */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Extrato de Transações</h3>
            <p className="text-xs text-slate-400">Acompanhe lançamentos e aportes vinculados às metas de vida</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Busca */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar lançamento..."
                className="bg-dark-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyber-blue"
              />
            </div>

            {/* Filtro Tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-dark-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:border-cyber-blue"
            >
              <option value="all">Todas as transações</option>
              <option value="income">Apenas Receitas (+)</option>
              <option value="expense">Apenas Despesas (-)</option>
            </select>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-dark-950 border border-white/10 hover:border-cyber-blue/50 text-slate-200 text-xs font-semibold hover:bg-white/5 transition-all flex items-center gap-1.5"
              title="Personalizar categorias de receitas e despesas"
            >
              <Tag className="w-3.5 h-3.5 text-cyber-blue" />
              <span>Categorias</span>
            </button>

            <button
              onClick={onOpenTransactionModal}
              className="px-3.5 py-1.5 rounded-xl bg-cyber-blue text-dark-950 text-xs font-bold hover:bg-sky-400 transition-all flex items-center gap-1.5 shadow-glow-cyan"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Meta Vinculada</th>
                <th className="p-3 text-right">Valor (R$)</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                        {tx.transaction_date}
                      </td>
                      <td className="p-3 font-semibold text-white">
                        {tx.description}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-dark-950 border border-white/5 text-[11px] text-slate-400">
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-3">
                        {tx.life_goals ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium flex items-center gap-1 w-fit">
                            <Target className="w-3 h-3" />
                            {tx.life_goals.title}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold whitespace-nowrap ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isIncome ? '+' : '-'} R$ {parseFloat(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesUpdated={onRefresh}
        transactions={transactions}
      />
    </div>
  );
}

export default FinancePage;
