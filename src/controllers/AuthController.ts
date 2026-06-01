import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';

const SECRET_KEY = (process.env.JWT_SECRET) as string;

export class AuthController {
  // Rota aberta: Registro da Enfermeira
  static async enfermeiraRegistro(req: Request, res: Response): Promise<any> {
    const { email, senha, nome } = req.body;

    if (!email || !senha || !nome) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    try {
      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const password_hash = await bcrypt.hash(senha, 10);

      const novaEnfermeira = await prisma.user.create({
        data: {
          email,
          password_hash,
          nome,
          role: 'enfermeira',
        },
      });

      return res.status(201).json({
        message: 'Enfermeira registrada com sucesso',
        user: { id: novaEnfermeira.id, email: novaEnfermeira.email, nome: novaEnfermeira.nome, role: novaEnfermeira.role },
      });
    } catch (error) {
      console.error('Erro no registro da enfermeira:', error);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }

  // Rota protegida: Registro do Paciente (Apenas enfermeiras acessam)
  static async pacienteRegistro(req: AuthRequest, res: Response): Promise<any> {
    // A enfermeira atual vem do middleware (req.user)
    const enfermeira_id = req.user?.id;

    if (!enfermeira_id) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { email, senha, nome, idade, cpf, telefone, id_micro } = req.body;

    if (!email || !senha || !nome) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    try {
      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const password_hash = await bcrypt.hash(senha, 10);

      // Cria o usuário e o perfil do paciente em uma única transação
      const novoPaciente = await prisma.user.create({
        data: {
          email,
          password_hash,
          role: 'paciente',
          paciente: {
            create: {
              enfermeira_id,
              nome,
              idade: idade ? Number(idade) : null,
              cpf: cpf || null,
              telefone: telefone || null,
              id_micro: id_micro || null,
            },
          },
        },
        include: {
          paciente: true,
        },
      });

      return res.status(201).json({
        message: 'Paciente registrado com sucesso',
        paciente: {
          id: novoPaciente.id,
          email: novoPaciente.email,
          perfil: (novoPaciente as any).paciente,
        },
      });
    } catch (error) {
      console.error('Erro no registro do paciente:', error);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }

  // Rota Unificada: Login
  static async login(req: Request, res: Response): Promise<any> {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const isPasswordValid = await bcrypt.compare(senha, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET_KEY,
        { expiresIn: '7d' } // O token expira em 7 dias
      );

      return res.json({
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }

  // Rota Protegida: Alterar Senha
  static async changePassword(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    const { senhaAtual, novaSenha } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const isPasswordValid = await bcrypt.compare(senhaAtual, user.password_hash);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      const password_hash = await bcrypt.hash(novaSenha, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password_hash },
      });

      return res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro na alteração de senha:', error);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }
}
