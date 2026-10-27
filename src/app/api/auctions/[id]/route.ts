import { z } from "zod";
import { updateAuctionSchema } from "@/features/auctions/schemas";
import { getAuctionDetail } from "@/features/auctions/queries";
import {
  cancelAuctionBySeller,
  updateAuction,
} from "@/features/auctions/service";
import { requireUser } from "@/lib/authorization";
import { apiErrorFrom } from "@/lib/errors";
import { jsonError, jsonSuccess, parseJson } from "@/lib/http";

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
    return jsonSuccess(auction);
  } catch (error) {
    return apiErrorFrom(error, "Error al consultar subasta:");
  }
}

export async function PATCH(request: Request, { params }: RouteParameters) {
  const authorization = await requireUser();
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError(400, "VALIDATION_ERROR", "El identificador de subasta no es válido.");
  }

  const parsed = await parseJson(request, updateAuctionSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const auction = await updateAuction(id, authorization.user.id, parsed.data);
    return jsonSuccess(auction);
  } catch (error) {
    return apiErrorFrom(error, "Error al editar subasta:");
  }
}

export async function DELETE(_request: Request, { params }: RouteParameters) {
  const authorization = await requireUser();
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError(400, "VALIDATION_ERROR", "El identificador de subasta no es válido.");
  }

  try {
    const auction = await cancelAuctionBySeller(id, authorization.user.id);
    return jsonSuccess(auction);
  } catch (error) {
    return apiErrorFrom(error, "Error al cancelar subasta:");
  }
}
