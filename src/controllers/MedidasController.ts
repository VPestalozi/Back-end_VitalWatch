import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const getUserId = (body: Record<string, unknown>) => (body.userId || body.user_id) as string | undefined;
const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getQueryUserId = (query: Record<string, unknown>) => (query.userId || query.user_id) as string | undefined;

export const createMedidas = async (req: Request, res: Response) => {
  const targetUserId = getUserId(req.body);
  const heatRate = parseNumber(req.body.heat_rate);
  const spo2 = parseNumber(req.body.spo2);
  const timestamp = req.body.timestamp;

  if (!targetUserId || heatRate === undefined || spo2 === undefined) {
    return res.status(400).json({ 
      error: 'userId, heat_rate e spo2 são obrigatórios e devem ser numéricos' 
    });
  }

  try {
    const data: any = {
      user_id: targetUserId,
      batimentos: heatRate,
      oxigenacao: spo2,
    };

    if (timestamp) {
      data.time = new Date(timestamp);
    }

    await prisma.medida.create({ data });

    return res.status(201).json({ message: 'Medidas registradas com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gravar as medidas' });
  }
};

export const getDashboardData = async (req: Request, res: Response) => {
  const { userId, periodo } = req.query;

  try {
    if (periodo === 'hoje') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = await prisma.medida.findMany({
        where: {
          user_id: userId as string,
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
          user_id: userId as string,
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

export const getUmDiaBatimentos = async (req: Request, res: Response) => {
  const userId = getQueryUserId(req.query);
  const date = parseDate(req.query.date) ?? new Date();

  if (!userId) {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  date.setHours(0, 0, 0, 0);
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);

  try {
    const result = await prisma.estatisticasDiarias.findFirst({
      where: {
        user_id: userId,
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

export const getUmDiaOxigenacao = async (req: Request, res: Response) => {
  const userId = getQueryUserId(req.query);
  const date = parseDate(req.query.date) ?? new Date();

  if (!userId) {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  date.setHours(0, 0, 0, 0);
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);

  try {
    const result = await prisma.estatisticasDiarias.findFirst({
      where: {
        user_id: userId,
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