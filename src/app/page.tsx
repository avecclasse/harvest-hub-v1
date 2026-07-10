"use client";

import Link from "next/link";
import { db } from "@/lib/db";

const PARTICIPATION_OPTIONS = [
  {
    label: "Supported",
    description:
      "Reduced-price access for someone who would face a barrier paying the regular price.",
  },
  {
    label: "Standard",
    description:
      "Regular-price participation that helps sustain sourcing and distribution.",
  },
  {
    label: "Steward",
    description:
      "A higher contribution that helps expand reduced-price access for another household.",
  },
] as const;

export default function HomePage() {
  const { isLoading, user } = db.useAuth();

  return (
    <div className="space-y-16">
      <section className="rounded-2xl bg-harvest-green/10 px-8 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-harvest-green">
          Harvest Hub
        </p>
        <h1 className="mt-3 text-4xl font-bold text-harvest-green md:text-5xl">
          Fresh produce, coordinated for Camden.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-harvest-earth md:text-xl">
          Harvest Hub is a pilot offering a produce bundle with 
          fruits, vegetables, herbs, and other fresh staples.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#participation"
            className="rounded-lg bg-harvest-green px-5 py-3 text-sm font-medium text-white hover:bg-harvest-green/90"
          >
            View participation options
          </a>
          <Link
            href="/learn"
            className="rounded-lg border border-harvest-green px-5 py-3 text-sm font-medium text-harvest-green hover:bg-harvest-green/10"
          >
            Learn about Harvest Hub
          </Link>
        </div>
      </section>

      <section id="participation" className="scroll-mt-24 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-harvest-green">
            Participation options
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-harvest-earth">
            Every participant receives the same produce. The options only change
            how much each person contributes.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PARTICIPATION_OPTIONS.map((option) => (
            <div
              key={option.label}
              className="rounded-xl border border-harvest-earth/20 bg-white p-6"
            >
              <h3 className="text-lg font-semibold text-harvest-green">
                {option.label}
              </h3>
              <p className="mt-2 text-sm text-harvest-earth">
                {option.description}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/reserve"
            className="inline-block rounded-lg bg-harvest-green px-5 py-3 text-sm font-medium text-white hover:bg-harvest-green/90"
          >
            Reserve for the Camden drop
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-harvest-green">
          What You&apos;re Reserving
        </h2>
        <div className="rounded-xl border border-harvest-earth/20 bg-white p-6">
          <ul className="list-inside list-disc space-y-3 text-harvest-earth">
            <li>This is one produce bundle.</li>
            <li>This pilot involves a coordinated produce drop.</li>
            <li>It is not a subscription or recurring membership.</li>
            <li>
              Confirmed participants will receive pickup/delivery information.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-harvest-green">
          How the Pilot Works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            "Choose Supported, Standard, or Steward.",
            "Submit a reservation.",
            "Receive confirmation and fulfillment details.",
          ].map((step, index) => (
            <li
              key={step}
              className="rounded-xl border border-harvest-earth/20 bg-white p-6"
            >
              <span className="text-sm font-semibold text-harvest-green">
                Step {index + 1}
              </span>
              <p className="mt-2 text-harvest-earth">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Link
          href="/dashboard"
          className="rounded-xl border border-harvest-earth/20 bg-white p-6 shadow-sm transition hover:border-harvest-lime/50 hover:shadow-md"
        >
          <h2 className="font-semibold text-harvest-green">Community Impact</h2>
          <p className="mt-2 text-sm text-harvest-earth">
            See how your participation expands access.
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
            {!isLoading && !user ? " Log in required." : ""}
          </p>
        </Link>
      </section>
    </div>
  );
}
