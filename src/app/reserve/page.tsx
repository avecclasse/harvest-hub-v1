"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { AuthGuard } from "@/components/AuthGuard";
import {
  type Tier,
  getCapacitySnapshot,
  determineReservationOutcome,
  createDefaultMarketConfig,
  getPriorityWaitlistFIFO,
  type OrderSnapshot,
} from "@/lib/capacity";

const CURRENT_MARKET_ID = "market-current";
const DEFAULT_TOTAL_CAPACITY = 50;

export default function ReservePage() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { user } = db.useAuth();

  const { data } = db.useQuery({
    markets: { $: { where: { marketId: CURRENT_MARKET_ID } } },
    orders: { $: { where: { marketId: CURRENT_MARKET_ID } } },
    nodes: {},
  });

  const handleReserve = async () => {
    if (!tier || !user) return;

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
          const canPromote = priorityWaitlist.length > 0 && newSnapshot.equityCount < equityAvailable;
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
          ? "You're on the Priority Equity Waitlist. We'll notify you when a seat opens."
          : "You're on the Standard Waitlist. We'll notify you when capacity opens."
      );
      setTimeout(() => router.push("/orders"), 2000);
    } catch (err) {
      setError((err as Error).message || "Failed to create reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-harvest-green">
          Reserve Your Bundle
        </h1>
        <p className="mt-2 text-harvest-earth">
          Choose your tier to support the community capacity pool. Steward
          participation unlocks additional Equity seats.
        </p>

        <div className="mt-8 rounded-xl border border-harvest-earth/20 bg-white p-6">
          <h2 className="font-semibold text-harvest-green">
            Weekly Produce Bundle
          </h2>
          <p className="mt-2 text-sm text-harvest-earth">
            A curated selection of seasonal produce from local farms:
            vegetables, fruits, and herbs. Pickup at your assigned community
            node.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="font-semibold text-harvest-green">Select Your Tier</h2>
          <div className="mt-4 space-y-3">
            {(["equity", "anchor", "steward"] as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`w-full rounded-lg border-2 px-4 py-3 text-left capitalize transition ${
                  tier === t
                    ? "border-harvest-green bg-harvest-green/10"
                    : "border-harvest-earth/20 hover:border-harvest-earth/40"
                }`}
              >
                <span className="font-medium">{t}</span>
                <p className="mt-1 text-sm text-harvest-earth">
                  {t === "equity" &&
                    "Supports households facing food access barriers."}
                  {t === "anchor" && "Sustains the community capacity pool."}
                  {t === "steward" &&
                    "Expands access: 1 Steward unlocks 1 additional Equity seat."}
                </p>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && (
          <p className="mt-4 text-sm text-harvest-green">{success}</p>
        )}

        <button
          onClick={handleReserve}
          disabled={loading || !tier}
          className="mt-8 w-full rounded-lg bg-harvest-green px-4 py-3 font-medium text-white hover:bg-harvest-green/90 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Reserve Bundle"}
        </button>
      </div>
    </AuthGuard>
  );
}
