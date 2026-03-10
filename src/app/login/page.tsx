"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";

export default function LoginPage() {
  const [sentEmail, setSentEmail] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(email);
    } catch (err: unknown) {
      const msg = (err as { body?: { message?: string } })?.body?.message;
      setError(msg || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
      router.push("/");
    } catch (err: unknown) {
      const msg = (err as { body?: { message?: string } })?.body?.message;
      setError(msg || "Invalid code. Please try again.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-harvest-green">Log In</h1>
      <p className="mt-2 text-harvest-earth">
        Enter your email below. We&apos;ll send you a 6-digit code to log in.
      </p>

      {!sentEmail ? (
        <form onSubmit={handleSendCode} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-harvest-earth">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1 w-full rounded-md border border-harvest-earth/30 px-3 py-2 focus:border-harvest-green focus:outline-none focus:ring-1 focus:ring-harvest-green"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-harvest-green px-4 py-2 font-medium text-white hover:bg-harvest-green/90 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
          <p className="text-sm text-harvest-earth">
            We sent a code to <strong>{sentEmail}</strong>. Enter it below.
          </p>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-harvest-earth">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              maxLength={6}
              className="mt-1 w-full rounded-md border border-harvest-earth/30 px-3 py-2 font-mono text-lg tracking-widest focus:border-harvest-green focus:outline-none focus:ring-1 focus:ring-harvest-green"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-harvest-green px-4 py-2 font-medium text-white hover:bg-harvest-green/90 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSentEmail("");
              setCode("");
              setError("");
            }}
            className="w-full text-sm text-harvest-earth underline hover:text-harvest-green"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
