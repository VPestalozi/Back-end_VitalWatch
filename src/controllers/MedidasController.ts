import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const createMedidas = async (req: Request, res: Response): Promise<any> => {
  const id_micro = req.body.id_micro;
  const heatRate = parseNumber(req.body.heat_rate);
  const spo2 = parseNumber(req.body.spo2);
  const timestamp = req.body.timestamp;

  if (!id_micro || heatRate === undefined || spo2 === undefined) {
    return res.status(400).json({
      error: 'id_micro, heat_rate e spo2 são obrigatórios'
    });
  }

  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id_micro: String(id_micro) }
    });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente com este id_micro não encontrado' });
    }

    const data: any = {
      paciente_id: paciente.paciente_id,
      batimentos: heatRate,
      oxigenacao: spo2,
    };

    if (timestamp) {
      data.time = new Date(timestamp);
    }

    await prisma.medida.create({ data });

    // Emissão do evento WebSocket para a sala da enfermeira e do paciente
    const io = req.app.get('io');
    if (io) {
      const payload = {
        paciente_id: paciente.paciente_id,
        batimentos: heatRate,
        oxigenacao: spo2,
        time: data.time || new Date(),
      };
      
      if (paciente.enfermeira_id) {
        io.to(`enfermeira_${paciente.enfermeira_id}`).emit('novaMedida', payload);
      }
      io.to(`paciente_${paciente.paciente_id}`).emit('novaMedida', payload);
    }

    return res.status(201).json({ message: 'Medidas registradas com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gravar as medidas' });
  }
};

export const mediaBatimentoHora = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const parsedDate = parseDate(req.query.date) ?? new Date();

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Arredonda para o início da hora
  const endHour = new Date(parsedDate);
  endHour.setMinutes(0, 0, 0);

  const startHour = new Date(endHour);
  startHour.setHours(endHour.getHours() - 6);

  try {
    const result = await prisma.estatisticasHorarias.findMany({
      where: {
        paciente_id: userId,
        data_referencia: {
          gte: startHour,
          lte: endHour,
        },
      },
      select: {
        data_referencia: true,
        media_batimentos: true,
      },
      orderBy: {
        data_referencia: 'asc',
      },
    });

    // Mapeando para garantir 7 horas (se não tiver dado preenche com 0)
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const hour = new Date(endHour);
      hour.setHours(endHour.getHours() - i);
      
      const found = result.find(r => r.data_referencia.getTime() === hour.getTime());
      data.push({
        hora: hour.toISOString(),
        media: found ? found.media_batimentos : 0
      });
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar médias' });
  }
};

export const mediaOxigenacaoHora = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const parsedDate = parseDate(req.query.date) ?? new Date();

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Arredonda para o início da hora
  const endHour = new Date(parsedDate);
  endHour.setMinutes(0, 0, 0);

  const startHour = new Date(endHour);
  startHour.setHours(endHour.getHours() - 6);

  try {
    const result = await prisma.estatisticasHorarias.findMany({
      where: {
        paciente_id: userId,
        data_referencia: {
          gte: startHour,
          lte: endHour,
        },
      },
      select: {
        data_referencia: true,
        media_oxigenacao: true,
      },
      orderBy: {
        data_referencia: 'asc',
      },
    });

    // Mapeando para garantir 7 horas (se não tiver dado preenche com 0)
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const hour = new Date(endHour);
      hour.setHours(endHour.getHours() - i);
      
      const found = result.find(r => r.data_referencia.getTime() === hour.getTime());
      data.push({
        hora: hour.toISOString(),
        media: found ? found.media_oxigenacao : 0
      });
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar médias' });
  }
};
