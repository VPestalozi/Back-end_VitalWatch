import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware, requireNurseRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Rota de Login Unificado (serve para Enfermeira e Paciente)
router.post('/login', AuthController.login);

// Rota aberta: Registro de Enfermeira
router.post('/enfermeiraRegistro', AuthController.enfermeiraRegistro);

// Rota protegida: Registro de Paciente (Apenas enfermeiras logadas)
router.post('/pacienteRegistro', authMiddleware, requireNurseRole, AuthController.pacienteRegistro);

// Rota protegida: Troca de Senha
router.put('/change-password', authMiddleware, AuthController.changePassword);

export default router;
