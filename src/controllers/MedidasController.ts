import type { Request, Response } from 'express';
import { pool } from '../config/database';

export const getDashboardData = async (req: Request, res: Response) => {
  const { userId, periodo } = req.query; // periodo pode ser 'hoje' ou 'historico'

  try {
    if (periodo === 'hoje') {
      // Busca dados brutos para o gráfico de tempo real de hoje
      const result = await pool.query(
        'SELECT batimentos, oxigenacao, created_at FROM medidas_raw WHERE user_id = $1 AND created_at >= CURRENT_DATE ORDER BY created_at ASC',
        [userId]
      );
      return res.json(result.rows);
    } else {
      // Busca na tabela AGREGADA para o gráfico mensal/anual (Performance!)
      const result = await pool.query(
        'SELECT data_referencia, media_batimentos FROM estatisticas_diarias WHERE user_id = $1 ORDER BY data_referencia DESC LIMIT 30',
        [userId]
      );
      return res.json(result.rows);
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
};