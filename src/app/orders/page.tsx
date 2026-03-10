"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { AuthGuard } from "@/components/AuthGuard";

const STATUS_LABELS: Record<string, string> = {
  received: "Order Received",
  in_queue: "Entered Allocation Queue",
  confirmed: "Capacity Confirmed",
  waitlisted_priority: "Priority Waitlist",
  waitlisted_standard: "Standard Waitlist",
  assigned: "Assigned to Pickup Node",
  ready: "Ready for Pickup",
};

const STATUS_ORDER = [
  "received",
  "in_queue",
  "confirmed",
  "assigned",
  "ready",
];

export default function OrdersPage() {
  const [showTransparency, setShowTransparency] = useState(false);
  const { user } = db.useAuth();

  const { data, isLoading, error } = db.useQuery(
    user
      ? {
          $users: {
            $: { where: { id: user.id } },
            orders: {
              $: { order: { timestamp: "desc" } },
              market: {},
              node: {},
            },
          },
        }
      : null
  );

  const orders = data?.$users?.[0]?.orders ?? [];

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
        Error loading orders: {error.message}
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-harvest-green">My Orders</h1>
          <label className="flex items-center gap-2 text-sm text-harvest-earth">
            <input
              type="checkbox"
              checked={showTransparency}
              onChange={(e) => setShowTransparency(e.target.checked)}
              className="rounded border-harvest-earth/30"
            />
            Show transparency details
          </label>
        </div>

        <p className="mt-2 text-harvest-earth">
          Track your reservations through the allocation process.
        </p>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-xl border border-harvest-earth/20 bg-white p-8 text-center">
            <p className="text-harvest-earth">
              You don&apos;t have any orders yet.{" "}
              <a href="/reserve" className="font-medium text-harvest-green underline">
                Reserve a bundle
              </a>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((order) => {
              const statusIdx = STATUS_ORDER.indexOf(order.status);
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-harvest-earth/20 bg-white p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium capitalize text-harvest-green">
                        {order.tier} Tier
                      </p>
                      <p className="mt-1 text-sm text-harvest-earth">
                        {new Date(order.timestamp as number).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        order.status.includes("waitlist")
                          ? "bg-amber-100 text-amber-800"
                          : "bg-harvest-lime/20 text-harvest-green"
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex gap-2">
                      {STATUS_ORDER.map((s, i) => {
                        const isActive = statusIdx >= i;
                        const isCurrent = order.status === s;
                        return (
                          <div
                            key={s}
                            className={`h-2 flex-1 rounded ${
                              isActive ? "bg-harvest-lime" : "bg-harvest-earth/20"
                            } ${isCurrent ? "ring-2 ring-harvest-green ring-offset-2" : ""}`}
                            title={STATUS_LABELS[s]}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-harvest-earth">
                      {STATUS_ORDER.map((s) => (
                        <span key={s} className="text-center">
                          {STATUS_LABELS[s].split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {showTransparency && (
                    <div className="mt-4 rounded-lg bg-harvest-cream/50 p-4 text-sm">
                      <p>
                        <strong>Tier:</strong> {order.tier}
                      </p>
                      <p>
                        <strong>Timestamp:</strong>{" "}
                        {new Date(order.timestamp as number).toISOString()}
                      </p>
                      {order.node && (
                        <p>
                          <strong>Pickup Node:</strong> {order.node.name}
                        </p>
                      )}
                      {order.market && (
                        <p>
                          <strong>Market Capacity:</strong>{" "}
                          {order.market.totalCapacity}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
