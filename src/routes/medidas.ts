import { Router } from 'express';
import { createMedidas, getDashboardData } from '../controllers/MedidasController';

const router = Router();

// Rota para registrar batimentos e oxigenação
router.post('/enviarMedidas', createMedidas);

// Rota para buscar dados do dashboard
router.get('/dashboard', getDashboardData);

export default router;