import { Router } from 'express';
import {
  createMedidas,
  getDashboardData,
  getUmDiaBatimentos,
  getUmDiaOxigenacao,
} from '../controllers/MedidasController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota para registrar batimentos e oxigenação
router.post('/enviarMedidas', createMedidas);

// Rota para buscar dados do dashboard
router.get('/dashboard', authMiddleware, getDashboardData);

// Rota para buscar a média diária de batimentos
router.get('/estatisticasDiarias/batimentos', authMiddleware, getUmDiaBatimentos);

// Rota para buscar a média diária de oxigenação
router.get('/estatisticasDiarias/oxigenacao', authMiddleware, getUmDiaOxigenacao);

export default router;