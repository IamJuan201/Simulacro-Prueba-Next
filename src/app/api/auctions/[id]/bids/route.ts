import { z } from "zod";
import { bidSchema } from "@/features/auctions/schemas";
import { getAuctionDetail } from "@/features/auctions/queries";
import { placeBid } from "@/features/auctions/service";
import { requireUser } from "@/lib/authorization";
import { apiErrorFrom } from "@/lib/errors";
import { jsonError, jsonSuccess, parseJson } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";

type RouteParameters = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParameters) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError(400, "VALIDATION_ERROR", "El identificador de subasta no es válido.");
  }

  try {
    const auction = await getAuctionDetail(id);
    if (!auction) {
      return jsonError(404, "NOT_FOUND", "La subasta no existe.");
    }
    return jsonSuccess(auction.bidHistory);
  } catch (error) {
    return apiErrorFrom(error, "Error al consultar historial de ofertas:");
  }
}

export async function POST(request: Request, { params }: RouteParameters) {
  const authorization = await requireUser();
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError(400, "VALIDATION_ERROR", "El identificador de subasta no es válido.");
  }

  const parsed = await parseJson(request, bidSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Envía una clave Idempotency-Key única para esta oferta.",
    );
  }

  try {
    const limit = await consumeRateLimit(
      "bid-user",
      authorization.user.id,
      30,
      10 * 60,
    );
    if (!limit.allowed) {
      const response = jsonError(
        429,
        "RATE_LIMITED",
        "Alcanzaste el límite temporal de ofertas. Inténtalo más tarde.",
      );
      response.headers.set("Retry-After", String(limit.retryAfterSeconds));
      return response;
    }

    const result = await placeBid(
      id,
      authorization.user.id,
      parsed.data,
      idempotencyKey,
    );
    return jsonSuccess(
      {
        id: result.bid.id,
        amount: result.bid.amount.toString(),
        createdAt: result.bid.createdAt.toISOString(),
        replayed: result.replayed,
        extended: "extended" in result ? result.extended : false,
      },
      result.replayed ? 200 : 201,
    );
  } catch (error) {
    return apiErrorFrom(error, "Error al crear oferta:");
  }
}
