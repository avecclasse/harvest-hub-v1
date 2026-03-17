"use client";

import { useState } from "react";

type Section = "why" | "steward" | "sourcing" | "devoir";

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
          { id: "steward" as const, label: "What is a Steward?" },
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
                <strong>Inconvenient Options:</strong> Healthy food is often available only at specific times or locations, making it difficult for busy households to access consistently.
              </li>
            </ul>
            <p className="text-harvest-earth">
              Harvest Hub uses a shared capacity model where Steward participation expands access for others. Each Steward order unlocks one additional Equity seat, allowing more households in need to access fresh produce.
            </p>
          </div>
        )}

        {activeSection === "steward" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-harvest-green">
              What is a Steward?
            </h2>
            <p className="text-harvest-earth">
              A Steward is someone who joins Harvest Hub knowing their food
              choices can improve their community. They&apos;re not just buying
              produce for themselves—they&apos;re choosing a system that helps
              more households consistently access quality food.
            </p>

            <div>
              <h3 className="text-lg font-semibold text-harvest-green">
                What Defines a Steward
              </h3>
              <ul className="list-inside list-disc space-y-2 text-harvest-earth">
                <li>
                  <strong>Community-minded buying:</strong> &quot;My purchase
                  can strengthen the network, not just fill my fridge.&quot;
                </li>
                <li>
                  <strong>Irritation with the status quo:</strong> A sense that
                  the current food system too often leaves some neighborhoods
                  with fewer healthy options.
                </li>
                <li>
                  <strong>Compassion and solidarity:</strong> A desire to stand
                  with neighbors and help build something that works for more
                  people.
                </li>
                <li>
                  <strong>Agency over charity:</strong> Stewardship isn&apos;t
                  about saving anyone—it&apos;s about taking responsibility for
                  the kind of community we want.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-harvest-green">
                Why Stewards Matter to Harvest Hub
              </h3>
              <ul className="list-inside list-disc space-y-2 text-harvest-earth">
                <li>
                  <strong>They expand shared capacity:</strong> Harvest Hub runs
                  on a shared capacity model that serves more households when
                  Stewards participate.
                </li>
                <li>
                  <strong>They unlock Equity seats:</strong> Each Steward
                  produce bundle opens additional Equity seats for households
                  with fewer resources.
                </li>
                <li>
                  <strong>They reduce reliance on donations:</strong> This moves
                  the model away from charity and toward shared participation.
                </li>
                <li>
                  <strong>They strengthen inclusion:</strong> As more Stewards
                  join, the network grows in a way that brings in households
                  that are often excluded from healthy food systems.
                </li>
              </ul>
            </div>

            <p className="text-harvest-earth">
              Stewardship is a simple idea: we do better when we do this
              together. If you believe expanding access to healthy food makes
              the whole community stronger—and that it doesn&apos;t take away
              from what you have—you may already be a Steward.
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
              Devoir is the coordination system that keeps Harvest Hub fair, predictable, and accessible for everyone. It ensures that:
            </p>
            <ul className="list-inside list-disc space-y-2 text-harvest-earth">
              <li>
                <strong>Capacity stays balanced:</strong> Tier limits keep the system healthy so no single group takes all available seats.
              </li>
              <li>
                <strong>Community support expands access:</strong>{" "}
                Every Steward reservation unlocks an additional Equity seat for a household facing financial barriers.
              </li>
              <li>
                <strong>Waitlists move fairly:</strong> When new capacity opens, Equity households on the waitlist are promoted in order so access grows transparently.
              </li>
            </ul>
            <p className="text-harvest-earth">
              Devoir runs quietly in the background to allocate orders, coordinate pickup nodes, and keep the system operating smoothly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
