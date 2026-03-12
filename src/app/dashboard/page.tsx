"use client";

import { db } from "@/lib/db";
import {
  getCapacitySnapshot,
  createDefaultMarketConfig,
  type OrderSnapshot,
} from "@/lib/capacity";

const CURRENT_MARKET_ID = "market-current";
const DEFAULT_TOTAL_CAPACITY = 50;

export default function DashboardPage() {
  const { data, isLoading, error } = db.useQuery({
    markets: { $: { where: { marketId: CURRENT_MARKET_ID } } },
    orders: { $: { where: { marketId: CURRENT_MARKET_ID } } },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-harvest-green border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        Error loading dashboard: {error.message}
      </div>
    );
  }

  const market = data?.markets?.[0];
  const ordersData = data?.orders ?? [];

  const marketConfig = market
    ? {
        marketId: market.marketId,
        totalCapacity: market.totalCapacity,
        baseEquitySeats: market.baseEquitySeats,
        equityCapPercent: market.equityCapPercent,
        anchorCapPercent: market.anchorCapPercent,
        stewardCapPercent: market.stewardCapPercent,
      }
    : createDefaultMarketConfig(CURRENT_MARKET_ID, DEFAULT_TOTAL_CAPACITY);

  const orderSnapshots: OrderSnapshot[] = ordersData.map((o) => ({
    id: o.id,
    tier: o.tier as OrderSnapshot["tier"],
    status: o.status as OrderSnapshot["status"],
    timestamp:
      typeof o.timestamp === "number"
        ? o.timestamp
        : new Date(o.timestamp as string).getTime(),
    waitlistType: o.waitlistType as "priority" | "standard" | undefined,
  }));

  const snapshot = getCapacitySnapshot(marketConfig, orderSnapshots);

  const confirmedBundles = snapshot.totalConfirmed;
  const householdsSupported =
    snapshot.equityCount + snapshot.anchorCount + snapshot.stewardCountConfirmed;
  const stewardBundlesPurchased = snapshot.stewardCountConfirmed;
  const equityBundlesUnlocked = snapshot.unlockedEquitySeats;
  const progressPercent = Math.min(
    100,
    (confirmedBundles / snapshot.totalCapacity) * 100
  );
  const weeklyBundlesRemaining = Math.max(
    0,
    snapshot.totalCapacity - confirmedBundles
  );

  const equityPercent =
    snapshot.totalCapacity > 0
      ? ((snapshot.equityCount / snapshot.totalCapacity) * 100).toFixed(1)
      : "0";
  const anchorPercent =
    snapshot.totalCapacity > 0
      ? ((snapshot.anchorCount / snapshot.totalCapacity) * 100).toFixed(1)
      : "0";
  const stewardPercent =
    snapshot.totalCapacity > 0
      ? ((snapshot.stewardCountConfirmed / snapshot.totalCapacity) * 100).toFixed(
          1
        )
      : "0";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-harvest-green">
        Community Capacity Pool
      </h1>
      <p className="text-sm text-harvest-earth">
        Every Steward bundle purchased helps unlock additional Equity access for
        a neighbor facing financial barriers.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 rounded-xl border border-harvest-earth/20 bg-white p-6">
              <h2 className="text-sm font-medium text-harvest-earth">
                Steward Bundles Purchased
              </h2>
              <p className="mt-2 text-3xl font-bold text-harvest-green">
                {stewardBundlesPurchased}
              </p>
            </div>
            <div className="flex flex-col items-center text-xs text-harvest-green text-center max-w-[200px]">
              <span className="text-base">➜</span>
              <span>
                Steward participation this week unlocked additional Equity
                access.
              </span>
            </div>
            <div className="flex-1 rounded-xl border border-harvest-earth/20 bg-white p-6">
              <h2 className="text-sm font-medium text-harvest-earth">
                Equity Bundles Unlocked
              </h2>
              <p className="mt-2 text-3xl font-bold text-harvest-green">
                {equityBundlesUnlocked}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-harvest-earth/20 bg-white p-6">
          <h2 className="text-sm font-medium text-harvest-earth">
            Market Bundles Reserved
          </h2>
          <div className="mt-2">
            <div className="h-4 w-full overflow-hidden rounded-full bg-harvest-earth/20">
              <div
                className="h-full rounded-full bg-harvest-lime transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-harvest-earth">
              {confirmedBundles} of {snapshot.totalCapacity} market bundles reserved
            </p>
            <p className="text-xs text-harvest-earth">
              {weeklyBundlesRemaining} bundles remaining
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-harvest-earth/20 bg-white p-6">
        <h2 className="font-semibold text-harvest-green">
          Market Bundle Breakdown
        </h2>
        <p className="mt-1 text-sm text-harvest-earth">
          This market, {snapshot.unlockedEquitySeats} Equity bundles are
          available: {snapshot.baseEquitySeats} base + {snapshot.stewardCount}{" "}
          unlocked through Steward participation.
        </p>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="flex h-48 w-48 items-center justify-center rounded-full border-4 border-harvest-lime/50 bg-harvest-lime/20 md:mx-auto">
              <div className="text-center">
                <p className="text-2xl font-bold text-harvest-green">
                  {snapshot.totalCapacity}
                </p>
                <p className="text-sm text-harvest-earth">
                  Market bundle limit
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: "#7cb342" }}
              />
              <div>
                <p className="font-medium text-harvest-green">
                  Equity: {snapshot.equityCount} bundles ({equityPercent}%)
                </p>
                <p className="text-xs text-harvest-earth">
                  Up to {snapshot.equityCap} bundles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: "#2d5a27" }}
              />
              <div>
                <p className="font-medium text-harvest-green">
                  Anchor: {snapshot.anchorCount} bundles ({anchorPercent}%)
                </p>
                <p className="text-xs text-harvest-earth">
                  Up to {snapshot.anchorCap} bundles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: "#8d6e63" }}
              />
              <div>
                <p className="font-medium text-harvest-green">
                  Steward: {snapshot.stewardCountConfirmed} bundles (
                  {stewardPercent}%)
                </p>
                <p className="text-xs text-harvest-earth">
                  Up to {snapshot.stewardCap} bundles
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 text-xs text-harvest-earth md:grid-cols-3">
          <div>
            <p className="font-medium text-harvest-green">Equity</p>
            <p>Reduced-cost access for neighbors facing financial barriers.</p>
          </div>
          <div>
            <p className="font-medium text-harvest-green">Anchor</p>
            <p>Standard participation at regular bundle price.</p>
          </div>
          <div>
            <p className="font-medium text-harvest-green">Steward</p>
            <p>Participation that helps unlock additional Equity access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
