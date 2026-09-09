import express from 'express';
import { authenticateToken } from './auth.js';
import { LifeLevelService } from '../services/lifeLevel.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/life-level - Retorna score e diagnóstico do Nível de Vida
router.get('/', async (req, res) => {
  try {
    const analysis = await LifeLevelService.calculate(req.user.id);
    res.json(analysis);
  } catch (err) {
    console.error('Erro ao calcular Nível de Vida:', err);
    res.status(500).json({ error: 'Erro ao processar algoritmo de Nível de Vida' });
  }
});

export default router;
