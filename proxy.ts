import { jwtVerify, type JWTPayload } from "jose";
import { NextResponse, type NextRequest } from "next/server";

type VerifiedSession = JWTPayload & {
  tokenType: "access" | "refresh";
  role: "USER" | "ADMIN";
};

function secret(environmentName: string): Uint8Array | null {
  const value = process.env[environmentName];

  if (!value || Buffer.byteLength(value) < 32) {
    return null;
  }

  return new TextEncoder().encode(value);
}

async function verifySession(
  token: string | undefined,
  environmentName: string,
  expectedType: VerifiedSession["tokenType"],
): Promise<VerifiedSession | null> {
  const key = secret(environmentName);

  if (!token || !key) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (
      payload.tokenType !== expectedType ||
      (payload.role !== "USER" && payload.role !== "ADMIN")
    ) {
      return null;
    }

    return payload as VerifiedSession;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("bidhub_access")?.value;
  const refreshToken = request.cookies.get("bidhub_refresh")?.value;
  const session =
    (await verifySession(accessToken, "JWT_ACCESS_SECRET", "access")) ??
    (await verifySession(refreshToken, "JWT_REFRESH_SECRET", "refresh"));

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/my-auctions/:path*", "/my-bids/:path*", "/auctions/new", "/auctions/:id/edit"],
};
