import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Role } from "../../generated/prisma/enums";
import { prisma } from "@/lib/db";

const ACCESS_COOKIE = "bidhub_access";
const REFRESH_COOKIE = "bidhub_refresh";
const TOKEN_ALGORITHM = "HS256";

type TokenDuration = {
  value: string;
  milliseconds: number;
  seconds: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessMaxAge: number;
  refreshMaxAge: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

function getDuration(environmentName: string, fallback: string): TokenDuration {
  const value = process.env[environmentName] ?? fallback;
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    throw new Error(`${environmentName} must use a duration such as 15m or 7d`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier =
    unit === "s"
      ? 1_000
      : unit === "m"
        ? 60_000
        : unit === "h"
          ? 3_600_000
          : 86_400_000;
  const milliseconds = amount * multiplier;

  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) {
    throw new Error(`${environmentName} must be a positive duration`);
  }

  return { value, milliseconds, seconds: Math.ceil(milliseconds / 1_000) };
}

function getSecret(environmentName: string): Uint8Array {
  const value = process.env[environmentName];

  if (!value || Buffer.byteLength(value) < 32) {
    throw new Error(`${environmentName} must contain at least 32 bytes`);
  }

  return new TextEncoder().encode(value);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createAccessToken(userId: string, role: Role): Promise<string> {
  const duration = getDuration("ACCESS_TOKEN_EXPIRES_IN", "15m");

  return new SignJWT({ tokenType: "access", role })
    .setProtectedHeader({ alg: TOKEN_ALGORITHM, typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(duration.value)
    .sign(getSecret("JWT_ACCESS_SECRET"));
}

async function createRefreshToken(
  userId: string,
  role: Role,
): Promise<{
  token: string;
  tokenHash: string;
  expiresAt: Date;
  maxAge: number;
}> {
  const duration = getDuration("REFRESH_TOKEN_EXPIRES_IN", "7d");
  const now = Date.now();
  const token = await new SignJWT({ tokenType: "refresh", role })
    .setProtectedHeader({ alg: TOKEN_ALGORITHM, typ: "JWT" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(duration.value)
    .sign(getSecret("JWT_REFRESH_SECRET"));

  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(now + duration.milliseconds),
    maxAge: duration.seconds,
  };
}

export async function issueAuthTokens(user: Pick<AuthenticatedUser, "id" | "role">): Promise<AuthTokens> {
  const accessDuration = getDuration("ACCESS_TOKEN_EXPIRES_IN", "15m");
  const refresh = await createRefreshToken(user.id, user.role);
  const accessToken = await createAccessToken(user.id, user.role);

  await prisma.refreshToken.create({
    data: {
      tokenHash: refresh.tokenHash,
      userId: user.id,
      expiresAt: refresh.expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: refresh.token,
    accessMaxAge: accessDuration.seconds,
    refreshMaxAge: refresh.maxAge,
  };
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens): void {
  const baseOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions,
    maxAge: tokens.accessMaxAge,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions,
    maxAge: tokens.refreshMaxAge,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  const baseOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  };

  response.cookies.set(ACCESS_COOKIE, "", baseOptions);
  response.cookies.set(REFRESH_COOKIE, "", baseOptions);
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(accessToken, getSecret("JWT_ACCESS_SECRET"), {
      algorithms: [TOKEN_ALGORITHM],
    }));
  } catch {
    return null;
  }

  if (payload.tokenType !== "access" || typeof payload.sub !== "string") {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, fullName: true, role: true },
  });
}

export async function rotateRefreshToken(token: string): Promise<AuthTokens | null> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, getSecret("JWT_REFRESH_SECRET"), {
      algorithms: [TOKEN_ALGORITHM],
    }));
  } catch {
    return null;
  }

  if (
    payload.tokenType !== "refresh" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string"
  ) {
    return null;
  }

  const tokenHash = hashToken(token);
  const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  const now = new Date();

  if (
    !storedToken ||
    storedToken.userId !== payload.sub ||
    storedToken.revokedAt !== null ||
    storedToken.expiresAt <= now
  ) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true },
  });

  if (!user) {
    return null;
  }

  const accessDuration = getDuration("ACCESS_TOKEN_EXPIRES_IN", "15m");
  const refresh = await createRefreshToken(user.id, user.role);
  const accessToken = await createAccessToken(user.id, user.role);
  const rotated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });

    if (result.count !== 1) {
      return false;
    }

    await transaction.refreshToken.create({
      data: {
        tokenHash: refresh.tokenHash,
        userId: user.id,
        expiresAt: refresh.expiresAt,
      },
    });

    return true;
  });

  if (!rotated) {
    return null;
  }

  return {
    accessToken,
    refreshToken: refresh.token,
    accessMaxAge: accessDuration.seconds,
    refreshMaxAge: refresh.maxAge,
  };
}

export async function revokeRefreshToken(token: string | undefined): Promise<void> {
  if (!token) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function readRefreshCookie(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export const authCookieNames = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
} as const;
