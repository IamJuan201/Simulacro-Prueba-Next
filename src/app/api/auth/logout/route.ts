import { NextResponse, type NextRequest } from "next/server";
import { authCookieNames, clearAuthCookies, revokeRefreshToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(authCookieNames.refresh)?.value;

  try {
    await revokeRefreshToken(refreshToken);
  } catch (error) {
    console.error("Error al revocar refresh token:", error);
  }

  const response = NextResponse.json({ data: { loggedOut: true } });
  clearAuthCookies(response);
  return response;
}
