import { AuctionStatus } from "../../../../../generated/prisma/enums";
import { deriveAuctionStatus } from "@/features/auctions/queries";
import { requireUser } from "@/lib/authorization";
import { apiErrorFrom } from "@/lib/errors";
import { jsonSuccess } from "@/lib/http";
import { prisma } from "@/lib/db";

export async function GET() {
  const authorization = await requireUser();
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const now = new Date();
    const auctions = await prisma.auction.findMany({
      where: { sellerId: authorization.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { bids: true } },
      },
    });

    return jsonSuccess(
      auctions.map((auction) => ({
        id: auction.id,
        title: auction.title,
        initialPrice: auction.initialPrice.toString(),
        minIncrement: auction.minIncrement.toString(),
        closesAt: auction.closesAt.toISOString(),
        status: deriveAuctionStatus(
          auction.status ?? AuctionStatus.ACTIVE,
          auction.closesAt,
          auction._count.bids,
          now,
        ),
        bidCount: auction._count.bids,
        category: auction.category,
      })),
    );
  } catch (error) {
    return apiErrorFrom(error, "Error al listar subastas propias:");
  }
}
