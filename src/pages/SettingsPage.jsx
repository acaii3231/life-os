import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  MessageSquare, 
  Database, 
  ShieldCheck, 
  Save, 
  Send, 
  Key, 
  Smartphone, 
  Globe, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Cpu, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import api from '../services/api';
import PlugSendService from '../services/plugsend';

export function SettingsPage({ onOpenNotifications }) {
  const [settings, setSettings] = useState({
    plugsend_api_url: 'https://plugsend.uazapi.com',
    plugsend_instance: 'plugsend-6281948',
    plugsend_token: '77d9de98-6e8a-44f6-9996-cc11f1196fa7',
    plugsend_phone: '',
    plugsend_simulation_mode: 'false',
    notify_due_tasks: 'true',
    notify_critical_tasks: 'true'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null); // { connected: boolean, profileName: string, owner: string }

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.settings.get();
      if (res.settings) {
        setSettings(prev => ({ ...prev, ...res.settings }));
      }
      checkLiveStatus();
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkLiveStatus = async () => {
    try {
      const statusRes = await PlugSendService.checkStatus();
      if (statusRes?.status?.connected || statusRes?.instance?.status === 'connected') {
        setLiveStatus({
          connected: true,
          profileName: statusRes.instance?.profileName || 'Hugo',
          owner: statusRes.instance?.owner || statusRes.status?.jid?.split('@')[0] || 'Conectado'
        });
      } else {
        setLiveStatus({
          connected: false,
          error: statusRes?.error || 'Instância desconectada no painel PlugSend'
        });
      }
    } catch (e) {
      setLiveStatus({ connected: false, error: e.message });
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await api.settings.update(settings);
      setFeedback({ success: true, message: 'Configurações salvas com sucesso!' });
      checkLiveStatus();
    } catch (err) {
      setFeedback({ success: false, message: 'Erro ao salvar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTestLoading(true);
    setFeedback(null);
    try {
      const res = await api.notifications.sendTest(settings.plugsend_phone);
      setFeedback({
        success: res.success,
        message: `${res.message} ${res.simulated ? '(Modo Sandbox)' : ''}`
      });
    } catch (err) {
      setFeedback({ success: false, message: 'Erro no teste: ' + err.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Configurações do Life OS
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Parâmetros da API Plugsend WhatsApp, triggers automáticos e infraestrutura Supabase.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-2 ${
          feedback.success 
            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 shadow-glow-emerald' 
            : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Seção Plugsend WhatsApp */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">Integração WhatsApp (API Plugsend)</h3>
                {liveStatus && (
                  liveStatus.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online ({liveStatus.profileName || 'Hugo'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <WifiOff className="w-3 h-3" />
                      Offline
                    </span>
                  )
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Disparos diretos de tarefas, alertas críticos e sincronização instantânea
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testLoading}
              className="px-3 py-1.5 rounded-xl bg-dark-950 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 flex items-center gap-1.5 transition-all"
            >
              {testLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Testar Disparo</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 text-dark-950 text-xs font-bold hover:bg-emerald-400 flex items-center gap-1.5 shadow-glow-emerald transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Salvar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              URL Base da API Plugsend (UAZAPI Oficial)
            </label>
            <input
              type="url"
              value={settings.plugsend_api_url}
              onChange={(e) => setSettings({ ...settings, plugsend_api_url: e.target.value })}
              placeholder="https://plugsend.uazapi.com"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              Nome da Instância Plugsend
            </label>
            <input
              type="text"
              value={settings.plugsend_instance || ''}
              onChange={(e) => setSettings({ ...settings, plugsend_instance: e.target.value })}
              placeholder="ex: plugsend-6281948"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              Telefone Destino (com DDI e DDD)
            </label>
            <input
              type="text"
              value={settings.plugsend_phone}
              onChange={(e) => setSettings({ ...settings, plugsend_phone: e.target.value })}
              placeholder="ex: 5511999999999"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              Token / Chave de API Plugsend
            </label>
            <input
              type="password"
              value={settings.plugsend_token}
              onChange={(e) => setSettings({ ...settings, plugsend_token: e.target.value })}
              placeholder="Cole seu token de autenticação Plugsend..."
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Triggers e Modos */}
        <div className="pt-3 border-t border-white/5 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Gatilhos Automáticos de Notificação
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-950 border border-white/5 cursor-pointer hover:border-emerald-500/30 transition-all">
              <input
                type="checkbox"
                checked={settings.notify_due_tasks === 'true'}
                onChange={(e) => setSettings({ ...settings, notify_due_tasks: String(e.target.checked) })}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-dark-900"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Alertar no Vencimento</span>
                <span className="text-slate-400 text-[11px]">Disparar mensagem no dia e hora da atividade</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-950 border border-white/5 cursor-pointer hover:border-emerald-500/30 transition-all">
              <input
                type="checkbox"
                checked={settings.notify_critical_tasks === 'true'}
                onChange={(e) => setSettings({ ...settings, notify_critical_tasks: String(e.target.checked) })}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-dark-900"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Prioridade Crítica Imediata</span>
                <span className="text-slate-400 text-[11px]">Disparo automático para tarefas 🔥 Críticas</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-dark-950 border border-white/5 cursor-pointer hover:border-emerald-500/30 transition-all sm:col-span-2">
              <input
                type="checkbox"
                checked={settings.plugsend_simulation_mode === 'true'}
                onChange={(e) => setSettings({ ...settings, plugsend_simulation_mode: String(e.target.checked) })}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-dark-900"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-400 block">Modo Sandbox / Simulação Seguro</span>
                <span className="text-slate-400 text-[11px]">
                  Permite testar todos os gatilhos e templates de mensagem sem consumir saldo ou quando estiver em desenvolvimento.
                </span>
              </div>
            </label>
          </div>
        </div>
      </form>

      {/* Webhook do Life OS para o Plugsend */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 text-cyber-blue">
            <Globe className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">URL do Webhook (Plugsend WhatsApp)</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            Ativo
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Se o seu painel do Plugsend solicitar uma <strong>URL de Webhook</strong> para enviar o status das mensagens, relatórios de entrega ou respostas, utilize o endereço abaixo:
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : 'https://seu-dominio.vercel.app/api/webhook'}
            className="flex-1 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-cyber-blue font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/api/webhook`;
              navigator.clipboard.writeText(url);
              alert('URL do Webhook copiada para a área de transferência:\n' + url);
            }}
            className="px-4 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 border border-white/10 text-xs font-bold text-white transition-all hover:border-cyber-blue/40"
          >
            Copiar URL
          </button>
        </div>
      </div>

      {/* Informações do Banco de Dados Relacional Supabase */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 border-b border-white/5 pb-3">
          <Database className="w-5 h-5" />
          <h3 className="font-bold text-white text-base">Banco de Dados Relacional (Supabase)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-dark-950 border border-white/5">
            <span className="text-slate-500 block text-[10px]">Projeto Supabase</span>
            <span className="font-mono font-bold text-white">life-os (yqbzqjjnlzghgnrzwppy)</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-white/5">
            <span className="text-slate-500 block text-[10px]">Região do Servidor</span>
            <span className="font-mono font-bold text-emerald-400">sa-east-1 (São Paulo, Brasil)</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-950 border border-white/5 sm:col-span-2">
            <span className="text-slate-500 block text-[10px]">Tabelas Ativas</span>
            <span className="font-mono text-slate-300">
              users, tasks, subtasks, media, transactions, life_goals, life_goal_links, settings, notification_logs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
