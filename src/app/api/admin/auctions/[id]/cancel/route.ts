import { z } from "zod";
import { cancellationSchema } from "@/features/auctions/schemas";
import { cancelAuctionAsAdmin } from "@/features/auctions/service";
import { requireAdmin } from "@/lib/authorization";
import { apiErrorFrom } from "@/lib/errors";
import { jsonError, jsonSuccess, parseJson } from "@/lib/http";

type RouteParameters = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParameters) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError(400, "VALIDATION_ERROR", "El identificador de subasta no es válido.");
  }

  const parsed = await parseJson(request, cancellationSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const auction = await cancelAuctionAsAdmin(
      id,
      authorization.user.id,
      parsed.data.reason,
    );
    return jsonSuccess(auction);
  } catch (error) {
    return apiErrorFrom(error, "Error al moderar subasta:");
  }
}
