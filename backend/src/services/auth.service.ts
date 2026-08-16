import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/AppError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

const credentialsSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) => email.trim().toLowerCase()),
  password: z.string().min(8).max(72),
});

export interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

function parseCredentials(input: unknown): { email: string; password: string } {
  const result = credentialsSchema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, result.error.issues[0]?.message ?? 'Invalid email or password');
  }
  return result.data;
}

export async function register(input: unknown): Promise<AuthResult> {
  const { email, password } = parseCredentials(input);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  });

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user };
}

export async function login(input: unknown): Promise<AuthResult> {
  const { email, password } = parseCredentials(input);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}
