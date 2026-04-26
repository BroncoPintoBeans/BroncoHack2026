"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#f3f4ec] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-100 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-[#012d1d] text-2xl tracking-[-0.5px]">Reset password</h1>
          <p className="text-[#414844] text-sm">
            {sent
              ? "If that email is on file, you will get a link to set a new password."
              : "We will email you a link to choose a new password."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-xs">{error}</div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">Campus Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                className="bg-white border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-sm placeholder-[#9ca3a0] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-3.5 rounded-lg hover:bg-[#012d1d] transition-colors disabled:opacity-60"
            >
              {loading ? "Please wait…" : "Send reset link"}
            </button>
          </form>
        ) : (
          <p className="text-[#414844] text-sm">
            Sent to <span className="font-semibold text-[#1a1c18]">{email}</span>
          </p>
        )}

        <Link href="/" className="text-[#1b4332] text-xs font-semibold hover:underline w-fit">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
