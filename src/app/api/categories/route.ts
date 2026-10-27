import { categorySchema } from "@/features/categories/schemas";
import { requireAdmin } from "@/lib/authorization";
import { apiErrorFrom, hasPrismaCode } from "@/lib/errors";
import { parseJson, jsonError, jsonSuccess } from "@/lib/http";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return jsonSuccess(categories);
  } catch (error) {
    console.error("Error al listar categorías:", error);

    return jsonError(
      500,
      "INTERNAL_SERVER_ERROR",
      "No se pudieron cargar las categorías.",
    );
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return authorization.response;
  }

  const parsed = await parseJson(request, categorySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
      },
    });
    return jsonSuccess(category, 201);
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) {
      return jsonError(409, "CONFLICT", "Ya existe una categoría con ese nombre.");
    }
    return apiErrorFrom(error, "Error al crear categoría:");
  }
}
