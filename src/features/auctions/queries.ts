import { AuctionStatus } from "../../../generated/prisma/enums";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/db";
import { deriveAuctionStatus } from "@/features/auctions/domain";

export { deriveAuctionStatus } from "@/features/auctions/domain";

export type AuctionFilters = {
  categoryId?: string;
  status?: AuctionStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};

function statusFilter(status: AuctionStatus | undefined, now: Date): Prisma.AuctionWhereInput {
  switch (status) {
    case AuctionStatus.ACTIVE:
      return { status: { not: AuctionStatus.CANCELLED }, closesAt: { gt: now } };
    case AuctionStatus.CLOSED:
      return {
        status: { not: AuctionStatus.CANCELLED },
        closesAt: { lte: now },
        bids: { some: {} },
      };
    case AuctionStatus.DESERTED:
      return {
        status: { not: AuctionStatus.CANCELLED },
        closesAt: { lte: now },
        bids: { none: {} },
      };
    case AuctionStatus.CANCELLED:
      return { status: AuctionStatus.CANCELLED };
    default:
      return {};
  }
}

export async function listAuctions(filters: AuctionFilters = {}) {
  const now = new Date();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
  const where: Prisma.AuctionWhereInput = {
    ...statusFilter(filters.status, now),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [auctions, total] = await Promise.all([
    prisma.auction.findMany({
      where,
      orderBy: [{ closesAt: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        initialPrice: true,
        minIncrement: true,
        closesAt: true,
        status: true,
        seller: { select: { fullName: true } },
        category: { select: { id: true, name: true, slug: true } },
        bids: {
          orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
          take: 1,
          select: { amount: true },
        },
        _count: { select: { bids: true } },
      },
    }),
    prisma.auction.count({ where }),
  ]);

  return {
    items: auctions.map((auction) => ({
      id: auction.id,
      title: auction.title,
      description: auction.description,
      imageUrl: auction.imageUrl,
      initialPrice: auction.initialPrice.toString(),
      minIncrement: auction.minIncrement.toString(),
      closesAt: auction.closesAt.toISOString(),
      status: deriveAuctionStatus(auction.status, auction.closesAt, auction._count.bids, now),
      sellerName: auction.seller.fullName,
      category: auction.category,
      currentPrice: (auction.bids[0]?.amount ?? auction.initialPrice).toString(),
      bidCount: auction._count.bids,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function maskBidder(fullName: string): string {
  const initial = Array.from(fullName.trim())[0] ?? "U";
  return `${initial}***`;
}

export async function getAuctionDetail(id: string) {
  const auction = await prisma.auction.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      initialPrice: true,
      minIncrement: true,
      closesAt: true,
      status: true,
      cancellationReason: true,
      sellerId: true,
      seller: { select: { fullName: true } },
      category: { select: { id: true, name: true, slug: true } },
      bids: {
        orderBy: [{ createdAt: "desc" }, { amount: "desc" }],
        select: {
          amount: true,
          createdAt: true,
          bidder: { select: { fullName: true } },
        },
      },
    },
  });

  if (!auction) {
    return null;
  }

  const highestBid = [...auction.bids].sort((first, second) =>
    second.amount.comparedTo(first.amount),
  )[0];
  const status = deriveAuctionStatus(auction.status, auction.closesAt, auction.bids.length);

  return {
    id: auction.id,
    title: auction.title,
    description: auction.description,
    imageUrl: auction.imageUrl,
    initialPrice: auction.initialPrice.toString(),
    minIncrement: auction.minIncrement.toString(),
    closesAt: auction.closesAt.toISOString(),
    status,
    cancellationReason: auction.cancellationReason,
    sellerId: auction.sellerId,
    sellerName: auction.seller.fullName,
    category: auction.category,
    currentPrice: (highestBid?.amount ?? auction.initialPrice).toString(),
    winnerAlias:
      status === AuctionStatus.CLOSED && highestBid
        ? maskBidder(highestBid.bidder.fullName)
        : null,
    bidHistory: auction.bids.map((bid) => ({
      amount: bid.amount.toString(),
      createdAt: bid.createdAt.toISOString(),
      bidderAlias: maskBidder(bid.bidder.fullName),
    })),
  };
}
