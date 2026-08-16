import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/AppError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

// Prisma's unique-constraint violation (P2002). Checked structurally rather
// than via `instanceof Prisma.PrismaClientKnownRequestError` because that
// type isn't resolvable under this project's NodeNext module resolution.
function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'P2002';
}

const credentialsSchema = z.object({
  // Normalize before validating format, so a whitespace-padded but otherwise
  // valid address (e.g. from a trailing space on paste) isn't rejected.
  email: z
    .string()
    .transform((email) => email.trim().toLowerCase())
    .pipe(z.string().email()),
  password: z.string().min(8).max(72),
});

export interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

// Maps zod's raw issues to messages that name the field and avoid leaking
// library/implementation phrasing (e.g. zod's default "String must contain
// at most 72 character(s)" for the password) straight into the client.
function formatCredentialsError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return 'email and password are required';
  }

  const field = issue.path[0];
  if (field === 'email') {
    return 'email must be a valid email address';
  }
  if (field === 'password') {
    if (issue.code === 'too_small') return 'password must be at least 8 characters';
    if (issue.code === 'too_big') return 'password must be 72 characters or fewer';
    return 'password is invalid';
  }

  return field ? `${String(field)} is invalid` : 'email and password are required';
}

function parseCredentials(input: unknown): { email: string; password: string } {
  const result = credentialsSchema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, formatCredentialsError(result.error));
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

  let user: { id: string; email: string };
  try {
    user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  } catch (err) {
    // The findUnique check above is a fast-path convenience; two requests can
    // still race past it before either create() commits. The unique
    // constraint on email is the real guard — translate its violation into
    // the same 409 the fast-path would have returned.
    if (isUniqueConstraintError(err)) {
      throw new AppError(409, 'Email is already registered');
    }
    throw err;
  }

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
