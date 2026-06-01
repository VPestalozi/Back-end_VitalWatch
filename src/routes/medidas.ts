import { Router } from 'express';
import {
  createMedidas,
  mediaBatimentoHora,
  mediaOxigenacaoHora,
} from '../controllers/MedidasController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota para registrar batimentos e oxigenação
router.post('/enviarMedidas', createMedidas);

// Rota para buscar as últimas 7 médias de batimentos
router.get('/mediaBatimentoHora', authMiddleware, mediaBatimentoHora);

// Rota para buscar as últimas 7 médias de oxigenação
router.get('/mediaOxigenacaoHora', authMiddleware, mediaOxigenacaoHora);

export default router;