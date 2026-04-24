import { Router } from 'express';
import { createMedidas, getDashboardData, getUmDiaBatimentos, getUmDiaOxigenacao, } from '../controllers/MedidasController';

const router = Router();

// Rota para registrar batimentos e oxigenação
router.post('/enviarMedidas', createMedidas);

// Rota para buscar dados do dashboard
router.get('/dashboard', getDashboardData);

// Rota para buscar a média diária de batimentos
router.get('/estatisticasDiarias/batimentos', getUmDiaBatimentos);

// Rota para buscar a média diária de oxigenação
router.get('/estatisticasDiarias/oxigenação', getUmDiaOxigenacao);

export default router;