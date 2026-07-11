"use client";

import Link from "next/link";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";

export function Nav() {
  const { isLoading, user } = db.useAuth();
  const showAdmin = !isLoading && isAdminEmail(user?.email);

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
            Apply
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-harvest-earth hover:text-harvest-green"
          >
            Community Impact
          </Link>
          <Link
            href="/learn"
            className="text-sm font-medium text-harvest-earth hover:text-harvest-green"
          >
            Learn
          </Link>
          {showAdmin && (
            <Link
              href="/admin/applications"
              className="text-sm font-medium text-harvest-earth hover:text-harvest-green"
            >
              Admin
            </Link>
          )}
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/orders"
                    className="text-sm font-medium text-harvest-earth hover:text-harvest-green"
                  >
                    My Applications
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
