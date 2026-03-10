"use client";

import Link from "next/link";
import { db } from "@/lib/db";

export function Nav() {
  const { isLoading, user } = db.useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-harvest-earth/20 bg-harvest-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-xl font-bold text-harvest-green transition hover:text-harvest-lime"
        >
          Harvest Hub
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/reserve"
            className="text-sm font-medium text-harvest-earth hover:text-harvest-green"
          >
            Reserve
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-harvest-earth hover:text-harvest-green"
          >
            Dashboard
          </Link>
          <Link
            href="/learn"
            className="text-sm font-medium text-harvest-earth hover:text-harvest-green"
          >
            Learn
          </Link>
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/orders"
                    className="text-sm font-medium text-harvest-earth hover:text-harvest-green"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => db.auth.signOut()}
                    className="rounded-md bg-harvest-earth/20 px-3 py-1.5 text-sm font-medium text-harvest-earth hover:bg-harvest-earth/30"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md bg-harvest-green px-3 py-1.5 text-sm font-medium text-white hover:bg-harvest-green/90"
                >
                  Log In
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
