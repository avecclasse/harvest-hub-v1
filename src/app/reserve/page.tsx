"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import {
  type Tier,
  TIER_LABELS,
  getCapacitySnapshot,
  determineReservationOutcome,
  createDefaultMarketConfig,
  getPriorityWaitlistFIFO,
  type OrderSnapshot,
} from "@/lib/capacity";

const CURRENT_MARKET_ID = "market-current";
const DEFAULT_TOTAL_CAPACITY = 35;

const OPTION_DESCRIPTIONS: Record<Tier, string> = {
  equity:
    "Reduced-price access for someone who would face a barrier paying the regular price.",
  anchor:
    "Regular-price participation that helps sustain sourcing and distribution.",
  steward:
    "A higher contribution that helps expand reduced-price access for another household.",
};

export default function ReservePage() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { isLoading: authLoading, user } = db.useAuth();

  const { data } = db.useQuery({
    markets: { $: { where: { marketId: CURRENT_MARKET_ID } } },
    orders: { $: { where: { marketId: CURRENT_MARKET_ID } } },
    nodes: {},
  });

  const handleReserve = async () => {
    if (!tier) return;

    if (!user) {
      router.push("/login?next=/reserve");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const market = data?.markets?.[0];
      const ordersData = data?.orders ?? [];
      const nodesData = data?.nodes ?? [];

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
        tier: o.tier as Tier,
        status: o.status as OrderSnapshot["status"],
        timestamp:
          typeof o.timestamp === "number"
            ? o.timestamp
            : new Date(o.timestamp as string).getTime(),
        waitlistType: o.waitlistType as "priority" | "standard" | undefined,
      }));

      const snapshot = getCapacitySnapshot(marketConfig, orderSnapshots);
      const outcome = determineReservationOutcome(tier, snapshot);

      const orderId = id();
      const now = new Date();

      let marketEntityId = market?.id;
      if (!marketEntityId) {
        marketEntityId = id();
        await db.transact(
          db.tx.markets[marketEntityId].update({
            marketId: CURRENT_MARKET_ID,
            totalCapacity: DEFAULT_TOTAL_CAPACITY,
            baseEquitySeats: 5,
            equityCapPercent: 0.3,
            anchorCapPercent: 0.55,
            stewardCapPercent: 0.25,
            status: "open",
            createdAt: now.getTime(),
          })
        );
      }

      await db.transact([
        db.tx.orders[orderId]
          .update({
            timestamp: now.getTime(),
            tier,
            status: outcome.status,
            marketId: CURRENT_MARKET_ID,
            waitlistType: outcome.waitlistType ?? undefined,
          })
          .link({ $user: user.id, market: marketEntityId }),
      ]);

      if (outcome.status === "confirmed") {
        let nodeId = nodesData[0]?.id;
        if (!nodeId) {
          nodeId = id();
          await db.transact(
            db.tx.nodes[nodeId].update({
              name: "Community Pickup A",
              capacity: 20,
              remainingCapacity: 19,
            })
          );
        }
        await db.transact([
          db.tx.orders[orderId].update({
            status: "in_queue",
            assignedNodeId: nodeId,
          }),
          db.tx.orders[orderId].link({ node: nodeId }),
        ]);

        if (tier === "steward") {
          const updatedSnapshots: OrderSnapshot[] = [
            ...orderSnapshots,
            {
              id: orderId,
              tier: "steward",
              status: "confirmed",
              timestamp: now.getTime(),
            },
          ];
          const newSnapshot = getCapacitySnapshot(
            marketConfig,
            updatedSnapshots
          );
          const priorityWaitlist = getPriorityWaitlistFIFO(orderSnapshots);
          const equityAvailable = Math.min(
            newSnapshot.unlockedEquitySeats,
            newSnapshot.equityCap
          );
          const canPromote =
            priorityWaitlist.length > 0 &&
            newSnapshot.equityCount < equityAvailable;
          if (canPromote) {
            const toPromote = priorityWaitlist[0];
            const promoteNodeId = nodesData[0]?.id ?? nodeId;
            await db.transact([
              db.tx.orders[toPromote.id].update({
                status: "in_queue",
                assignedNodeId: promoteNodeId,
                waitlistType: undefined,
              }),
              db.tx.orders[toPromote.id].link({ node: promoteNodeId }),
            ]);
          }
        }
      }

      setSuccess(
        outcome.status === "confirmed"
          ? "Reservation confirmed! View your order in My Orders."
          : outcome.status === "waitlisted_priority"
            ? "You're on the Waitlist. We'll notify you when a capacity opens."
            : "You're on the Waitlist. We'll notify you when capacity opens."
      );
      setTimeout(() => router.push("/orders"), 2000);
    } catch (err) {
      setError((err as Error).message || "Failed to create reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-harvest-green">
        Reserve Your Bundle
      </h1>
      <p className="mt-2 text-harvest-earth">
        Choose a participation option for the Camden produce drop. Every
        Steward contribution helps expand Supported access for another
        household.
      </p>
      <p className="mt-2 text-harvest-earth">
        Every participant receives the same produce. The options only change
        how much each person contributes.
      </p>

      <div className="mt-8 rounded-xl border border-harvest-earth/20 bg-white p-6">
        <h2 className="font-semibold text-harvest-green">
          What You&apos;re Reserving
        </h2>
        <p className="mt-2 text-sm text-harvest-earth">
          One seasonal produce bundle for a one-time Camden pilot drop—fruits,
          vegetables, herbs, and other fresh staples. This is not a
          subscription or recurring membership. Confirmed participants will
          receive pricing, drop-date, and Camden-area pickup/delivery details.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-harvest-green">
          Select a participation option
        </h2>
        <div className="mt-4 space-y-3">
          {(["equity", "anchor", "steward"] as Tier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`w-full rounded-lg border-2 px-4 py-3 text-left transition ${
                tier === t
                  ? "border-harvest-green bg-harvest-green/10"
                  : "border-harvest-earth/20 hover:border-harvest-earth/40"
              }`}
            >
              <span className="font-medium">{TIER_LABELS[t]}</span>
              <p className="mt-1 text-sm text-harvest-earth">
                {OPTION_DESCRIPTIONS[t]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {success && (
        <p className="mt-4 text-sm text-harvest-green">{success}</p>
      )}

      {!authLoading && !user && (
        <p className="mt-6 text-sm text-harvest-earth">
          Log in to submit your reservation. You can review the offer and
          participation options first.
        </p>
      )}

      <button
        type="button"
        onClick={handleReserve}
        disabled={loading || !tier}
        className="mt-8 w-full rounded-lg bg-harvest-green px-4 py-3 font-medium text-white hover:bg-harvest-green/90 disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : !user
            ? "Log in to reserve"
            : "Reserve Bundle"}
      </button>
    </div>
  );
}
