import { requireUser } from "@/lib/authorization";
import { deriveAuctionStatus } from "@/features/auctions/domain";
import { apiErrorFrom } from "@/lib/errors";
import { jsonSuccess } from "@/lib/http";
import { prisma } from "@/lib/db";

export async function GET() {
  const authorization = await requireUser();
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const bids = await prisma.bid.findMany({
      where: { bidderId: authorization.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        auction: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            closesAt: true,
            status: true,
            _count: { select: { bids: true } },
          },
        },
      },
    });

    return jsonSuccess(
      bids.map((bid) => ({
        id: bid.id,
        amount: bid.amount.toString(),
        createdAt: bid.createdAt.toISOString(),
        auction: {
          id: bid.auction.id,
          title: bid.auction.title,
          imageUrl: bid.auction.imageUrl,
          closesAt: bid.auction.closesAt.toISOString(),
          status: deriveAuctionStatus(
            bid.auction.status,
            bid.auction.closesAt,
            bid.auction._count.bids,
          ),
        },
      })),
    );
  } catch (error) {
    return apiErrorFrom(error, "Error al listar ofertas propias:");
  }
}
