import { AuctionStatus } from "../../../generated/prisma/enums";

export function deriveAuctionStatus(
  storedStatus: AuctionStatus,
  closesAt: Date,
  bidCount: number,
  now = new Date(),
): AuctionStatus {
  if (storedStatus === AuctionStatus.CANCELLED) {
    return AuctionStatus.CANCELLED;
  }

  if (closesAt.getTime() > now.getTime()) {
    return AuctionStatus.ACTIVE;
  }

  return bidCount > 0 ? AuctionStatus.CLOSED : AuctionStatus.DESERTED;
}

export function extendAuctionCloseTime(closesAt: Date, now: Date): Date | null {
  const remaining = closesAt.getTime() - now.getTime();

  return remaining <= 5 * 60 * 1_000 && remaining > 0
    ? new Date(closesAt.getTime() + 5 * 60 * 1_000)
    : null;
}
