import { AuctionStatus } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { deriveAuctionStatus } from "@/features/auctions/queries";
import { extendAuctionCloseTime } from "@/features/auctions/domain";
import type {
  CreateAuctionInput,
  UpdateAuctionInput,
  BidInput,
} from "@/features/auctions/schemas";

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;

function validateCloseDate(closesAt: Date, now: Date): void {
  const minimum = now.getTime() + HOUR_MS;
  const maximum = now.getTime() + 7 * DAY_MS;

  if (closesAt.getTime() < minimum || closesAt.getTime() > maximum) {
    throw new DomainError(
      400,
      "VALIDATION_ERROR",
      "La subasta debe cerrar entre 1 hora y 7 días desde ahora.",
    );
  }
}

async function lockAuction(
  transaction: Prisma.TransactionClient,
  auctionId: string,
): Promise<void> {
  await transaction.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Auction" WHERE "id" = ${auctionId}::uuid FOR UPDATE
  `;
}

export async function createAuction(
  input: CreateAuctionInput,
  sellerId: string,
) {
  const now = new Date();
  const closesAt = new Date(input.closesAt);
  validateCloseDate(closesAt, now);

  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "User" WHERE "id" = ${sellerId}::uuid FOR UPDATE
    `;

    const category = await transaction.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new DomainError(404, "NOT_FOUND", "La categoría no existe.");
    }

    const activeAuctions = await transaction.auction.count({
      where: {
        sellerId,
        status: AuctionStatus.ACTIVE,
        closesAt: { gt: now },
      },
    });

    if (activeAuctions >= 5) {
      throw new DomainError(
        409,
        "CONFLICT",
        "Ya tienes el máximo de 5 subastas activas.",
      );
    }

    return transaction.auction.create({
      data: {
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        initialPrice: new Prisma.Decimal(input.initialPrice),
        minIncrement: new Prisma.Decimal(input.minIncrement),
        closesAt,
        sellerId,
        categoryId: input.categoryId,
      },
    });
  }, { isolationLevel: "Serializable" });
}

export async function updateAuction(
  auctionId: string,
  sellerId: string,
  input: UpdateAuctionInput,
) {
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    await lockAuction(transaction, auctionId);
    const auction = await transaction.auction.findUnique({
      where: { id: auctionId },
      include: { _count: { select: { bids: true } } },
    });

    if (!auction) {
      throw new DomainError(404, "NOT_FOUND", "La subasta no existe.");
    }
    if (auction.sellerId !== sellerId) {
      throw new DomainError(403, "FORBIDDEN", "No puedes editar una subasta ajena.");
    }
    if (deriveAuctionStatus(auction.status, auction.closesAt, auction._count.bids, now) !== AuctionStatus.ACTIVE) {
      throw new DomainError(409, "CONFLICT", "Solo puedes editar una subasta activa.");
    }
    if (auction._count.bids > 0) {
      throw new DomainError(409, "CONFLICT", "No puedes editar una subasta que ya tiene ofertas.");
    }

    if (input.closesAt) {
      validateCloseDate(new Date(input.closesAt), now);
    }
    if (input.categoryId) {
      const category = await transaction.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new DomainError(404, "NOT_FOUND", "La categoría no existe.");
      }
    }

    return transaction.auction.update({
      where: { id: auctionId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.initialPrice !== undefined
          ? { initialPrice: new Prisma.Decimal(input.initialPrice) }
          : {}),
        ...(input.minIncrement !== undefined
          ? { minIncrement: new Prisma.Decimal(input.minIncrement) }
          : {}),
        ...(input.closesAt !== undefined ? { closesAt: new Date(input.closesAt) } : {}),
        ...(input.categoryId !== undefined
          ? { category: { connect: { id: input.categoryId } } }
          : {}),
      },
    });
  }, { isolationLevel: "Serializable" });
}

