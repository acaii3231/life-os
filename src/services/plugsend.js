import { supabase } from './supabase.js';

export class PlugSendService {
  /**
   * Recupera configurações do Plugsend do usuário
   */
  static async getUserSettings(userId = 1) {
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
      instance: map.plugsend_instance || 'plugsend-6281948',
      token: map.plugsend_token || '77d9de98-6e8a-44f6-9996-cc11f1196fa7',
      phone: map.plugsend_phone || '',
      simulationMode: map.plugsend_simulation_mode === 'true',
      notifyDueTasks: map.notify_due_tasks !== 'false',
      notifyCriticalTasks: map.notify_critical_tasks !== 'false'
    };
  }

  /**
   * Dispara mensagem via WhatsApp (Plugsend ou Simulação)
   */
  static async sendMessage(userId = 1, { phone, message, taskId = null }) {
    const settings = await this.getUserSettings(userId);
    const targetPhone = (phone || settings.phone || '').trim();

    if (!targetPhone) {
      return {
        success: false,
        simulated: false,
        message: 'Nenhum número de telefone configurado para envio de WhatsApp'
      };
    }

    // Se estiver em modo de simulação ou sem token configurado
    if (settings.simulationMode || !settings.token) {
      console.log(`\n================= [WHATSAPP PLUGSEND - SIMULAÇÃO] =================`);
      console.log(`📱 Para: ${targetPhone}`);
      console.log(`💬 Mensagem:\n${message}`);
      console.log(`===================================================================\n`);

      const { data: log } = await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          task_id: taskId,
          recipient: targetPhone,
          message: message,
          status: 'simulated',
          error_message: !settings.token ? 'Modo simulação (sem token de API)' : 'Modo Sandbox ativo'
        })
        .select()
        .single();

      return {
        success: true,
        simulated: true,
        logId: log?.id,
        recipient: targetPhone,
        message: 'Alerta gerado com sucesso no modo Sandbox/Simulação'
      };
    }

    // Modo de produção: Chamada à API do Plugsend com a Instância
    try {
      const cleanPhone = targetPhone.replace(/\D/g, '');
      const baseUrl = settings.apiUrl.replace(/\/$/, '');
      const instance = settings.instance || 'plugsend-6281948';

      // Tenta rota com instância do Plugsend (padrão /message/sendText/:instance)
      const primaryEndpoint = `${baseUrl}/message/sendText/${instance}`;
      const payload = {
        number: cleanPhone,
        options: {
          delay: 1200,
          presence: 'composing'
        },
        textMessage: {
          text: message
        },
        text: message
      };

      const headers = {
        'Content-Type': 'application/json',
        'apikey': settings.token,
        'Authorization': `Bearer ${settings.token}`
      };

      let response = await fetch(primaryEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }).catch(() => null);

      // Se endpoint primário não respondeu ou retornou 404, tenta endpoint alternativo /v1/messages
      if (!response || !response.ok) {
        const fallbackEndpoint = `${baseUrl}/v1/messages`;
        const fallbackResponse = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            number: cleanPhone,
            instance: instance,
            message: message
          })
        }).catch(() => null);

        if (fallbackResponse && fallbackResponse.ok) {
          response = fallbackResponse;
        }
      }

      const responseData = response ? await response.json().catch(() => ({})) : {};

      if (!response || !response.ok) {
        throw new Error(responseData.message || responseData.error || (response ? `HTTP ${response.status}` : 'Falha de conexão com servidor Plugsend'));
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
        message: 'Mensagem enviada com sucesso via Plugsend WhatsApp!'
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
   * Dispara alerta de tarefa
   */
  static async sendTaskAlert(userId = 1, task, trigger = 'vencimento') {
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
   * Envia mensagem de teste
   */
  static async sendTestMessage(userId = 1, customPhone) {
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
