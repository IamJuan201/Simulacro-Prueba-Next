import { prisma } from "@/lib/db";

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

    return Response.json({ data: categories });
  } catch (error) {
    console.error("Error al listar categorías:", error);

    return Response.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "No se pudieron cargar las categorías.",
        },
      },
      { status: 500 },
    );
  }
}