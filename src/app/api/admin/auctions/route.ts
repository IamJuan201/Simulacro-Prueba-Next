import { AuctionStatus } from "../../../../../generated/prisma/enums";
import { listAuctions } from "@/features/auctions/queries";
import { requireAdmin } from "@/lib/authorization";
import { apiErrorFrom } from "@/lib/errors";
import { jsonError, jsonSuccess } from "@/lib/http";

export async function GET(request: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return authorization.response;
  }

  const url = new URL(request.url);
  const statusValue = url.searchParams.get("status") ?? undefined;
  const status = Object.values(AuctionStatus).find((value) => value === statusValue);

  if (statusValue && !status) {
    return jsonError(400, "VALIDATION_ERROR", "El estado de subasta no es válido.");
  }

  try {
    const data = await listAuctions({
      status,
      search: url.searchParams.get("q")?.trim() || undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: 24,
    });
    return jsonSuccess(data);
  } catch (error) {
    return apiErrorFrom(error, "Error al listar subastas para moderación:");
  }
}
