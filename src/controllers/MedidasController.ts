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

    // Emissão do evento WebSocket para a sala da enfermeira
    if (paciente.enfermeira_id) {
      const io = req.app.get('io');
      if (io) {
        io.to(`enfermeira_${paciente.enfermeira_id}`).emit('novaMedida', {
          paciente_id: paciente.paciente_id,
          batimentos: heatRate,
          oxigenacao: spo2,
          time: data.time || new Date(),
        });
      }
    }

    return res.status(201).json({ message: 'Medidas registradas com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gravar as medidas' });
  }
};

export const getDashboardData = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const { periodo } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    if (periodo === 'hoje') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = await prisma.medida.findMany({
        where: {
          paciente_id: userId,
          time: {
            gte: today,
          },
        },
        select: {
          batimentos: true,
          oxigenacao: true,
          time: true,
        },
        orderBy: {
          time: 'asc',
        },
      });
      return res.json(result);
    } else {
      const result = await prisma.estatisticasDiarias.findMany({
        where: {
          paciente_id: userId,
        },
        select: {
          data_referencia: true,
          media_batimentos: true,
        },
        orderBy: {
          data_referencia: 'desc',
        },
        take: 30,
      });
      return res.json(result);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar dados' });
  }
};

export const getUmDiaBatimentos = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const parsedDate = parseDate(req.query.date) ?? new Date();

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Ajusta para o início do dia no formato UTC (00:00:00 UTC) igual ao do banco de dados
  const date = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));

  const nextDate = new Date(date);
  nextDate.setUTCDate(date.getUTCDate() + 1);

  try {
    const result = await prisma.estatisticasDiarias.findFirst({
      where: {
        paciente_id: userId,
        data_referencia: {
          gte: date,
          lt: nextDate,
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

    if (!result) {
      return res.status(404).json({ error: 'Nenhuma média de batimentos encontrada para este dia' });
    }

    return res.json({
      data: result.data_referencia.toISOString().slice(0, 10),
      media_batimentos: result.media_batimentos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar média de batimentos' });
  }
};

export const getUmDiaOxigenacao = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const parsedDate = parseDate(req.query.date) ?? new Date();

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // Ajusta para o início do dia no formato UTC (00:00:00 UTC) igual ao do banco de dados
  const date = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));

  const nextDate = new Date(date);
  nextDate.setUTCDate(date.getUTCDate() + 1);

  try {
    const result = await prisma.estatisticasDiarias.findFirst({
      where: {
        paciente_id: userId,
        data_referencia: {
          gte: date,
          lt: nextDate,
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

    if (!result) {
      return res.status(404).json({ error: 'Nenhuma média de oxigenação encontrada para este dia' });
    }

    return res.json({
      data: result.data_referencia.toISOString().slice(0, 10),
      media_oxigenacao: result.media_oxigenacao,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar média de oxigenação' });
  }
};



