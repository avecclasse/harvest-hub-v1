"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import {
  type Tier,
  TIER_LABELS,
  CURRENT_MARKET_ID,
  TOTAL_CAPACITY,
  SELECTION_TARGETS,
  getSelectedCountsByTier,
  createDefaultMarketConfig,
  type OrderSnapshot,
} from "@/lib/capacity";
import {
  canTransition,
  getStatusLabel,
  holdsSeat,
  isWaitlistedStatus,
} from "@/lib/application-status";

type StatusFilter = "all" | string;
type TierFilter = "all" | Tier;

function toTimestamp(value: number | string | Date): number {
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = db.useAuth();
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionError, setActionError] = useState("");
  const [actionWarning, setActionWarning] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [marketEnsured, setMarketEnsured] = useState(false);

  const isAdmin = isAdminEmail(user?.email);

  const { data, isLoading, error } = db.useQuery(
    user && isAdmin
      ? {
          markets: { $: { where: { marketId: CURRENT_MARKET_ID } } },
          orders: {
            $: { where: { marketId: CURRENT_MARKET_ID } },
            $user: {},
          },
          nodes: {},
        }
      : null
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/admin/applications");
    }
  }, [authLoading, user, router]);

  // Ensure market-current exists so applicants can submit.
  useEffect(() => {
    if (!isAdmin || marketEnsured || isLoading) return;
    const market = data?.markets?.[0];
    if (market) {
      setMarketEnsured(true);
      return;
    }
    if (data === undefined) return;

    let cancelled = false;
    (async () => {
      try {
        const defaults = createDefaultMarketConfig(
          CURRENT_MARKET_ID,
          TOTAL_CAPACITY
        );
        const marketId = id();
        await db.transact(
          db.tx.markets[marketId].update({
            marketId: CURRENT_MARKET_ID,
            totalCapacity: defaults.totalCapacity,
            baseEquitySeats: defaults.baseEquitySeats,
            equityCapPercent: defaults.equityCapPercent,
            anchorCapPercent: defaults.anchorCapPercent,
            stewardCapPercent: defaults.stewardCapPercent,
            status: "open",
            createdAt: Date.now(),
          })
        );
      } catch (err) {
        console.error("Failed to ensure market:", err);
      } finally {
        if (!cancelled) setMarketEnsured(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, marketEnsured, isLoading, data]);

  const orders = useMemo(() => {
    const list = data?.orders ?? [];
    return [...list].sort(
      (a, b) => toTimestamp(a.timestamp) - toTimestamp(b.timestamp)
    );
  }, [data?.orders]);

  const snapshots: OrderSnapshot[] = useMemo(
    () =>
      orders.map((o) => ({
        id: o.id,
        tier: o.tier as Tier,
        status: o.status as string,
        timestamp: toTimestamp(o.timestamp),
      })),
    [orders]
  );

  const selectedCounts = getSelectedCountsByTier(snapshots);
  const remainingCapacity = Math.max(0, TOTAL_CAPACITY - selectedCounts.total);
  const pendingCount = orders.filter(
    (o) =>
      o.status === "pending_review" || o.status === "received"
  ).length;

  const filtered = orders.filter((o) => {
    if (tierFilter !== "all" && o.tier !== tierFilter) return false;
    if (statusFilter !== "all") {
      if (statusFilter === "waitlisted") {
        return isWaitlistedStatus(o.status as string);
      }
      if (statusFilter === "selected") {
        return (
          o.status === "selected" ||
          o.status === "in_queue" ||
          o.status === "confirmed"
        );
      }
      if (statusFilter === "pending_review") {
        return o.status === "pending_review" || o.status === "received";
      }
      return o.status === statusFilter;
    }
    return true;
  });

  const ensureNode = async (): Promise<string> => {
    const existing = data?.nodes?.[0];
    if (existing) return existing.id;
    const nodeId = id();
    await db.transact(
      db.tx.nodes[nodeId].update({
        name: "Community Pickup A",
        capacity: 20,
        remainingCapacity: 19,
      })
    );
    return nodeId;
  };

  const updateStatus = async (
    orderId: string,
    currentStatus: string,
    nextStatus: string,
    tier: Tier
  ) => {
    setActionError("");
    setActionWarning("");

    if (!canTransition(currentStatus, nextStatus)) {
      setActionError(
        `Cannot change status from ${getStatusLabel(currentStatus)} to ${getStatusLabel(nextStatus)}.`
      );
      return;
    }

    if (nextStatus === "selected") {
      if (selectedCounts.total >= TOTAL_CAPACITY) {
        setActionError(
          `Cannot select more than ${TOTAL_CAPACITY} participants. Capacity is full.`
        );
        return;
      }
      const tierSelected =
        tier === "equity"
          ? selectedCounts.equity
          : tier === "anchor"
            ? selectedCounts.anchor
            : selectedCounts.steward;
      const target = SELECTION_TARGETS[tier];
      if (tierSelected >= target) {
        setActionWarning(
          `${TIER_LABELS[tier]} target of ${target} has been reached (${tierSelected} selected). Proceeding anyway.`
        );
      }
    }

    setBusyId(orderId);
    try {
      if (nextStatus === "assigned") {
        const nodeId = await ensureNode();
        await db.transact([
          db.tx.orders[orderId].update({
            status: "assigned",
            assignedNodeId: nodeId,
            waitlistType: undefined,
          }),
          db.tx.orders[orderId].link({ node: nodeId }),
        ]);
      } else {
        await db.transact(
          db.tx.orders[orderId].update({
            status: nextStatus,
            waitlistType: undefined,
          })
        );
      }
    } catch (err) {
      setActionError(
        (err as Error).message || "Failed to update application status."
      );
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || (user && isAdmin && isLoading)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-harvest-green border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-xl font-bold text-red-800">Access denied</h1>
        <p className="mt-2 text-sm text-red-700">
          Only authorized administrators can review applications.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        Error loading applications: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-harvest-green">
          Application Review
        </h1>
        <p className="mt-2 text-sm text-harvest-earth">
          Review applications in FIFO order. Selection is explicit—new
          applications never become selected automatically. Targets (
          {SELECTION_TARGETS.equity} Supported / {SELECTION_TARGETS.anchor}{" "}
          Standard / {SELECTION_TARGETS.steward} Steward) are guidance only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total applications" value={orders.length} />
        <SummaryCard label="Pending review" value={pendingCount} />
        <SummaryCard
          label="Selected total"
          value={selectedCounts.total}
        />
        <SummaryCard
          label="Remaining capacity"
          value={`${remainingCapacity} / ${TOTAL_CAPACITY}`}
        />
        <SummaryCard
          label="Supported selected"
          value={`${selectedCounts.equity} / ${SELECTION_TARGETS.equity}`}
        />
        <SummaryCard
          label="Standard selected"
          value={`${selectedCounts.anchor} / ${SELECTION_TARGETS.anchor}`}
        />
        <SummaryCard
          label="Steward selected"
          value={`${selectedCounts.steward} / ${SELECTION_TARGETS.steward}`}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="text-sm text-harvest-earth">
          Participation{" "}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as TierFilter)}
            className="ml-2 rounded border border-harvest-earth/30 bg-white px-2 py-1"
          >
            <option value="all">All</option>
            <option value="equity">Supported</option>
            <option value="anchor">Standard</option>
            <option value="steward">Steward</option>
          </select>
        </label>
        <label className="text-sm text-harvest-earth">
          Status{" "}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 rounded border border-harvest-earth/30 bg-white px-2 py-1"
          >
            <option value="all">All</option>
            <option value="pending_review">Pending review</option>
            <option value="selected">Selected</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="declined">Declined</option>
            <option value="assigned">Assigned</option>
            <option value="ready">Ready</option>
          </select>
        </label>
      </div>

      {actionError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}
      {actionWarning && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {actionWarning}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-harvest-earth/20 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-harvest-earth/20 bg-harvest-cream/50 text-harvest-earth">
            <tr>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Option</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-harvest-earth"
                >
                  No applications match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const status = order.status as string;
                const tier = order.tier as Tier;
                const email =
                  (order.$user as { email?: string } | undefined)?.email ??
                  "—";
                const busy = busyId === order.id;

                return (
                  <tr
                    key={order.id}
                    className="border-b border-harvest-earth/10 last:border-0"
                  >
                    <td className="px-4 py-3 text-harvest-earth">
                      {new Date(toTimestamp(order.timestamp)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-harvest-green">{email}</td>
                    <td className="px-4 py-3">
                      {TIER_LABELS[tier] ?? order.tier}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          holdsSeat(status)
                            ? "bg-harvest-lime/20 text-harvest-green"
                            : isWaitlistedStatus(status)
                              ? "bg-amber-100 text-amber-800"
                              : status === "declined"
                                ? "bg-red-100 text-red-800"
                                : "bg-harvest-earth/10 text-harvest-earth"
                        }`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {canTransition(status, "selected") && (
                          <ActionButton
                            disabled={busy}
                            onClick={() =>
                              updateStatus(order.id, status, "selected", tier)
                            }
                            label="Select"
                          />
                        )}
                        {canTransition(status, "waitlisted") && (
                          <ActionButton
                            disabled={busy}
                            onClick={() =>
                              updateStatus(
                                order.id,
                                status,
                                "waitlisted",
                                tier
                              )
                            }
                            label="Waitlist"
                            tone="amber"
                          />
                        )}
                        {canTransition(status, "declined") && (
                          <ActionButton
                            disabled={busy}
                            onClick={() =>
                              updateStatus(order.id, status, "declined", tier)
                            }
                            label="Decline"
                            tone="red"
                          />
                        )}
                        {canTransition(status, "assigned") && (
                          <ActionButton
                            disabled={busy}
                            onClick={() =>
                              updateStatus(order.id, status, "assigned", tier)
                            }
                            label="Assign"
                          />
                        )}
                        {canTransition(status, "ready") && (
                          <ActionButton
                            disabled={busy}
                            onClick={() =>
                              updateStatus(order.id, status, "ready", tier)
                            }
                            label="Mark Ready"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-harvest-earth/20 bg-white p-4">
      <p className="text-xs font-medium text-harvest-earth">{label}</p>
      <p className="mt-1 text-2xl font-bold text-harvest-green">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone = "green",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "green" | "amber" | "red";
}) {
  const tones = {
    green: "bg-harvest-green text-white hover:bg-harvest-green/90",
    amber: "bg-amber-600 text-white hover:bg-amber-700",
    red: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}
