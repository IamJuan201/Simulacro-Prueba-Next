import { NextResponse, type NextRequest } from "next/server";
import {
  authCookieNames,
  clearAuthCookies,
  rotateRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { jsonError } from "@/lib/http";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(authCookieNames.refresh)?.value;

  if (!refreshToken) {
    return jsonError(401, "UNAUTHENTICATED", "La sesión venció. Inicia sesión otra vez.");
  }

  try {
    const tokens = await rotateRefreshToken(refreshToken);

    if (!tokens) {
      const response = NextResponse.json(
        {
          error: {
            code: "UNAUTHENTICATED",
            message: "La sesión venció. Inicia sesión otra vez.",
          },
        },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    const response = NextResponse.json({ data: { refreshed: true } });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    console.error("Error al renovar sesión:", error);
    return jsonError(
      500,
      "INTERNAL_SERVER_ERROR",
      "No se pudo renovar la sesión.",
    );
  }
}
