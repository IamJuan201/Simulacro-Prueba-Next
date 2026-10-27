import { getAuthenticatedUser, type AuthenticatedUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";

export type AuthorizationResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: Response };

export async function requireUser(): Promise<AuthorizationResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      ok: false,
      response: jsonError(401, "UNAUTHENTICATED", "Inicia sesión para continuar."),
    };
  }

  return { ok: true, user };
}

export async function requireAdmin(): Promise<AuthorizationResult> {
  const result = await requireUser();

  if (!result.ok) {
    return result;
  }

  if (result.user.role !== "ADMIN") {
    return {
      ok: false,
      response: jsonError(403, "FORBIDDEN", "Esta acción requiere permisos de administrador."),
    };
  }

  return result;
}
