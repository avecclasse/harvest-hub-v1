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
  const progressPercent = Math.min(
    100,
    (confirmedBundles / snapshot.totalCapacity) * 100
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-harvest-earth/20 bg-white p-6">
          <h2 className="text-sm font-medium text-harvest-earth">
            Bundles Funded This Week
          </h2>
          <p className="mt-2 text-3xl font-bold text-harvest-green">
            {confirmedBundles}
          </p>
        </div>
        <div className="rounded-xl border border-harvest-earth/20 bg-white p-6">
          <h2 className="text-sm font-medium text-harvest-earth">
            Households Supported
          </h2>
          <p className="mt-2 text-3xl font-bold text-harvest-green">
            {householdsSupported}
          </p>
        </div>
        <div className="rounded-xl border border-harvest-earth/20 bg-white p-6">
          <h2 className="text-sm font-medium text-harvest-earth">
            Weekly Capacity Progress
          </h2>
          <div className="mt-2">
            <div className="h-4 w-full overflow-hidden rounded-full bg-harvest-earth/20">
              <div
                className="h-full rounded-full bg-harvest-lime transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-harvest-earth">
              {confirmedBundles} / {snapshot.totalCapacity} ({progressPercent.toFixed(0)}%)
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-harvest-earth/20 bg-white p-6">
        <h2 className="font-semibold text-harvest-green">
          Market Capacity Breakdown
        </h2>
        <p className="mt-1 text-sm text-harvest-earth">
          Unlocked Equity seats: {snapshot.unlockedEquitySeats} (base:{" "}
          {snapshot.baseEquitySeats} + {snapshot.stewardCount} from Steward
          participation)
        </p>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="flex h-48 w-48 items-center justify-center rounded-full border-4 border-harvest-lime/50 bg-harvest-lime/20 md:mx-auto">
              <div className="text-center">
                <p className="text-2xl font-bold text-harvest-green">
                  {snapshot.totalCapacity}
                </p>
                <p className="text-sm text-harvest-earth">Total Capacity</p>
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
                  Equity: {snapshot.equityCount} seats ({equityPercent}%)
                </p>
                <p className="text-xs text-harvest-earth">
                  Cap: {snapshot.equityCap} (30% max)
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
                  Anchor: {snapshot.anchorCount} seats ({anchorPercent}%)
                </p>
                <p className="text-xs text-harvest-earth">
                  Cap: {snapshot.anchorCap} (55% max)
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
                  Steward: {snapshot.stewardCountConfirmed} seats (
                  {stewardPercent}%)
                </p>
                <p className="text-xs text-harvest-earth">
                  Cap: {snapshot.stewardCap} (25% max)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
