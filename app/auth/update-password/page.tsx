"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f3f4ec] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-100 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-[#012d1d] text-2xl tracking-[-0.5px]">New password</h1>
          <p className="text-[#414844] text-sm">Enter a new password for your account.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-sm focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="bg-white border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-sm focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-3.5 rounded-lg hover:bg-[#012d1d] transition-colors disabled:opacity-60"
          >
            {loading ? "Please wait…" : "Update password"}
          </button>
        </form>

        <Link href="/" className="text-[#1b4332] text-xs font-semibold hover:underline w-fit">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
