/**
 * Harvest Hub capacity helpers for selected participants.
 * Only seat-holding statuses count toward the 35-bundle capacity.
 */

import {
  holdsSeat,
  TOTAL_CAPACITY,
  SELECTION_TARGETS,
} from "./application-status";

export type Tier = "equity" | "anchor" | "steward";

export const TIER_LABELS: Record<Tier, string> = {
  equity: "Supported",
  anchor: "Standard",
  steward: "Steward",
};

export { TOTAL_CAPACITY, SELECTION_TARGETS };

/** @deprecated Prefer ApplicationStatus from application-status.ts */
export type OrderStatus =
  | "pending_review"
  | "selected"
  | "waitlisted"
  | "declined"
  | "assigned"
  | "ready"
  | "received"
  | "in_queue"
  | "confirmed"
  | "waitlisted_priority"
  | "waitlisted_standard";

export interface MarketConfig {
  marketId: string;
  totalCapacity: number;
  baseEquitySeats: number;
  equityCapPercent: number;
  anchorCapPercent: number;
  stewardCapPercent: number;
}

export interface OrderSnapshot {
  id: string;
  tier: Tier;
  status: string;
  timestamp: number;
  waitlistType?: "priority" | "standard";
}

export interface CapacitySnapshot {
  totalCapacity: number;
  baseEquitySeats: number;
  stewardCount: number;
  unlockedEquitySeats: number;
  equityCap: number;
  anchorCap: number;
  stewardCap: number;
  equityCount: number;
  anchorCount: number;
  stewardCountConfirmed: number;
  /** Selected participants holding seats (selected + assigned + ready + legacy). */
  totalSelected: number;
  /** @deprecated Alias of totalSelected for older call sites */
  totalConfirmed: number;
}

const DEFAULT_EQUITY_CAP = 0.3;
const DEFAULT_ANCHOR_CAP = 0.55;
const DEFAULT_STEWARD_CAP = 0.25;
const DEFAULT_BASE_EQUITY_SEATS = 5;

/**
 * Rule: Every market begins with baseEquitySeats = 5
 * Rule: 1 selected Steward unlocks 1 additional Supported seat
 */
export function calculateUnlockedEquitySeats(
  baseEquitySeats: number,
  stewardReservationCount: number
): number {
  return baseEquitySeats + stewardReservationCount;
}

/**
 * Structural tier caps based on total market capacity (dashboard guidance).
 * Equity ≤ 30%, Anchor ≤ 55%, Steward ≤ 25%
 */
export function calculateTierCaps(
  totalCapacity: number,
  equityCapPercent: number = DEFAULT_EQUITY_CAP,
  anchorCapPercent: number = DEFAULT_ANCHOR_CAP,
  stewardCapPercent: number = DEFAULT_STEWARD_CAP
) {
  return {
    equityCap: Math.floor(totalCapacity * equityCapPercent),
    anchorCap: Math.floor(totalCapacity * anchorCapPercent),
    stewardCap: Math.floor(totalCapacity * stewardCapPercent),
  };
}

/**
 * Counts of applications holding seats by tier.
 * Excludes pending_review, waitlisted, declined.
 */
export function getSelectedCountsByTier(orders: OrderSnapshot[]) {
  const selected = orders.filter((o) => holdsSeat(o.status));
  return {
    equity: selected.filter((o) => o.tier === "equity").length,
    anchor: selected.filter((o) => o.tier === "anchor").length,
    steward: selected.filter((o) => o.tier === "steward").length,
    total: selected.length,
  };
}

/**
 * Full capacity snapshot for a market given its applications/orders.
 * Only seat-holding statuses affect totals.
 */
export function getCapacitySnapshot(
  market: MarketConfig,
  orders: OrderSnapshot[]
): CapacitySnapshot {
  const counts = getSelectedCountsByTier(orders);
  const caps = calculateTierCaps(
    market.totalCapacity,
    market.equityCapPercent,
    market.anchorCapPercent,
    market.stewardCapPercent
  );

  const unlockedEquitySeats = calculateUnlockedEquitySeats(
    market.baseEquitySeats,
    counts.steward
  );

  return {
    totalCapacity: market.totalCapacity,
    baseEquitySeats: market.baseEquitySeats,
    stewardCount: counts.steward,
    unlockedEquitySeats,
    equityCap: caps.equityCap,
    anchorCap: caps.anchorCap,
    stewardCap: caps.stewardCap,
    equityCount: counts.equity,
    anchorCount: counts.anchor,
    stewardCountConfirmed: counts.steward,
    totalSelected: counts.total,
    totalConfirmed: counts.total,
  };
}

/**
 * Create default market config
 */
export function createDefaultMarketConfig(
  marketId: string,
  totalCapacity: number = TOTAL_CAPACITY
): Omit<MarketConfig, "marketId"> & { marketId: string } {
  return {
    marketId,
    totalCapacity,
    baseEquitySeats: DEFAULT_BASE_EQUITY_SEATS,
    equityCapPercent: DEFAULT_EQUITY_CAP,
    anchorCapPercent: DEFAULT_ANCHOR_CAP,
    stewardCapPercent: DEFAULT_STEWARD_CAP,
  };
}

export const CURRENT_MARKET_ID = "market-current";
