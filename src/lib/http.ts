import type { ZodType } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR";

export function jsonSuccess<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): Response {
  return Response.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status },
  );
}

export type ParsedJson<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<ParsedJson<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: jsonError(400, "VALIDATION_ERROR", "El cuerpo debe ser JSON válido."),
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      ok: false,
      response: jsonError(
        400,
        "VALIDATION_ERROR",
        "Revisa los campos enviados.",
        result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      ),
    };
  }

  return { ok: true, data: result.data };
}
