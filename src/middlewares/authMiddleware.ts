import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const SECRET_KEY = (process.env.JWT_SECRET) as string;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Formato do token inválido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as unknown as { id: string; role: string };
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireNurseRole = (req: AuthRequest, res: Response, next: NextFunction): any => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  if (req.user.role !== 'enfermeira') {
    return res.status(403).json({ error: 'Acesso negado: Apenas enfermeiras podem realizar esta ação' });
  }

  return next();
};
