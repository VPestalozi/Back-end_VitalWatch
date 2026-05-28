import { Router } from 'express';
import { getInfoPacienteCard } from '../controllers/InfoPacienteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota para buscar as informações do paciente para o card
router.get('/card/:id', authMiddleware, getInfoPacienteCard);

export default router;
