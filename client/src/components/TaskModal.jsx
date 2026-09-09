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
  AlertCircle, 
  Tag, 
  Check, 
  Download, 
  Loader2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';

export function TaskModal({ task, isOpen, onClose, onTaskUpdated }) {
  if (!isOpen || !task) return null;

  const [currentTask, setCurrentTask] = useState(task);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [mediaList, setMediaList] = useState(task.media || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppFeedback, setWhatsAppFeedback] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status || 'todo');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [dueTime, setDueTime] = useState(task.due_time || '');
  const [category, setCategory] = useState(task.category || 'Geral');
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(task.notify_whatsapp !== false);

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
  }, [task]);

  // Checklist stats
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Atualizar tarefa principal
  const handleSaveMainDetails = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.tasks.update(currentTask.id, {
        title,
        description,
        status,
        priority,
        due_date: dueDate,
        due_time: dueTime,
        category,
        notify_whatsapp: notifyWhatsApp
      });
      setCurrentTask(updated.task);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert(err.message || 'Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  // Adicionar micro-atividade
  const handleAddSubtask = async (e) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const res = await api.subtasks.create(currentTask.id, newSubtaskTitle.trim());
      setSubtasks([...subtasks, res.subtask]);
      setNewSubtaskTitle('');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao adicionar micro-atividade: ' + err.message);
    }
  };

  // Marcar/desmarcar micro-atividade
  const handleToggleSubtask = async (subtaskId, currentState) => {
    try {
      const res = await api.subtasks.update(subtaskId, { is_completed: !currentState });
      setSubtasks(subtasks.map(s => s.id === subtaskId ? res.subtask : s));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao atualizar micro-atividade');
    }
  };

  // Excluir micro-atividade
  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await api.subtasks.delete(subtaskId);
      setSubtasks(subtasks.filter(s => s.id !== subtaskId));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert('Erro ao excluir micro-atividade');
    }
  };

  // Upload de Mídia / Arquivo Anexo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      alert('Erro ao excluir anexo');
    }
  };

  // Disparo manual de WhatsApp via Plugsend
  const handleTriggerWhatsApp = async () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-8">
        {/* Header do Modal */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between bg-dark-900/80">
          <div className="flex-1 pr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveMainDetails}
              className="text-lg sm:text-xl font-bold bg-transparent text-white w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 -ml-1"
              placeholder="Título da Atividade..."
            />
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-slate-400">no quadro</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  api.tasks.update(currentTask.id, { status: e.target.value }).then(() => onTaskUpdated && onTaskUpdated());
                }}
                className="text-xs font-semibold bg-dark-950 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 focus:border-emerald-500"
              >
                <option value="todo">📋 A Fazer</option>
                <option value="doing">⚡ Fazendo</option>
                <option value="done">✅ Concluído</option>
              </select>

              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  api.tasks.update(currentTask.id, { priority: e.target.value }).then(() => onTaskUpdated && onTaskUpdated());
                }}
                className={`text-xs font-bold rounded-lg px-2.5 py-1 border ${
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

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Coluna Principal (Checklists, Descrição, Mídia) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descrição */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Descrição & Notas
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveMainDetails}
                rows={3}
                placeholder="Adicione detalhes, instruções ou objetivos para esta atividade..."
                className="w-full bg-dark-950/90 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Micro-atividades (Estilo Trello Checklist) */}
            <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
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
              <div className="w-full bg-dark-950 h-2 rounded-full overflow-hidden border border-white/5 mb-4">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressPercent === 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Lista de itens */}
              <div className="space-y-2 mb-3">
                {subtasks.map(sub => (
                  <div 
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-dark-950/80 border border-white/5 hover:border-white/10 group transition-all"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={!!sub.is_completed}
                        onChange={() => handleToggleSubtask(sub.id, sub.is_completed)}
                        className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-dark-900 cursor-pointer"
                      />
                      <span className={`text-xs text-slate-200 transition-all ${sub.is_completed ? 'line-through text-slate-500' : ''}`}>
                        {sub.title}
                      </span>
                    </label>

                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all"
                      title="Excluir micro-atividade"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Input para adicionar nova micro-atividade */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Adicionar um item... (Enter para salvar)"
                  className="flex-1 bg-dark-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-40 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </form>
            </div>

            {/* Mídias & Anexos */}
            <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-cyber-blue" />
                  <span className="text-sm font-bold text-white tracking-wide">
                    Anexos & Arquivos ({mediaList.length})
                  </span>
                </div>

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
              </div>

              {mediaList.length === 0 ? (
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

          {/* Coluna Lateral (Metadados e WhatsApp Plugsend) */}
          <div className="space-y-4">
            {/* Vencimento & Horário */}
            <div className="bg-dark-900/60 p-3.5 rounded-xl border border-white/5 space-y-3">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Prazo de Entrega
              </span>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Data Limite</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onBlur={handleSaveMainDetails}
                  className="w-full bg-dark-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Horário</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  onBlur={handleSaveMainDetails}
                  className="w-full bg-dark-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Categoria</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onBlur={handleSaveMainDetails}
                  className="w-full bg-dark-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Módulo WhatsApp Plugsend */}
            <div className="bg-dark-900/60 p-3.5 rounded-xl border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Send className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Alerta Plugsend WhatsApp
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  onChange={(e) => {
                    setNotifyWhatsApp(e.target.checked);
                    api.tasks.update(currentTask.id, { notify_whatsapp: e.target.checked });
                  }}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-dark-950"
                />
                <span>Alertar no vencimento</span>
              </label>

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

            {/* Ações Rápidas */}
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Deseja excluir esta atividade permanentemente?')) {
                    await api.tasks.delete(currentTask.id);
                    onClose();
                    if (onTaskUpdated) onTaskUpdated();
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Atividade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
