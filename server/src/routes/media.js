import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase } from '../services/supabase.js';
import { authenticateToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // Limite de 25MB
});

const router = express.Router();

// POST /api/tasks/:taskId/media - Upload de arquivo/anexo para tarefa
router.post('/tasks/:taskId/media', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const relativePath = `/uploads/${file.filename}`;

    const { data: media, error } = await supabase
      .from('media')
      .insert({
        task_id: taskId,
        user_id: req.user.id,
        original_name: file.originalname,
        filename: file.filename,
        file_path: relativePath,
        mime_type: file.mimetype,
        file_size: file.size
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ media });
  } catch (err) {
    console.error('Erro no upload de mídia:', err);
    res.status(500).json({ error: 'Erro ao fazer upload do anexo' });
  }
});

// DELETE /api/media/:id - Exclui anexo
router.delete('/media/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !media) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    // Remove arquivo físico se existir
    const filePath = path.join(uploadsDir, media.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Não foi possível remover arquivo do disco:', e.message);
      }
    }

    await supabase.from('media').delete().eq('id', id);

    res.json({ success: true, message: 'Anexo removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir anexo' });
  }
});

export default router;
