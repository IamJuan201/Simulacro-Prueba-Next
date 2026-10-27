import { AuctionStatus } from "../../../../generated/prisma/enums";
import { createAuctionSchema } from "@/features/auctions/schemas";
import { createAuction } from "@/features/auctions/service";
import { listAuctions } from "@/features/auctions/queries";
import { requireUser } from "@/lib/authorization";
import { apiErrorFrom } from "@/lib/errors";
import { jsonError, jsonSuccess, parseJson } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const statusValue = url.searchParams.get("status") ?? undefined;
  const status = Object.values(AuctionStatus).find((value) => value === statusValue);

  if (statusValue && !status) {
    return jsonError(400, "VALIDATION_ERROR", "El estado de subasta no es válido.");
  }

  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const search = url.searchParams.get("q")?.trim() || undefined;
  const pageValue = Number(url.searchParams.get("page") ?? 1);

  if (!Number.isInteger(pageValue) || pageValue < 1 || pageValue > 10_000) {
    return jsonError(400, "VALIDATION_ERROR", "El número de página no es válido.");
  }
  if (search && search.length > 120) {
    return jsonError(400, "VALIDATION_ERROR", "La búsqueda no puede superar 120 caracteres.");
  }

  if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)) {
    return jsonError(400, "VALIDATION_ERROR", "La categoría no es válida.");
  }

  try {
    const data = await listAuctions({ categoryId, status, search, page: pageValue });
    return jsonSuccess(data);
  } catch (error) {
    return apiErrorFrom(error, "Error al listar subastas:");
  }
}

export async function POST(request: Request) {
  const authorization = await requireUser();
  if (!authorization.ok) {
    return authorization.response;
  }

  const parsed = await parseJson(request, createAuctionSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const auction = await createAuction(parsed.data, authorization.user.id);
    return jsonSuccess(auction, 201);
  } catch (error) {
    return apiErrorFrom(error, "Error al publicar subasta:");
  }
}
