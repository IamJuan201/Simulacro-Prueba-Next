import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuctionStatus } from "../../../generated/prisma/enums";
import { deriveAuctionStatus, extendAuctionCloseTime } from "@/features/auctions/domain";

const now = new Date("2026-10-26T12:00:00.000Z");

describe("auction business rules", () => {
  it("keeps a future auction active", () => {
    assert.equal(
      deriveAuctionStatus(AuctionStatus.ACTIVE, new Date(now.getTime() + 60_000), 0, now),
      AuctionStatus.ACTIVE,
    );
  });

  it("closes an ended auction when it has offers", () => {
    assert.equal(
      deriveAuctionStatus(AuctionStatus.ACTIVE, new Date(now.getTime() - 1), 1, now),
      AuctionStatus.CLOSED,
    );
  });

  it("marks an ended auction without offers as deserted", () => {
    assert.equal(
      deriveAuctionStatus(AuctionStatus.ACTIVE, new Date(now.getTime() - 1), 0, now),
      AuctionStatus.DESERTED,
    );
  });

  it("keeps cancelled auctions cancelled regardless of their close date", () => {
    assert.equal(
      deriveAuctionStatus(AuctionStatus.CANCELLED, new Date(now.getTime() + 60_000), 0, now),
      AuctionStatus.CANCELLED,
    );
  });

  it("adds five minutes when an offer lands inside the anti-sniping window", () => {
    const closesAt = new Date(now.getTime() + 5 * 60_000);
    assert.equal(
      extendAuctionCloseTime(closesAt, now)?.getTime(),
      closesAt.getTime() + 5 * 60_000,
    );
  });
});
