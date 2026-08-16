import jwt from 'jsonwebtoken';

// Pinned explicitly on both sign and verify. Only a single symmetric secret
// is ever used here (no asymmetric keypair to substitute), so the classic
// RS256/HS256 algorithm-confusion attack doesn't apply — this is
// zero-cost hardening per jsonwebtoken's own recommendation, not a fix for
// a live vulnerability.
const ALGORITHM = 'HS256';

export interface TokenPayload {
  sub: string;
  email: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '2h', algorithm: ALGORITHM });
}

// jwt.verify's return type is asserted, not actually checked, by the
// library — `as TokenPayload` alone would be a compile-time-only cast.
// Every downstream query scopes by `req.userId` (set from `payload.sub`
// here); if `sub` were ever silently missing or empty, Prisma's
// `where: { userId: undefined }` doesn't mean "match nothing" — it omits
// the filter entirely, turning every list/delete/simulate query unscoped
// across all users. Not reachable today (signToken always sets `sub`, and
// forging a token without the secret isn't possible), but this is the
// actual trust boundary between "bytes we didn't sign" and "a userId we
// scope every query by," so it gets a real runtime check rather than a cast.
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getSecret(), { algorithms: [ALGORITHM] });

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as { sub?: unknown }).sub !== 'string' ||
    (decoded as { sub: string }).sub.length === 0 ||
    typeof (decoded as { email?: unknown }).email !== 'string'
  ) {
    throw new Error('Token payload missing required claims');
  }

  return decoded as TokenPayload;
}
