import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Smartphone,
  Loader2 
} from 'lucide-react';
import api from '../services/api';

export function NotificationDrawer({ isOpen, onClose, onOpenSettings }) {
  if (!isOpen) return null;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.getLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [isOpen]);

  const handleSendTest = async (e) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.notifications.sendTest(testPhone);
      setTestResult({
        success: res.success,
        simulated: res.simulated,
        message: res.message || 'Mensagem enviada!'
      });
      fetchLogs();
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Erro no envio: ' + err.message
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full glass-panel border-l border-white/10 flex flex-col shadow-2xl bg-dark-950/95">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Central WhatsApp (Plugsend)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Atualizar Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Disparo de Teste Rápido */}
        <div className="p-4 border-b border-white/10 bg-dark-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Disparo de Teste Imediato</span>
            <button
              onClick={() => { onClose(); onOpenSettings(); }}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              Configurar Chaves
            </button>
          </div>

          <form onSubmit={handleSendTest} className="flex gap-2">
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="DDD + Telefone (ou padrão)"
              className="flex-1 bg-dark-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSendingTest}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-1.5 shadow-glow-emerald"
            >
              {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Testar</span>
            </button>
          </form>

          {testResult && (
            <div className={`p-2 rounded-lg text-[11px] border ${
              testResult.success ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
            }`}>
              {testResult.message}
              {testResult.simulated && ' (Modo Sandbox ativo)'}
            </div>
          )}
        </div>

        {/* Histórico e Logs de Envio */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Histórico de Envios & Alertas ({logs.length})
            </span>
          </div>

          {loading && logs.length === 0 ? (
            <div className="flex justify-center p-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Nenhuma mensagem disparada até o momento.
            </div>
          ) : (
            logs.map(log => (
              <div 
                key={log.id} 
                className="p-3 rounded-xl bg-dark-900/80 border border-white/5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-400" />
                    {log.recipient}
                  </span>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    log.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    log.status === 'simulated' ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {log.status === 'sent' ? 'Enviado' : log.status === 'simulated' ? 'Simulado' : 'Falha'}
                  </span>
                </div>

                <div className="bg-dark-950 p-2.5 rounded-lg text-slate-300 text-[11px] whitespace-pre-wrap font-sans border border-white/5 max-h-32 overflow-y-auto">
                  {log.message}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>{new Date(log.sent_at).toLocaleString('pt-BR')}</span>
                  {log.error_message && (
                    <span className="text-rose-400 truncate max-w-[200px]" title={log.error_message}>
                      {log.error_message}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationDrawer;
