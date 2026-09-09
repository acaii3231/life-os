import { supabase } from './supabase.js';

export class PlugSendService {
  /**
   * Recupera as configurações da API Plugsend para o usuário
   */
  static async getUserSettings(userId) {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('user_id', userId);

    if (error || !data) {
      return {
        apiUrl: 'https://api.plugsend.com',
        token: '',
        phone: '5511999999999',
        simulationMode: true,
        notifyDueTasks: true,
        notifyCriticalTasks: true
      };
    }

    const map = {};
    data.forEach(item => {
      map[item.key] = item.value;
    });

    return {
      apiUrl: map.plugsend_api_url || 'https://api.plugsend.com',
      token: map.plugsend_token || '',
      phone: map.plugsend_phone || '5511999999999',
      simulationMode: map.plugsend_simulation_mode !== 'false',
      notifyDueTasks: map.notify_due_tasks !== 'false',
      notifyCriticalTasks: map.notify_critical_tasks !== 'false'
    };
  }

  /**
   * Dispara uma mensagem via WhatsApp (Plugsend ou Simulação)
   */
  static async sendMessage(userId, { phone, message, taskId = null }) {
    const settings = await this.getUserSettings(userId);
    const targetPhone = phone || settings.phone;

    // Se estiver em modo de simulação ou sem token real configurado
    if (settings.simulationMode || !settings.token) {
      console.log(`\n================= [WHATSAPP PLUGSEND - SIMULAÇÃO] =================`);
      console.log(`📱 Para: ${targetPhone}`);
      console.log(`💬 Mensagem:\n${message}`);
      console.log(`===================================================================\n`);

      const { data: log, error: logError } = await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          task_id: taskId,
          recipient: targetPhone,
          message: message,
          status: 'simulated',
          error_message: !settings.token ? 'Modo simulação (sem token de API configurado)' : 'Modo Sandbox ativo'
        })
        .select()
        .single();

      return {
        success: true,
        simulated: true,
        logId: log?.id,
        recipient: targetPhone,
        message: 'Alerta disparado com sucesso no modo Sandbox/Simulação'
      };
    }

    // Modo de produção: Disparo real via API REST do Plugsend
    try {
      const endpoint = `${settings.apiUrl.replace(/\/$/, '')}/v1/messages`;
      
      const payload = {
        number: targetPhone.replace(/\D/g, ''),
        message: message,
        options: {
          delay: 1200,
          presence: 'composing'
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.token}`,
          'apikey': settings.token
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `HTTP ${response.status}`);
      }

      const { data: log } = await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          task_id: taskId,
          recipient: targetPhone,
          message: message,
          status: 'sent'
        })
        .select()
        .single();

      return {
        success: true,
        simulated: false,
        logId: log?.id,
        recipient: targetPhone,
        message: 'Mensagem enviada com sucesso via API Plugsend'
      };
    } catch (err) {
      console.error('Erro ao enviar via Plugsend API:', err.message);

      await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          task_id: taskId,
          recipient: targetPhone,
          message: message,
          status: 'failed',
          error_message: err.message
        });

      return {
        success: false,
        error: err.message,
        message: `Falha na entrega via Plugsend: ${err.message}`
      };
    }
  }

  /**
   * Monta e dispara alerta inteligente de atividade
   */
  static async sendTaskAlert(userId, task, trigger = 'vencimento') {
    // Buscar subtarefas para incluir resumo no WhatsApp
    const { data: subtasks } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', task.id)
      .order('position', { ascending: true });

    const totalSub = subtasks?.length || 0;
    const completedSub = subtasks?.filter(s => s.is_completed).length || 0;

    let subtasksText = '';
    if (totalSub > 0) {
      subtasksText = `\n📋 *Micro-atividades (${completedSub}/${totalSub}):*\n` +
        subtasks.map(s => `  ${s.is_completed ? '✅' : '⚪'} ${s.title}`).join('\n');
    }

    const priorityEmojis = {
      critical: '🔥 CRÍTICA',
      high: '⚡ ALTA',
      medium: '🟡 MÉDIA',
      low: '🟢 BAIXA'
    };

    const statusNames = {
      todo: 'A Fazer',
      doing: 'Fazendo (Em Andamento)',
      done: 'Concluído'
    };

    const triggerTitles = {
      vencimento: '⏰ ALERTA DE VENCIMENTO PRÓXIMO',
      critica: '🚨 TAREFA CRÍTICA PENDENTE',
      manual: '📢 LEMBRETE DE ATIVIDADE',
      atrasada: '⚠️ ATIVIDADE EM ATRASO'
    };

    const message = 
`*══════ [LIFE OS] ══════*
*${triggerTitles[trigger] || '📢 AVISO DO SISTEMA'}*

📌 *Atividade:* ${task.title}
📅 *Prazo:* ${task.due_date}${task.due_time ? ` às ${task.due_time}` : ''}
⚡ *Prioridade:* ${priorityEmojis[task.priority] || task.priority}
📊 *Quadro Kanban:* ${statusNames[task.status] || task.status}
🏷️ *Categoria:* ${task.category || 'Geral'}${subtasksText}

${task.description ? `📝 *Detalhes:* ${task.description}\n` : ''}
💡 *Dica Life OS:* Mantenha suas atividades em dia para preservar seu Nível de Vida no status *Excelente*!
*══════════════════════*`;

    return await this.sendMessage(userId, {
      message,
      taskId: task.id
    });
  }

  /**
   * Dispara mensagem de teste para o usuário
   */
  static async sendTestMessage(userId, customPhone) {
    const message =
`*══════ [LIFE OS] ══════*
🤖 *TESTE DE INTEGRAÇÃO PLUGSEND*

Olá! Sua conexão entre o *Life OS* e a API do *Plugsend WhatsApp* está funcionando perfeitamente!

✅ Alertas de Agenda e Kanban ativos
✅ Monitoramento de tarefas críticas
✅ Avisos automáticos de vencimento

Você receberá aqui seus lembretes e notificações de produtividade em tempo real.
*══════════════════════*`;

    return await this.sendMessage(userId, {
      phone: customPhone,
      message
    });
  }
}

export default PlugSendService;
