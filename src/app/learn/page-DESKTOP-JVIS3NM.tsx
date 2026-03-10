"use client";

import { useState } from "react";

type Section = "why" | "sourcing" | "devoir";

export default function LearnPage() {
  const [activeSection, setActiveSection] = useState<Section>("why");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-harvest-green">Learn</h1>
      <p className="mt-2 text-harvest-earth">
        Understand the mission, sourcing, and coordination behind Harvest Hub.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {[
          { id: "why" as const, label: "Why This Exists" },
          { id: "sourcing" as const, label: "Where Produce Comes From" },
          { id: "devoir" as const, label: "What is Devoir" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeSection === id
                ? "bg-harvest-green text-white"
                : "bg-harvest-earth/20 text-harvest-earth hover:bg-harvest-earth/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-harvest-earth/20 bg-white p-6">
        {activeSection === "why" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-harvest-green">
              Why This Exists
            </h2>
            <p className="text-harvest-earth">
              Harvest Hub addresses critical barriers to food access in our
              community. Many households face challenges getting fresh, healthy
              produce due to:
            </p>
            <ul className="list-inside list-disc space-y-2 text-harvest-earth">
              <li>
                <strong>Food access:</strong> Limited availability of affordable,
                nutritious produce in certain neighborhoods.
              </li>
              <li>
                <strong>Transportation barriers:</strong> Difficulty reaching
                farmers markets or grocery stores without reliable transit.
              </li>
              <li>
                <strong>Coordinated distribution:</strong> The need for a system
                that brings produce to centralized pickup points, making it easier
                for everyone to participate.
              </li>
            </ul>
            <p className="text-harvest-earth">
              Our Community Capacity Pool ensures that Steward participation
              directly expands access for Equity households. When you choose the
              Steward tier, you unlock one additional Equity seat for a neighbor
              in need.
            </p>
          </div>
        )}

        {activeSection === "sourcing" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-harvest-green">
              Where Produce Comes From
            </h2>
            <p className="text-harvest-earth">
              Harvest Hub sources produce from local and regional farms committed
              to sustainable practices. Our weekly bundles include:
            </p>
            <ul className="list-inside list-disc space-y-2 text-harvest-earth">
              <li>Seasonal vegetables and fruits</li>
              <li>Fresh herbs</li>
              <li>Produce from farms within our regional network</li>
            </ul>
            <p className="text-harvest-earth">
              Pickup happens at designated community nodes—local sites like
              churches, community centers, or partner organizations. When your
              order is confirmed, you&apos;ll be assigned to a pickup node near you.
              Each node has limited capacity to ensure smooth distribution and
              minimal waste.
            </p>
          </div>
        )}

        {activeSection === "devoir" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-harvest-green">
              What is Devoir
            </h2>
            <p className="text-harvest-earth">
              Devoir is the coordination system that powers fair distribution at
              Harvest Hub. It ensures that:
            </p>
            <ul className="list-inside list-disc space-y-2 text-harvest-earth">
              <li>
                <strong>Capacity is managed fairly:</strong> Tier caps (Equity
                30%, Anchor 55%, Steward 25%) prevent any single tier from
                dominating the market.
              </li>
              <li>
                <strong>Equity seats unlock through Steward participation:</strong>{" "}
                Every Steward reservation opens one more seat for an Equity
                household.
              </li>
              <li>
                <strong>Waitlists work predictably:</strong> Priority Equity
                waitlist members are promoted FIFO when new capacity opens.
              </li>
            </ul>
            <p className="text-harvest-earth">
              Devoir runs in the background to allocate orders, assign pickup
              nodes, and keep the system running smoothly for everyone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
