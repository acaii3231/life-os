import { app } from './app.js';
import { config } from './config.js';
import { initScheduler } from './services/scheduler.js';

// Inicia servidor standalone
app.listen(config.port, () => {
  console.log(`\n🚀 [Life OS Server] Rodando na porta ${config.port}`);
  console.log(`🔗 Supabase URL: ${config.supabaseUrl}`);
  console.log(`📡 Scheduler de Notificações WhatsApp Plugsend ativo\n`);
  
  // Inicializa rotinas automáticas de lembretes
  initScheduler();
});
