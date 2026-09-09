import https from 'https';
import http from 'http';
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { phone, message, taskId, host, instance, token } = req.body || {};

    // 1. Obter configurações atuais salvas no Supabase
    const { data: settingsRows } = await supabase
      .from('settings')
      .select('key, value')
      .eq('user_id', 1);

    const settings = {};
    if (settingsRows) {
      settingsRows.forEach(r => settings[r.key] = r.value);
    }

    const apiHost = (host || settings.plugsend_api_url || 'https://api.plugsend.com').trim().replace(/\/$/, '');
    const apiInstance = (instance || settings.plugsend_instance || 'plugsend-6281948').trim();
    const apiToken = (token || settings.plugsend_token || '77d9de98-6e8a-44f6-9996-cc11f1196fa7').trim();
    const targetPhone = (phone || settings.plugsend_phone || '').trim().replace(/\D/g, '');

    if (!targetPhone) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum número de telefone configurado para envio de WhatsApp. Preencha em Configurações.'
      });
    }

    if (!apiToken) {
      return res.status(400).json({
        success: false,
        error: 'Token da API Plugsend não configurado. Insira o token em Configurações.'
      });
    }

    // 2. Montar lista de rotas candidatas para Plugsend / W-API
    const candidateEndpoints = [
      {
        name: 'W-API / Plugsend connectionKey Query',
        url: `${apiHost}/message/sendText?connectionKey=${encodeURIComponent(apiInstance)}`,
        payload: {
          number: targetPhone,
          text: message,
          message: message
        }
      },
      {
        name: 'Plugsend Instance Path',
        url: `${apiHost}/message/sendText/${encodeURIComponent(apiInstance)}`,
        payload: {
          number: targetPhone,
          text: message,
          textMessage: { text: message },
          options: { delay: 1200, presence: 'composing' }
        }
      },
      {
        name: 'Generic Send Endpoint',
        url: `${apiHost}/send`,
        payload: {
          connectionKey: apiInstance,
          phoneNumber: targetPhone,
          message: message
        }
      },
      {
        name: 'V1 Messages Endpoint',
        url: `${apiHost}/v1/messages`,
        payload: {
          number: targetPhone,
          instance: apiInstance,
          message: message
        }
      }
    ];

    let lastError = null;
    let successEndpoint = null;
    let lastResponse = null;

    // 3. Tentar envio contornando possíveis certificados SSL inválidos no backend Node
    for (const ep of candidateEndpoints) {
      try {
        const isHttps = ep.url.startsWith('https://');
        const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : new http.Agent();

        const response = await fetch(ep.url, {
          method: 'POST',
          agent,
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiToken,
            'Authorization': `Bearer ${apiToken}`
          },
          body: JSON.stringify(ep.payload)
        });

        const respText = await response.text();
        let respData = {};
        try {
          respData = JSON.parse(respText);
        } catch (e) {
          respData = { raw: respText };
        }

        if (response.ok) {
          successEndpoint = ep.name;
          lastResponse = respData;
          break;
        } else {
          lastError = `[HTTP ${response.status}] ${respData.message || respData.error || respText.slice(0, 150)}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (successEndpoint) {
      // Registrar log com sucesso
      await supabase.from('notification_logs').insert({
        user_id: 1,
        task_id: taskId || null,
        recipient: targetPhone,
        message: message,
        status: 'sent'
      });

      return res.status(200).json({
        success: true,
        endpoint: successEndpoint,
        recipient: targetPhone,
        message: 'Mensagem enviada com sucesso ao WhatsApp!',
        details: lastResponse
      });
    } else {
      // Registrar log de falha com detalhes diagnósticos
      await supabase.from('notification_logs').insert({
        user_id: 1,
        task_id: taskId || null,
        recipient: targetPhone,
        message: message,
        status: 'failed',
        error_message: `Host: ${apiHost} - Erro: ${lastError}`
      });

      return res.status(502).json({
        success: false,
        hostTested: apiHost,
        instanceTested: apiInstance,
        recipient: targetPhone,
        error: lastError,
        message: `Falha na API Plugsend (${lastError}). Verifique se o Host da API informado no painel da Plugsend confere com ${apiHost}.`
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      message: 'Erro interno ao processar disparo de WhatsApp: ' + err.message
    });
  }
}
