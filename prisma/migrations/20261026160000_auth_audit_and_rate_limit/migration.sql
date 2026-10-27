-- Add audit information for auction cancellations.
ALTER TABLE "Auction" ADD COLUMN "cancelledById" UUID;

ALTER TABLE "Auction"
ADD CONSTRAINT "Auction_cancelledById_fkey"
FOREIGN KEY ("cancelledById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Auction_cancelledById_idx" ON "Auction"("cancelledById");

-- Persist rate-limit windows across application instances.
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "windowStartedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_windowStartedAt_idx"
ON "RateLimitBucket"("windowStartedAt");

-- The app connects to Postgres server-side through Prisma. No public Supabase
-- Data API policies are required for this app; deny direct table access there.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Auction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bid" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;
