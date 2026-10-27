import { getAuthenticatedUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";

export async function GET(request: Request) {
  // Reading the incoming request makes this endpoint request-time only.
  void request.headers.get("cookie");
  try {
    const user = await getAuthenticatedUser();
    if (!user) return jsonError(401, "UNAUTHENTICATED", "Inicia sesión para continuar.");
    return jsonSuccess({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });
  } catch (error) {
    console.error("Error al consultar la sesión:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "No se pudo consultar la sesión.");
  }
}
