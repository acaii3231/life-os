import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  RotateCcw, 
  TrendingDown, 
  TrendingUp, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export function CategoryModal({ isOpen, onClose, onCategoriesUpdated, transactions = [] }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income'
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null); // { oldName: string, newName: string }
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadCategories();
  }, [isOpen]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.finance.getCategories();
      setExpenseCategories(res.expense || []);
      setIncomeCategories(res.income || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === 'expense' ? expenseCategories : incomeCategories;

  // Contagem de transações por categoria
  const getUsageCount = (catName) => {
    return transactions.filter(t => t.category === catName && (activeTab === 'all' || t.type === activeTab)).length;
  };

  // Adicionar nova categoria
  const handleAddCategory = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (currentList.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta categoria já existe!');
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    try {
      const updatedList = [...currentList, trimmed];
      if (activeTab === 'expense') {
        await api.finance.saveCategories({ expense: updatedList });
        setExpenseCategories(updatedList);
      } else {
        await api.finance.saveCategories({ income: updatedList });
        setIncomeCategories(updatedList);
      }
      setNewCategoryName('');
      setFeedback({ type: 'success', message: `Categoria "${trimmed}" adicionada com sucesso!` });
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao adicionar categoria: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar edição de uma categoria
  const startEditing = (cat) => {
    setEditingCategory({ oldName: cat, newName: cat });
  };

  // Salvar renomeação de categoria
  const handleSaveRename = async () => {
    if (!editingCategory) return;
    const trimmedNew = editingCategory.newName.trim();
    const oldName = editingCategory.oldName;

    if (!trimmedNew) {
      alert('O nome da categoria não pode ficar vazio.');
      return;
    }

    if (trimmedNew === oldName) {
      setEditingCategory(null);
      return;
    }

    if (currentList.some(c => c.toLowerCase() === trimmedNew.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase())) {
      alert('Já existe outra categoria com esse nome!');
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    try {
      await api.finance.renameCategory({
        oldName,
        newName: trimmedNew,
        type: activeTab
      });

      if (activeTab === 'expense') {
        setExpenseCategories(expenseCategories.map(c => c === oldName ? trimmedNew : c));
      } else {
        setIncomeCategories(incomeCategories.map(c => c === oldName ? trimmedNew : c));
      }

      setEditingCategory(null);
      setFeedback({ type: 'success', message: `Categoria renomeada para "${trimmedNew}". Lançamentos vinculados foram atualizados!` });
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao renomear: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async (catName) => {
    const usage = getUsageCount(catName);
    const msg = usage > 0 
      ? `Atenção: Existem ${usage} lançamento(s) registrados nesta categoria. Deseja realmente removê-la da lista de opções?`
      : `Deseja realmente remover a categoria "${catName}"?`;

    if (!confirm(msg)) return;

    setIsProcessing(true);
    setFeedback(null);
    try {
      await api.finance.deleteCategory({
        name: catName,
        type: activeTab
      });

      if (activeTab === 'expense') {
        setExpenseCategories(expenseCategories.filter(c => c !== catName));
      } else {
        setIncomeCategories(incomeCategories.filter(c => c !== catName));
      }

      setFeedback({ type: 'success', message: `Categoria "${catName}" removida!` });
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao excluir: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Restaurar padrões
  const handleResetDefaults = async () => {
    if (!confirm('Deseja restaurar as categorias para a lista padrão do Life OS?')) return;

    setIsProcessing(true);
    try {
      const res = await api.finance.resetCategories();
      setExpenseCategories(res.expense);
      setIncomeCategories(res.income);
      setFeedback({ type: 'success', message: 'Categorias restauradas para os padrões com sucesso!' });
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao restaurar: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-dark-900/90 gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Editar Categorias Financeiras</h3>
              <p className="text-xs text-slate-400">Adicione, renomeie ou remova categorias de receitas e despesas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-4 py-2 text-xs font-semibold border-b flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
          }`}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Abas: Despesas x Receitas */}
        <div className="p-4 border-b border-white/5 bg-dark-950/60">
          <div className="grid grid-cols-2 gap-2 p-1 bg-dark-900 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('expense');
                setEditingCategory(null);
                setFeedback(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'expense'
                  ? 'bg-rose-500 text-white shadow-glow-rose'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Despesas ({expenseCategories.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('income');
                setEditingCategory(null);
                setFeedback(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'income'
                  ? 'bg-emerald-500 text-dark-950 shadow-glow-emerald'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Receitas ({incomeCategories.length})</span>
            </button>
          </div>
        </div>

        {/* Formulário de Adicionar Nova Categoria */}
        <div className="p-4 border-b border-white/5 bg-dark-900/40">
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={`Nova categoria de ${activeTab === 'expense' ? 'despesa' : 'receita'}...`}
              className="flex-1 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyber-blue"
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim() || isProcessing}
              className="px-3.5 py-2 rounded-xl bg-cyber-blue hover:bg-sky-400 text-dark-950 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0 shadow-glow-cyan"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </form>
        </div>

        {/* Lista de Categorias com Edição e Exclusão */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-cyber-blue" />
              <span className="text-xs">Carregando categorias...</span>
            </div>
          ) : currentList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6 italic">
              Nenhuma categoria cadastrada. Adicione uma acima.
            </p>
          ) : (
            currentList.map(cat => {
              const isEditingThis = editingCategory && editingCategory.oldName === cat;
              const usage = getUsageCount(cat);

              if (isEditingThis) {
                return (
                  <div 
                    key={cat}
                    className="flex items-center gap-2 p-2 rounded-xl bg-dark-950 border border-cyber-blue/50"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingCategory.newName}
                      onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename();
                        if (e.key === 'Escape') setEditingCategory(null);
                      }}
                      className="flex-1 bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyber-blue"
                    />
                    <button
                      type="button"
                      onClick={handleSaveRename}
                      disabled={isProcessing}
                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold transition-all"
                      title="Salvar alteração"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/80 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-slate-500 group-hover:bg-cyber-blue transition-colors" />
                    <span className="text-xs font-medium text-slate-200 truncate">{cat}</span>
                    {usage > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-900 text-slate-400 border border-white/5 font-mono shrink-0">
                        {usage} {usage === 1 ? 'lançamento' : 'lançamentos'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => startEditing(cat)}
                      disabled={isProcessing}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyber-blue hover:bg-white/5 transition-all"
                      title="Renomear Categoria"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      disabled={isProcessing}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-white/10 bg-dark-900/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isProcessing}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            title="Voltar para as categorias originais"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-dark-950 border border-white/10 text-white text-xs font-semibold hover:bg-white/5 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryModal;
