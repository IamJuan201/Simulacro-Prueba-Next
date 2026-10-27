import { NextResponse } from "next/server";
import { loginSchema } from "@/features/auth/schemas";
import { issueAuthTokens, setAuthCookies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, parseJson } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { consumeRateLimit } from "@/lib/rate-limit";

const INVALID_CREDENTIALS = "El correo o la contraseña no son válidos.";

export async function POST(request: Request) {
  const parsed = await parseJson(request, loginSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const ipAddress =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const [emailLimit, ipLimit] = await Promise.all([
      consumeRateLimit("login-email", parsed.data.email, 5, 15 * 60),
      consumeRateLimit("login-ip", ipAddress, 30, 15 * 60),
    ]);

    if (!emailLimit.allowed || !ipLimit.allowed) {
      const retryAfterSeconds = Math.max(
        emailLimit.allowed ? 0 : emailLimit.retryAfterSeconds,
        ipLimit.allowed ? 0 : ipLimit.retryAfterSeconds,
      );
      const response = jsonError(
        429,
        "RATE_LIMITED",
        "Demasiados intentos. Espera antes de volver a intentarlo.",
      );
      response.headers.set("Retry-After", String(retryAfterSeconds));
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        passwordHash: true,
      },
    });

    const validPassword = user
      ? await verifyPassword(parsed.data.password, user.passwordHash)
      : false;

    if (!user || !validPassword) {
      return jsonError(401, "UNAUTHENTICATED", INVALID_CREDENTIALS);
    }

    const tokens = await issueAuthTokens(user);
    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
    });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return jsonError(
      500,
      "INTERNAL_SERVER_ERROR",
      "No se pudo iniciar sesión.",
    );
  }
}
