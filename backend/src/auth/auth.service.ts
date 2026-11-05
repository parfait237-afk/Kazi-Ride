import { randomUUID } from 'node:crypto';
import { and, desc, eq, gt, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { otpChallenges, sessions, users } from '../db/schema.js';
import { ApiError } from '../errors.js';
import { sendOtpEmailMessage } from '../services/email.service.js';
import { generateOtp, generateRefreshToken, hashOtp, hashRefreshToken, verifyOtpHash } from './crypto.js';
import { signAccessToken } from './tokens.js';

const OTP_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60_000;
const REQUEST_COOLDOWN_MS = 60_000;

const publicUser = (user: typeof users.$inferSelect) => ({
  id: user.id, email: user.email, phone: user.phone, emailVerified: user.emailVerified,
  phoneVerified: user.phoneVerified, role: user.role, createdAt: user.createdAt,
});

async function assertAccountPair(email: string, phone: string) {
  const matches = await db.select().from(users).where(or(eq(users.email, email), eq(users.phone, phone)));
  if (matches.length === 0) return undefined;
  if (matches.length !== 1 || matches[0]?.email !== email || matches[0]?.phone !== phone) {
    throw new ApiError(409, 'ACCOUNT_CONFLICT', 'L’e-mail et le téléphone ne correspondent pas au même compte.');
  }
  return matches[0];
}

export async function requestOtp(email: string, phone: string) {
  const existingUser = await assertAccountPair(email, phone);
  const cutoff = new Date(Date.now() - REQUEST_COOLDOWN_MS);
  const [recent] = await db.select({ id: otpChallenges.id }).from(otpChallenges)
    .where(and(or(eq(otpChallenges.email, email), eq(otpChallenges.phone, phone)), gt(otpChallenges.createdAt, cutoff)))
    .orderBy(desc(otpChallenges.createdAt)).limit(1);
  if (recent) throw new ApiError(429, 'OTP_RATE_LIMIT', 'Veuillez attendre avant de demander un nouveau code.');

  const id = randomUUID();
  const code = generateOtp();
  let provisionalUserId: string | undefined;
  try {
    if (!existingUser) {
      const [provisionalUser] = await db.insert(users).values({ email, phone }).returning({ id: users.id });
      provisionalUserId = provisionalUser?.id;
      if (!provisionalUserId) throw new ApiError(500, 'USER_CREATION_FAILED', 'Création du compte provisoire impossible.');
    }
    await db.insert(otpChallenges).values({
      id, email, phone, codeHash: hashOtp(id, code), expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    await sendOtpEmailMessage(email, code);
  } catch (error) {
    await db.delete(otpChallenges).where(eq(otpChallenges.id, id));
    if (provisionalUserId) {
      await db.delete(users).where(and(eq(users.id, provisionalUserId), eq(users.emailVerified, false)));
    }
    throw error;
  }
  await db.update(otpChallenges).set({ invalidatedAt: new Date() }).where(and(
    ne(otpChallenges.id, id),
    or(eq(otpChallenges.email, email), eq(otpChallenges.phone, phone)),
    isNull(otpChallenges.consumedAt),
    isNull(otpChallenges.invalidatedAt),
  ));
  return { challengeId: id, expiresInSeconds: OTP_TTL_MS / 1000 };
}

function makeSessionTokens(userId: string, sessionId: string, role: 'PASSENGER') {
  const refreshToken = generateRefreshToken();
  return { accessToken: signAccessToken({ sub: userId, sid: sessionId, role }), refreshToken };
}

export async function verifyOtp(challengeId: string, code: string) {
  const result = await db.transaction(async (tx) => {
    const [challenge] = await tx.select().from(otpChallenges).where(eq(otpChallenges.id, challengeId)).for('update');
    if (!challenge) throw new ApiError(404, 'CHALLENGE_NOT_FOUND', 'Challenge introuvable.');
    if (challenge.consumedAt) throw new ApiError(409, 'OTP_ALREADY_USED', 'Ce code a déjà été utilisé.');
    if (challenge.invalidatedAt) throw new ApiError(409, 'OTP_INVALIDATED', 'Ce code a été remplacé par une nouvelle demande.');
    if (challenge.expiresAt <= new Date()) throw new ApiError(410, 'OTP_EXPIRED', 'Ce code a expiré.');
    if (challenge.attempts >= 5) throw new ApiError(429, 'OTP_MAX_ATTEMPTS', 'Nombre maximal de tentatives atteint.');
    if (!verifyOtpHash(challenge.codeHash, challenge.id, code)) {
      await tx.update(otpChallenges).set({ attempts: sql`${otpChallenges.attempts} + 1` }).where(eq(otpChallenges.id, challenge.id));
      return { invalidOtp: true as const };
    }

    const matches = await tx.select().from(users).where(or(eq(users.email, challenge.email), eq(users.phone, challenge.phone))).for('update');
    let user = matches[0];
    if (matches.length > 1 || (user && (user.email !== challenge.email || user.phone !== challenge.phone))) {
      throw new ApiError(409, 'ACCOUNT_CONFLICT', 'Conflit entre l’e-mail et le téléphone.');
    }
    if (!user) {
      [user] = await tx.insert(users).values({ email: challenge.email, phone: challenge.phone, emailVerified: true }).returning();
    } else if (!user.emailVerified) {
      [user] = await tx.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, user.id)).returning();
    }
    if (!user) throw new ApiError(500, 'USER_CREATION_FAILED', 'Création du compte impossible.');

    const sessionId = randomUUID();
    const tokens = makeSessionTokens(user.id, sessionId, user.role);
    await tx.insert(sessions).values({
      id: sessionId, userId: user.id, refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    await tx.update(otpChallenges).set({ consumedAt: new Date() }).where(and(eq(otpChallenges.id, challenge.id), isNull(otpChallenges.consumedAt)));
    return { invalidOtp: false as const, user: publicUser(user), session: { id: sessionId }, ...tokens };
  });
  if (result.invalidOtp) throw new ApiError(401, 'OTP_INVALID', 'Code incorrect.');
  const { invalidOtp: _invalidOtp, ...response } = result;
  return response;
}

export async function refreshSession(refreshToken: string) {
  const hash = hashRefreshToken(refreshToken);
  const result = await db.transaction(async (tx) => {
    const [session] = await tx.select().from(sessions).where(or(
      eq(sessions.refreshTokenHash, hash), eq(sessions.previousRefreshTokenHash, hash),
    )).for('update');
    if (!session || session.revokedAt || session.expiresAt <= new Date()) throw new ApiError(401, 'SESSION_INVALID', 'Session invalide ou expirée.');
    if (session.previousRefreshTokenHash === hash) {
      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));
      return { replayDetected: true as const };
    }
    const [user] = await tx.select().from(users).where(eq(users.id, session.userId));
    if (!user) throw new ApiError(401, 'SESSION_INVALID', 'Utilisateur introuvable.');
    const tokens = makeSessionTokens(user.id, session.id, user.role);
    await tx.update(sessions).set({
      previousRefreshTokenHash: session.refreshTokenHash,
      refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      lastUsedAt: new Date(),
    }).where(eq(sessions.id, session.id));
    return { replayDetected: false as const, user: publicUser(user), session: { id: session.id }, ...tokens };
  });
  if (result.replayDetected) throw new ApiError(401, 'REFRESH_TOKEN_REUSED', 'Réutilisation d’un ancien refresh token détectée.');
  const { replayDetected: _replayDetected, ...response } = result;
  return response;
}

export async function logout(refreshToken: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.refreshTokenHash, hashRefreshToken(refreshToken)), isNull(sessions.revokedAt)));
}

export async function getUserForSession(userId: string, sessionId: string) {
  const [row] = await db.select({ user: users, session: sessions }).from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), eq(users.id, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())));
  if (!row) throw new ApiError(401, 'SESSION_INVALID', 'Session invalide.');
  return publicUser(row.user);
}

export async function resendOtp(challengeId: string) {
  const [challenge] = await db.select().from(otpChallenges).where(eq(otpChallenges.id, challengeId));
  if (!challenge) throw new ApiError(404, 'CHALLENGE_NOT_FOUND', 'Challenge introuvable.');
  return requestOtp(challenge.email, challenge.phone);
}
