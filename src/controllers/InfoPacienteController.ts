import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

export const getInfoPacienteCard = async (req: AuthRequest, res: Response): Promise<any> => {
  const id = req.params.id as string;

  if (!id) {
    return res.status(400).json({ error: 'ID do paciente não fornecido na requisição' });
  }

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { paciente_id: id },
      select: {
        nome: true,
        idade: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    return res.json({
      nome: paciente.nome,
      idade: paciente.idade,
      email: paciente.user.email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar informações do paciente' });
  }
};
