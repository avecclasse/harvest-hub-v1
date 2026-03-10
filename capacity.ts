/**
 * Harvest Hub Capacity Rules - Deterministic implementation
 * These rules govern seat availability, tier caps, and waitlist logic.
 */

export type Tier = "equity" | "anchor" | "steward";

export type OrderStatus =
  | "received"
  | "in_queue"
  | "confirmed"
  | "waitlisted_priority"
  | "waitlisted_standard"
  | "assigned"
  | "ready";

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
  status: OrderStatus;
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
  totalConfirmed: number;
}

const DEFAULT_EQUITY_CAP = 0.3;
const DEFAULT_ANCHOR_CAP = 0.55;
const DEFAULT_STEWARD_CAP = 0.25;
const DEFAULT_BASE_EQUITY_SEATS = 5;

/**
 * Rule 1: Every market begins with baseEquitySeats = 5
 * Rule 2: 1 Steward reservation unlocks 1 additional Equity seat
 * Example: 5 base + 3 Steward = 8 available Equity seats
 */
export function calculateUnlockedEquitySeats(
  baseEquitySeats: number,
  stewardReservationCount: number
): number {
  return baseEquitySeats + stewardReservationCount;
}

/**
 * Calculate structural tier caps based on total market capacity
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

const SEAT_HOLDING_STATUSES: OrderStatus[] = [
  "received",
  "in_queue",
  "confirmed",
  "assigned",
  "ready",
];

/**
 * Get counts of orders holding seats by tier (excludes waitlisted)
 */
function getConfirmedCountsByTier(orders: OrderSnapshot[]) {
  const confirmed = orders.filter((o) =>
    SEAT_HOLDING_STATUSES.includes(o.status)
  );
  return {
    equity: confirmed.filter((o) => o.tier === "equity").length,
    anchor: confirmed.filter((o) => o.tier === "anchor").length,
    steward: confirmed.filter((o) => o.tier === "steward").length,
    total: confirmed.length,
  };
}

/**
 * Full capacity snapshot for a market given its orders
 */
export function getCapacitySnapshot(
  market: MarketConfig,
  orders: OrderSnapshot[]
): CapacitySnapshot {
  const counts = getConfirmedCountsByTier(orders);
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
    totalConfirmed: counts.total,
  };
}

/**
 * Determine reservation outcome: confirmed, waitlisted_priority, or waitlisted_standard
 * Implements:
 * - Tier cap enforcement
 * - Unlocked Equity seats
 * - Priority waitlist when Equity seats full
 * - Standard waitlist when total market full
 */
export function determineReservationOutcome(
  tier: Tier,
  snapshot: CapacitySnapshot
): { status: OrderStatus; waitlistType?: "priority" | "standard" } {
  // Check if total market is full
  if (snapshot.totalConfirmed >= snapshot.totalCapacity) {
    return { status: "waitlisted_standard", waitlistType: "standard" };
  }

  // Check tier-specific caps
  if (tier === "equity") {
    const equityAvailable = Math.min(
      snapshot.unlockedEquitySeats,
      snapshot.equityCap
    );
    if (snapshot.equityCount >= equityAvailable) {
      return { status: "waitlisted_priority", waitlistType: "priority" };
    }
  }

  if (tier === "anchor") {
    if (snapshot.anchorCount >= snapshot.anchorCap) {
      return { status: "waitlisted_standard", waitlistType: "standard" };
    }
  }

  if (tier === "steward") {
    if (snapshot.stewardCountConfirmed >= snapshot.stewardCap) {
      return { status: "waitlisted_standard", waitlistType: "standard" };
    }
  }

  return { status: "confirmed" };
}

/**
 * Get priority waitlisted Equity orders sorted FIFO by timestamp
 * Used when promoting users after new Steward reservations unlock Equity seats
 */
export function getPriorityWaitlistFIFO(
  orders: OrderSnapshot[]
): OrderSnapshot[] {
  return orders
    .filter(
      (o) =>
        o.tier === "equity" &&
        o.status === "waitlisted_priority" &&
        o.waitlistType === "priority"
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get standard waitlisted orders sorted FIFO by timestamp
 */
export function getStandardWaitlistFIFO(
  orders: OrderSnapshot[]
): OrderSnapshot[] {
  return orders
    .filter(
      (o) =>
        o.status === "waitlisted_standard" && o.waitlistType === "standard"
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Create default market config
 */
export function createDefaultMarketConfig(
  marketId: string,
  totalCapacity: number
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
