import { categorySchema } from "@/features/categories/schemas";
import { requireAdmin } from "@/lib/authorization";
import { apiErrorFrom, hasPrismaCode } from "@/lib/errors";
import { jsonError, jsonSuccess, parseJson } from "@/lib/http";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";

type RouteParameters = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParameters) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return authorization.response;
  }

  const parsed = await parseJson(request, categorySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError(400, "VALIDATION_ERROR", "El identificador de categoría no es válido.");
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name: parsed.data.name, slug: slugify(parsed.data.name) },
    });
    return jsonSuccess(category);
  } catch (error) {
    if (hasPrismaCode(error, "P2025")) {
      return jsonError(404, "NOT_FOUND", "La categoría no existe.");
    }
    if (hasPrismaCode(error, "P2002")) {
      return jsonError(409, "CONFLICT", "Ya existe una categoría con ese nombre.");
    }
    return apiErrorFrom(error, "Error al actualizar categoría:");
  }
}

export async function DELETE(_request: Request, { params }: RouteParameters) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError(400, "VALIDATION_ERROR", "El identificador de categoría no es válido.");
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, _count: { select: { auctions: true } } },
    });

    if (!category) {
      return jsonError(404, "NOT_FOUND", "La categoría no existe.");
    }
    if (category._count.auctions > 0) {
      return jsonError(
        409,
        "CONFLICT",
        "No puedes eliminar una categoría que tiene subastas asociadas.",
      );
    }

    await prisma.category.delete({ where: { id } });
    return jsonSuccess({ deleted: true });
  } catch (error) {
    if (hasPrismaCode(error, "P2003")) {
      return jsonError(
        409,
        "CONFLICT",
        "No puedes eliminar una categoría que tiene subastas asociadas.",
      );
    }
    return apiErrorFrom(error, "Error al eliminar categoría:");
  }
}
