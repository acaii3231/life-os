import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yqbzqjjnlzghgnrzwppy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYnpxampubHpnaGducnp3cHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Nzk3NjEsImV4cCI6MjEwNDQ1NTc2MX0.kQ7q8iAxh4JALMoTnmGmUDzdENPscT56s83WMDrwzhQ';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, apikey'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificação de status via GET (útil para testar no navegador ou validador de webhook)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Life OS Webhook Handler',
      message: 'O endpoint de webhook está operacional e pronto para receber notificações do Plugsend.',
      timestamp: new Date().toISOString()
    });
  }

  // Recebimento de eventos do WhatsApp / Plugsend via POST
  if (req.method === 'POST') {
    try {
      const payload = req.body || {};
      console.log('[Webhook Plugsend Recebido]:', JSON.stringify(payload));

      const event = payload.event || payload.type || 'evento_whatsapp';
      const sender = payload.sender || payload.from || payload.number || payload.phone || 'plugsend';
      const content = payload.message || payload.text || payload.body || JSON.stringify(payload);

      // Registrar o evento recebido na tabela notification_logs do Supabase
      await supabase.from('notification_logs').insert({
        user_id: 1,
        recipient: String(sender).slice(0, 50),
        message: `[Webhook ${event}]: ${typeof content === 'string' ? content : JSON.stringify(content)}`.slice(0, 500),
        status: 'received'
      });

      return res.status(200).json({
        success: true,
        received: true,
        event: event,
        message: 'Evento de webhook processado e gravado no Life OS com sucesso!'
      });
    } catch (err) {
      console.error('Erro no processamento do webhook:', err);
      return res.status(200).json({
        received: true,
        warning: 'Webhook recebido com erro interno: ' + err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
