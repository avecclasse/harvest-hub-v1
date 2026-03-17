"use client";

import Link from "next/link";
import { db } from "@/lib/db";

export default function HomePage() {
  const { isLoading, user } = db.useAuth();

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-harvest-green/10 px-8 py-16 text-center">
        <h1 className="text-4xl font-bold text-harvest-green md:text-5xl">
          Harvest Hub
        </h1>
        <p className="mt-4 text-lg text-harvest-earth md:text-xl">
          Reserve your produce bundle. Support community food access.
          Choose your tier and grow together.
        </p>
        {!isLoading && !user && (
          <p className="mt-6 text-sm text-harvest-earth/80">
            <Link href="/login" className="underline hover:text-harvest-green">
              Log in
            </Link>{" "}
            to reserve a bundle or view your orders.
          </p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/reserve"
          className="rounded-xl border border-harvest-earth/20 bg-white p-6 shadow-sm transition hover:border-harvest-lime/50 hover:shadow-md"
        >
          <h2 className="font-semibold text-harvest-green">Reserve</h2>
          <p className="mt-2 text-sm text-harvest-earth">
            Reserve your produce bundle. Choose Equity, Anchor, or
            Steward tier.
          </p>
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-harvest-earth/20 bg-white p-6 shadow-sm transition hover:border-harvest-lime/50 hover:shadow-md"
        >
          <h2 className="font-semibold text-harvest-green">Dashboard</h2>
          <p className="mt-2 text-sm text-harvest-earth">
            Community capacity pool dashboard. See available bundles &
            households supported.
          </p>
        </Link>
        <Link
          href="/learn"
          className="rounded-xl border border-harvest-earth/20 bg-white p-6 shadow-sm transition hover:border-harvest-lime/50 hover:shadow-md"
        >
          <h2 className="font-semibold text-harvest-green">Learn</h2>
          <p className="mt-2 text-sm text-harvest-earth">
            Why this exists, where produce comes from, and what is Devoir.
          </p>
        </Link>
        <Link
          href="/orders"
          className="rounded-xl border border-harvest-earth/20 bg-white p-6 shadow-sm transition hover:border-harvest-lime/50 hover:shadow-md"
        >
          <h2 className="font-semibold text-harvest-green">My Orders</h2>
          <p className="mt-2 text-sm text-harvest-earth">
            Track your reservations with order status updates.
          </p>
        </Link>
      </section>
    </div>
  );
}
