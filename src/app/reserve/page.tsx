"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import {
  type Tier,
  TIER_LABELS,
  CURRENT_MARKET_ID,
} from "@/lib/capacity";
import { isActiveApplication } from "@/lib/application-status";

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

  const { data } = db.useQuery(
    user
      ? {
          markets: { $: { where: { marketId: CURRENT_MARKET_ID } } },
          $users: {
            $: { where: { id: user.id } },
            orders: {
              $: { where: { marketId: CURRENT_MARKET_ID } },
            },
          },
        }
      : {
          markets: { $: { where: { marketId: CURRENT_MARKET_ID } } },
        }
  );

  const handleApply = async () => {
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
      if (!market) {
        setError(
          "Applications are not open yet. Please check back once the produce drop is accepting applications."
        );
        return;
      }

      const existingOrders = data?.$users?.[0]?.orders ?? [];
      const hasActive = existingOrders.some((o) =>
        isActiveApplication(o.status as string)
      );
      if (hasActive) {
        setError(
          "You already have an active application for this produce drop. Check My Applications for its status."
        );
        return;
      }

      const orderId = id();
      const now = new Date();

      await db.transact([
        db.tx.orders[orderId]
          .update({
            timestamp: now.getTime(),
            tier,
            status: "pending_review",
            marketId: CURRENT_MARKET_ID,
          })
          .link({ $user: user.id, market: market.id }),
      ]);

      setSuccess(
        "Application received. We'll review applications and notify selected participants with next steps."
      );
      setTimeout(() => router.push("/orders"), 2000);
    } catch (err) {
      setError((err as Error).message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-harvest-green">
        Apply for the Camden Produce Drop
      </h1>
      <p className="mt-2 text-harvest-earth">
        Choose a participation option for the Camden produce drop. Every
        Steward contribution helps expand Supported access for another
        household.
      </p>
      <p className="mt-2 text-harvest-earth">
        Every participant receives the same produce. The options only change
        how much each person contributes. Submitting an application does not
        confirm a seat. Administrators review applications and select
        participants later.
      </p>

      <div className="mt-8 rounded-xl border border-harvest-earth/20 bg-white p-6">
        <h2 className="font-semibold text-harvest-green">
          What You&apos;re Applying For
        </h2>
        <p className="mt-2 text-sm text-harvest-earth">
          One seasonal produce bundle for a Camden pilot drop—fruits,
          vegetables, herbs, and other fresh staples. This is not a
          subscription or recurring membership. Selected participants will
          receive pricing, drop-date, and local pickup/delivery details.
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
          Log in to submit your application. You can review the offer and
          participation options first.
        </p>
      )}

      <button
        type="button"
        onClick={handleApply}
        disabled={loading || !tier}
        className="mt-8 w-full rounded-lg bg-harvest-green px-4 py-3 font-medium text-white hover:bg-harvest-green/90 disabled:opacity-50"
      >
        {loading
          ? "Submitting..."
          : !user
            ? "Log in to apply"
            : "Submit Application"}
      </button>
    </div>
  );
}
