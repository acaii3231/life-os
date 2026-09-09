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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, token, apikey'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Consultar status da conexão com PlugSend
  if (req.method === 'GET') {
    try {
      const { data: settingsRows } = await supabase
        .from('settings')
        .select('key, value')
        .eq('user_id', 1);

      const settings = {};
      if (settingsRows) {
        settingsRows.forEach(r => settings[r.key] = r.value);
      }

      const apiHost = (settings.plugsend_api_url || 'https://plugsend.uazapi.com').trim().replace(/\/$/, '');
      const apiToken = (settings.plugsend_token || '77d9de98-6e8a-44f6-9996-cc11f1196fa7').trim();

      const response = await fetch(`${apiHost}/instance/status`, {
        method: 'GET',
        headers: {
          'token': apiToken
        }
      });

      const data = await response.json().catch(() => ({}));
      return res.status(response.ok ? 200 : response.status).json({
        ok: response.ok,
        data
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { phone, message, taskId, host, token, type, file, docName } = req.body || {};

    // 1. Obter configurações salvas no banco
    const { data: settingsRows } = await supabase
      .from('settings')
      .select('key, value')
      .eq('user_id', 1);

    const settings = {};
    if (settingsRows) {
      settingsRows.forEach(r => settings[r.key] = r.value);
    }

    const apiHost = (host || settings.plugsend_api_url || 'https://plugsend.uazapi.com').trim().replace(/\/$/, '');
    const apiToken = (token || settings.plugsend_token || '77d9de98-6e8a-44f6-9996-cc11f1196fa7').trim();
    let rawPhone = (phone || settings.plugsend_phone || '').trim();

    // Normalizar destino: se for grupo (@g.us) ou canal (@newsletter), mantém intacto. Se privado, apenas dígitos.
    const targetNumber = (rawPhone.includes('@g.us') || rawPhone.includes('@newsletter'))
      ? rawPhone
      : rawPhone.replace(/\D/g, '');

    if (!targetNumber) {
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

    // 2. Definir endpoint oficial da Plugsend
    const isMedia = !!type && !!file;
    const endpoint = isMedia ? `${apiHost}/send/media` : `${apiHost}/send/text`;

    const payload = isMedia ? {
      number: targetNumber,
      type: type,
      file: file,
      docName: docName || undefined,
      text: message || undefined
    } : {
      number: targetNumber,
      text: message,
      linkPreview: true
    };

    const isHttps = endpoint.startsWith('https://');
    const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : new http.Agent();

    const response = await fetch(endpoint, {
      method: 'POST',
      agent,
      headers: {
        'Content-Type': 'application/json',
        'token': apiToken
      },
      body: JSON.stringify(payload)
    });

    const respText = await response.text();
    let respData = {};
    try {
      respData = JSON.parse(respText);
    } catch (e) {
      respData = { raw: respText };
    }

    if (response.ok) {
      // Registrar log com status sent no Supabase
      await supabase.from('notification_logs').insert({
        user_id: 1,
        task_id: taskId || null,
        recipient: targetNumber,
        message: message || `[Envio de Mídia: ${type}]`,
        status: 'sent'
      });

      return res.status(200).json({
        success: true,
        recipient: targetNumber,
        message: 'Mensagem entregue com sucesso via Plugsend WhatsApp!',
        data: respData
      });
    } else {
      const errorMsg = respData?.error || respData?.message || `HTTP ${response.status} - ${respText.slice(0, 150)}`;

      await supabase.from('notification_logs').insert({
        user_id: 1,
        task_id: taskId || null,
        recipient: targetNumber,
        message: message || '[Tentativa de Envio]',
        status: 'failed',
        error_message: errorMsg
      });

      return res.status(response.status).json({
        success: false,
        error: errorMsg,
        message: `Falha na API Plugsend (${errorMsg})`,
        data: respData
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      message: 'Erro interno ao disparar mensagem: ' + err.message
    });
  }
}
