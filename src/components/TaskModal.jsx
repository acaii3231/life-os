import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Paperclip, 
  Send, 
  Calendar, 
  Clock, 
  Tag, 
  Check, 
  Download, 
  Loader2,
  FileText,
  Save,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';

export function TaskModal({ task, isOpen, onClose, onTaskUpdated }) {
  if (!isOpen || !task) return null;

  const isNewTask = !task?.id;
  const [currentTask, setCurrentTask] = useState(task);

  // Form states
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status || 'todo');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [dueTime, setDueTime] = useState(task.due_time || '');
  const [category, setCategory] = useState(task.category || 'Geral');
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(task.notify_whatsapp !== false);

  // Subtasks & Media states
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [mediaList, setMediaList] = useState(task.media || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Status flags
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppFeedback, setWhatsAppFeedback] = useState(null);

  useEffect(() => {
    setCurrentTask(task);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setStatus(task.status || 'todo');
    setPriority(task.priority || 'medium');
    setDueDate(task.due_date || '');
    setDueTime(task.due_time || '');
    setCategory(task.category || 'Geral');
    setNotifyWhatsApp(task.notify_whatsapp !== false);
    setSubtasks(task.subtasks || []);
    setMediaList(task.media || []);
    setWhatsAppFeedback(null);
    setSaveSuccess(false);
  }, [task]);

  // Checklist stats
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Salvar Tarefa Principal (Criação ou Atualização)
  const handleSaveTask = async (e) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      alert('Por favor, informe o título da atividade.');
      return;
    }

    setIsSaving(true);
    try {
      if (isNewTask) {
        // Criar Nova Tarefa no Supabase
        const created = await api.tasks.create({
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          due_date: dueDate || null,
          due_time: dueTime || null,
          category: category || 'Geral',
          notify_whatsapp: notifyWhatsApp,
          initial_subtasks: subtasks.map(s => ({
            title: s.title,
            is_completed: !!s.is_completed
          }))
        });

        if (onTaskUpdated) onTaskUpdated();
        onClose();
      } else {
        // Atualizar Tarefa Existente no Supabase
        const updated = await api.tasks.update(currentTask.id, {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          due_date: dueDate || null,
          due_time: dueTime || null,
          category: category || 'Geral',
          notify_whatsapp: notifyWhatsApp
        });

        setCurrentTask(updated.task);
        if (onTaskUpdated) onTaskUpdated();

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert('Erro ao salvar atividade: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Adicionar micro-atividade (Checklist)
  const handleAddSubtask = async (e) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const trimmedTitle = newSubtaskTitle.trim();

    if (isNewTask) {
      // Tarefa ainda não salva: armazena em memória local
      setSubtasks([
        ...subtasks,
        {
          id: 'local_' + Date.now(),
          title: trimmedTitle,
          is_completed: false
        }
      ]);
      setNewSubtaskTitle('');
      return;
    }

    // Tarefa já salva: persiste imediatamente no Supabase
    try {
      const res = await api.subtasks.create(currentTask.id, trimmedTitle);
      setSubtasks([...subtasks, res.subtask]);
      setNewSubtaskTitle('');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao adicionar micro-atividade: ' + err.message);
    }
  };

  // Alternar conclusão de micro-atividade
  const handleToggleSubtask = async (subtaskId, currentState) => {
    if (isNewTask) {
      setSubtasks(subtasks.map(s => s.id === subtaskId ? { ...s, is_completed: !currentState } : s));
      return;
    }

    try {
      const res = await api.subtasks.update(subtaskId, { is_completed: !currentState });
      setSubtasks(subtasks.map(s => s.id === subtaskId ? res.subtask : s));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao atualizar micro-atividade: ' + err.message);
    }
  };

  // Excluir micro-atividade
  const handleDeleteSubtask = async (subtaskId) => {
    if (isNewTask) {
      setSubtasks(subtasks.filter(s => s.id !== subtaskId));
      return;
    }

    try {
      await api.subtasks.delete(subtaskId);
      setSubtasks(subtasks.filter(s => s.id !== subtaskId));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao excluir micro-atividade: ' + err.message);
    }
  };

  // Upload de Mídia / Anexo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isNewTask) {
      alert('Por favor, salve a atividade primeiro antes de anexar arquivos.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.media.upload(currentTask.id, file);
      setMediaList([res.media, ...mediaList]);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro no upload do arquivo: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Excluir Mídia
  const handleDeleteMedia = async (mediaId) => {
    if (!confirm('Deseja realmente remover este anexo?')) return;
    try {
      await api.media.delete(mediaId);
      setMediaList(mediaList.filter(m => m.id !== mediaId));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao excluir anexo: ' + err.message);
    }
  };

  // Disparo manual de WhatsApp via Plugsend
  const handleTriggerWhatsApp = async () => {
    if (isNewTask) {
      alert('Salve a atividade primeiro antes de disparar alertas.');
      return;
    }

    setIsSendingWhatsApp(true);
    setWhatsAppFeedback(null);
    try {
      const res = await api.tasks.notify(currentTask.id);
      setWhatsAppFeedback({
        success: res.success,
        simulated: res.simulated,
        recipient: res.recipient,
        text: res.message || 'Alerta enviado para o WhatsApp com sucesso!'
      });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setWhatsAppFeedback({
        success: false,
        text: 'Falha ao disparar alerta: ' + err.message
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-dark-900/90 gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {isNewTask ? (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue">
                <CheckSquare className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {isNewTask ? 'Nova Atividade' : 'Editar Atividade'}
              </h3>
              <p className="text-xs text-slate-400">
                {isNewTask ? 'Preencha os dados e clique em Salvar' : `ID #${currentTask?.id} • Quadro Kanban & Agenda`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Salvar no Topo (Acesso Rápido) */}
            <button
              type="button"
              onClick={handleSaveTask}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-dark-950 text-xs font-bold transition-all shadow-glow-emerald flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isNewTask ? 'Criar Atividade' : 'Salvar'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificação de Sucesso */}
        {saveSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-5 py-2 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Atividade salva com sucesso no banco de dados!
          </div>
        )}

        {/* Corpo do Modal com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Título da Tarefa */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Título da Atividade <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desenvolver nova landing page, Fechar proposta comercial..."
              className="w-full bg-dark-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal (Descrição, Checklists, Mídia) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Descrição & Notas
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Adicione detalhes, instruções ou objetivos para esta atividade..."
                  className="w-full bg-dark-950/90 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Micro-atividades (Estilo Trello Checklist) */}
              <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white tracking-wide">
                      Micro-atividades (Checklist)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {completedSubtasks}/{totalSubtasks} ({progressPercent}%)
                  </span>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      progressPercent === 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Lista de itens */}
                <div className="space-y-1.5 pt-1">
                  {subtasks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-1">Nenhuma micro-atividade adicionada.</p>
                  ) : (
                    subtasks.map(sub => (
                      <div 
                        key={sub.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-dark-950/80 border border-white/5 hover:border-white/10 group transition-all"
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={!!sub.is_completed}
                            onChange={() => handleToggleSubtask(sub.id, sub.is_completed)}
                            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-dark-900 cursor-pointer shrink-0"
                          />
                          <span className={`text-xs text-slate-200 truncate transition-all ${sub.is_completed ? 'line-through text-slate-500' : ''}`}>
                            {sub.title}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(sub.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all shrink-0"
                          title="Excluir item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Input para adicionar nova micro-atividade */}
                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Adicionar micro-atividade... (Enter para adicionar)"
                    className="flex-1 bg-dark-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-40 transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </form>
              </div>

              {/* Mídias & Anexos */}
              <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-cyber-blue" />
                    <span className="text-sm font-bold text-white tracking-wide">
                      Anexos & Arquivos ({mediaList.length})
                    </span>
                  </div>

                  {!isNewTask && (
                    <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-dark-950 border border-cyber-blue/30 text-cyber-blue text-xs font-medium hover:bg-cyber-blue/10 transition-all flex items-center gap-1.5">
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isUploading ? 'Enviando...' : 'Anexar Arquivo'}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>

                {isNewTask ? (
                  <p className="text-xs text-slate-400 italic bg-dark-950/60 p-2.5 rounded-lg border border-white/5">
                    💡 Salve a atividade primeiro para habilitar o upload de documentos e arquivos anexos.
                  </p>
                ) : mediaList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nenhum arquivo ou documento anexado.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mediaList.map(media => {
                      const isImg = media.mime_type?.startsWith('image/');
                      return (
                        <div 
                          key={media.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-dark-950 border border-white/5 hover:border-white/10 text-xs group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isImg ? (
                              <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-cyber-blue shrink-0" />
                            )}
                            <span className="truncate text-slate-300" title={media.original_name}>
                              {media.original_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={media.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-emerald-400 transition-all"
                              title="Baixar/Visualizar"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedia(media.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition-all"
                              title="Remover anexo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Lateral (Status, Prioridade, Prazos, WhatsApp) */}
            <div className="space-y-4">
              {/* Status e Prioridade */}
              <div className="bg-dark-900/60 p-3.5 rounded-xl border border-white/5 space-y-3">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Configurações do Cartão
                </span>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Coluna (Status)</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs font-semibold bg-dark-950 border border-white/10 rounded-lg px-2.5 py-2 text-slate-200 focus:border-emerald-500"
                  >
                    <option value="todo">📋 A Fazer</option>
                    <option value="doing">⚡ Fazendo</option>
                    <option value="done">✅ Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={`w-full text-xs font-bold rounded-lg px-2.5 py-2 border ${
                      priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                      priority === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      priority === 'medium' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                      'bg-slate-500/20 text-slate-400 border-slate-500/40'
                    }`}
                  >
                    <option value="low">Prioridade Baixa</option>
                    <option value="medium">Prioridade Média</option>
                    <option value="high">Prioridade Alta</option>
                    <option value="critical">🔥 Prioridade Crítica</option>
                  </select>
                </div>
              </div>

              {/* Vencimento & Horário */}
              <div className="bg-dark-900/60 p-3.5 rounded-xl border border-white/5 space-y-3">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Prazo de Entrega
                </span>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Data Limite
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Horário
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Geral, Finanças, Trabalho..."
                    className="w-full bg-dark-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Módulo WhatsApp Plugsend */}
              <div className="bg-dark-900/60 p-3.5 rounded-xl border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Send className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Alerta WhatsApp (Plugsend)
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifyWhatsApp}
                    onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-dark-950 cursor-pointer"
                  />
                  <span>Alertar no vencimento</span>
                </label>

                {!isNewTask && (
                  <button
                    type="button"
                    onClick={handleTriggerWhatsApp}
                    disabled={isSendingWhatsApp}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-500 text-dark-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-glow-emerald"
                  >
                    {isSendingWhatsApp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Disparar WhatsApp Agora</span>
                  </button>
                )}

                {whatsAppFeedback && (
                  <div className={`p-2 rounded-lg text-[11px] border ${
                    whatsAppFeedback.success ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                  }`}>
                    <p className="font-semibold">{whatsAppFeedback.text}</p>
                    {whatsAppFeedback.recipient && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Destino: {whatsAppFeedback.recipient}</p>
                    )}
                    {whatsAppFeedback.simulated && (
                      <p className="text-[10px] text-amber-400/80 mt-0.5">(Modo Sandbox/Simulação)</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Botão Salvar Principal Bem Visível */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-dark-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {!isNewTask && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Deseja excluir esta atividade permanentemente?')) {
                    try {
                      await api.tasks.delete(currentTask.id);
                      onClose();
                      if (onTaskUpdated) onTaskUpdated();
                    } catch (err) {
                      alert('Erro ao excluir: ' + err.message);
                    }
                  }
                }}
                className="py-2 px-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Atividade
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 text-xs font-semibold transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveTask}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 text-xs sm:text-sm font-bold transition-all shadow-glow-emerald flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isNewTask ? 'Criar Atividade' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
