"use client";

import { useState } from "react";
import Link from "next/link";
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

const inputClassName =
  "mt-1 w-full rounded-md border border-harvest-earth/30 px-3 py-2 focus:border-harvest-green focus:outline-none focus:ring-1 focus:ring-harvest-green";

function digitCount(phone: string) {
  return phone.replace(/\D/g, "").length;
}

export default function ReservePage() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
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

  const nameTrimmed = applicantName.trim();
  const phoneTrimmed = applicantPhone.trim();
  const canSubmit =
    !!tier && nameTrimmed.length > 0 && digitCount(phoneTrimmed) >= 10;

  const handleApply = async () => {
    if (!user) {
      router.push("/login?next=/reserve");
      return;
    }

    if (!canSubmit || !tier) return;

    setError("");
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
            applicantName: nameTrimmed,
            applicantPhone: phoneTrimmed,
          })
          .link({ $user: user.id, market: market.id }),
      ]);

      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-harvest-earth/20 bg-white p-6">
          <h1 className="text-2xl font-bold text-harvest-green">
            Application received
          </h1>
          <p className="mt-4 text-harvest-earth">
            Expect a follow-up text within the next 24 hours with the
            application outcome and next steps.
          </p>
          <Link
            href="/orders"
            className="mt-6 inline-block rounded-lg bg-harvest-green px-4 py-3 font-medium text-white hover:bg-harvest-green/90"
          >
            View My Applications
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="mt-8 space-y-4">
        <h2 className="font-semibold text-harvest-green">Your contact info</h2>
        <div>
          <label
            htmlFor="applicantName"
            className="block text-sm font-medium text-harvest-earth"
          >
            Full name
          </label>
          <input
            id="applicantName"
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            placeholder="Jane Doe"
            required
            autoComplete="name"
            className={inputClassName}
          />
        </div>
        <div>
          <label
            htmlFor="applicantPhone"
            className="block text-sm font-medium text-harvest-earth"
          >
            Phone number
          </label>
          <input
            id="applicantPhone"
            type="tel"
            value={applicantPhone}
            onChange={(e) => setApplicantPhone(e.target.value)}
            placeholder="(856) 555-0100"
            required
            autoComplete="tel"
            className={inputClassName}
          />
          <p className="mt-1 text-xs text-harvest-earth">
            We&apos;ll text you about your application outcome.
          </p>
        </div>
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

      {!authLoading && !user && (
        <p className="mt-6 text-sm text-harvest-earth">
          Log in to submit your application. You can review the offer and
          participation options first.
        </p>
      )}

      <button
        type="button"
        onClick={handleApply}
        disabled={loading || (!user ? false : !canSubmit)}
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
