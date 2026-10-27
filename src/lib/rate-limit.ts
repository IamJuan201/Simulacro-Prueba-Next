import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

type RateLimitRow = {
  hits: number;
  windowStartedAt: Date;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export async function consumeRateLimit(
  scope: string,
  identity: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = createHash("sha256")
    .update(`${scope}:${identity}`)
    .digest("hex");
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowSeconds * 1_000);
  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" AS bucket ("key", "hits", "windowStartedAt")
    VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE
    SET
      "hits" = CASE
        WHEN bucket."windowStartedAt" <= ${cutoff} THEN 1
        ELSE bucket."hits" + 1
      END,
      "windowStartedAt" = CASE
        WHEN bucket."windowStartedAt" <= ${cutoff} THEN ${now}
        ELSE bucket."windowStartedAt"
      END
    RETURNING "hits", "windowStartedAt"
  `;
  const bucket = rows[0];

  if (!bucket) {
    throw new Error("No se pudo actualizar el límite de solicitudes.");
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(
      (bucket.windowStartedAt.getTime() + windowSeconds * 1_000 - now.getTime()) /
        1_000,
    ),
  );

  return {
    allowed: bucket.hits <= limit,
    retryAfterSeconds,
  };
}