export async function cancelAuctionBySeller(auctionId: string, sellerId: string) {
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    await lockAuction(transaction, auctionId);
    const auction = await transaction.auction.findUnique({
      where: { id: auctionId },
      include: { _count: { select: { bids: true } } },
    });

    if (!auction) {
      throw new DomainError(404, "NOT_FOUND", "La subasta no existe.");
    }
    if (auction.sellerId !== sellerId) {
      throw new DomainError(403, "FORBIDDEN", "No puedes cancelar una subasta ajena.");
    }
    if (deriveAuctionStatus(auction.status, auction.closesAt, auction._count.bids, now) !== AuctionStatus.ACTIVE) {
      throw new DomainError(409, "CONFLICT", "Solo puedes cancelar una subasta activa.");
    }
    if (auction._count.bids > 0) {
      throw new DomainError(409, "CONFLICT", "No puedes cancelar una subasta con ofertas.");
    }

    return transaction.auction.update({
      where: { id: auctionId },
      data: {
        status: AuctionStatus.CANCELLED,
        cancelledById: sellerId,
        cancellationReason: "Cancelada por el vendedor antes de recibir ofertas.",
      },
    });
  }, { isolationLevel: "Serializable" });
}

export async function cancelAuctionAsAdmin(
  auctionId: string,
  adminId: string,
  reason: string,
) {
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    await lockAuction(transaction, auctionId);
    const auction = await transaction.auction.findUnique({
      where: { id: auctionId },
      include: { _count: { select: { bids: true } } },
    });

    if (!auction) {
      throw new DomainError(404, "NOT_FOUND", "La subasta no existe.");
    }
    if (deriveAuctionStatus(auction.status, auction.closesAt, auction._count.bids, now) !== AuctionStatus.ACTIVE) {
      throw new DomainError(409, "CONFLICT", "Solo se pueden moderar subastas activas.");
    }

    return transaction.auction.update({
      where: { id: auctionId },
      data: {
        status: AuctionStatus.CANCELLED,
        cancelledById: adminId,
        cancellationReason: reason,
      },
    });
  }, { isolationLevel: "Serializable" });
}

export async function placeBid(
  auctionId: string,
  bidderId: string,
  input: BidInput,
  idempotencyKey: string,
) {
  const existingBid = await prisma.bid.findUnique({
    where: { idempotencyKey },
  });

  if (existingBid) {
    if (existingBid.auctionId !== auctionId || existingBid.bidderId !== bidderId) {
      throw new DomainError(409, "CONFLICT", "La clave de idempotencia ya fue utilizada.");
    }
    return { bid: existingBid, replayed: true };
  }

  return prisma.$transaction(async (transaction) => {
    await lockAuction(transaction, auctionId);
    const replay = await transaction.bid.findUnique({
      where: { idempotencyKey },
    });
    if (replay) {
      if (replay.auctionId !== auctionId || replay.bidderId !== bidderId) {
        throw new DomainError(409, "CONFLICT", "La clave de idempotencia ya fue utilizada.");
      }
      return { bid: replay, replayed: true };
    }

    const now = new Date();
    const auction = await transaction.auction.findUnique({
      where: { id: auctionId },
      include: { _count: { select: { bids: true } } },
    });

    if (!auction) {
      throw new DomainError(404, "NOT_FOUND", "La subasta no existe.");
    }
    if (auction.sellerId === bidderId) {
      throw new DomainError(403, "FORBIDDEN", "No puedes ofertar en tu propia subasta.");
    }
    if (deriveAuctionStatus(auction.status, auction.closesAt, auction._count.bids, now) !== AuctionStatus.ACTIVE) {
      throw new DomainError(409, "CONFLICT", "La subasta ya no está activa.");
    }

    const highestBid = await transaction.bid.findFirst({
      where: { auctionId },
      orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
    });

    if (highestBid?.bidderId === bidderId) {
      throw new DomainError(409, "CONFLICT", "Ya tienes la oferta más alta.");
    }

    const requiredAmount = highestBid
      ? highestBid.amount.add(auction.minIncrement)
      : auction.initialPrice;
    const amount = new Prisma.Decimal(input.amount);

    if (amount.lessThan(requiredAmount)) {
      throw new DomainError(
        409,
        "CONFLICT",
        `La oferta mínima es ${requiredAmount.toFixed(2)}.`,
      );
    }

    const bid = await transaction.bid.create({
      data: { auctionId, bidderId, amount, idempotencyKey },
    });
    const extendedCloseTime = extendAuctionCloseTime(auction.closesAt, now);

    if (extendedCloseTime) {
      await transaction.auction.update({
        where: { id: auctionId },
        data: { closesAt: extendedCloseTime },
      });
    }

    return { bid, replayed: false, extended: extendedCloseTime !== null };
  }, { isolationLevel: "Serializable", maxWait: 5_000, timeout: 10_000 });
}
