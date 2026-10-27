import { NextResponse } from "next/server";
import { registerSchema } from "@/features/auth/schemas";
import { jsonError, parseJson } from "@/lib/http";
import { issueAuthTokens, setAuthCookies } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const parsed = await parseJson(request, registerSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const user = await prisma.user.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
      },
      select: { id: true, email: true, fullName: true, role: true },
    });
    const tokens = await issueAuthTokens(user);
    const response = NextResponse.json({ data: { user } }, { status: 201 });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return jsonError(409, "CONFLICT", "Ya existe una cuenta con ese correo.");
    }

    console.error("Error al registrar usuario:", error);
    return jsonError(
      500,
      "INTERNAL_SERVER_ERROR",
      "No se pudo completar el registro.",
    );
  }
}
