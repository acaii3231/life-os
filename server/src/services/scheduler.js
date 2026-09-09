import cron from 'node-cron';
import { supabase } from './supabase.js';
import { PlugSendService } from './plugsend.js';

export function initScheduler() {
  console.log('⏰ Inicializando scheduler de notificações WhatsApp (Plugsend)...');

  // Executa a cada minuto: "* * * * *"
  cron.schedule('* * * * *', async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Buscar tarefas ativas não concluídas com notificação ativada
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('notify_whatsapp', true)
        .neq('status', 'done')
        .is('notified_at', null);

      if (error || !tasks || tasks.length === 0) {
        return;
      }

      for (const task of tasks) {
        const isToday = task.due_date === todayStr;
        const isPast = task.due_date < todayStr;
        const isCritical = task.priority === 'critical';

        if (isToday || isPast || isCritical) {
          const trigger = isPast ? 'atrasada' : (isCritical ? 'critica' : 'vencimento');
          console.log(`📢 Disparando alerta automático WhatsApp para tarefa #${task.id}: "${task.title}" (Gatilho: ${trigger})`);

          await PlugSendService.sendTaskAlert(task.user_id, task, trigger);

          // Atualiza notified_at para não disparar em loop a cada minuto
          await supabase
            .from('tasks')
            .update({ notified_at: new Date().toISOString() })
            .eq('id', task.id);
        }
      }
    } catch (err) {
      console.error('Erro no scheduler de notificações:', err.message);
    }
  });
}

export default initScheduler;
