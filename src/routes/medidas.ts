import { Router } from 'express';
import { createMedidas, getDashboardData, getUmDiaBatimentos, getUmDiaOxigenacao, createTestUser, } from '../controllers/MedidasController.js';

const router = Router();

// Rota para registrar batimentos e oxigenação
router.post('/enviarMedidas', createMedidas);

// Rota para buscar dados do dashboard
router.get('/dashboard', getDashboardData);

// Rota para buscar a média diária de batimentos
router.get('/estatisticasDiarias/batimentos', getUmDiaBatimentos);

// Rota para buscar a média diária de oxigenação
router.get('/estatisticasDiarias/oxigenacao', getUmDiaOxigenacao);

// Rota TEMPORÁRIA para criar usuário de teste
//
router.post('/criar-usuario-teste', createTestUser);
export default router;