import { jsonError, type ApiErrorCode } from "@/lib/http";

export class DomainError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function apiErrorFrom(error: unknown, context: string): Response {
  if (error instanceof DomainError) {
    return jsonError(error.status, error.code, error.message);
  }

  if (hasPrismaCode(error, "P2034")) {
    return jsonError(
      409,
      "CONFLICT",
      "La operación coincidió con otra solicitud. Vuelve a intentarlo.",
    );
  }

  console.error(context, error);
  return jsonError(
    500,
    "INTERNAL_SERVER_ERROR",
    "Ocurrió un error inesperado.",
  );
}

export function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
