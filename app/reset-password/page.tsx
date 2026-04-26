"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");

    if (!code) {
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError(error.message);
      } else {
        window.history.replaceState({}, "", "/reset-password");
      }
    });
  }, []);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setNotice("Your password has been updated. Redirecting to sign in...");
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f3f4ec] flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-[460px] bg-white border border-[#e0e4da] rounded-2xl shadow-[0px_18px_42px_rgba(27,67,50,0.08)] p-8 flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#f3f4ec] overflow-hidden shadow-[0px_10px_24px_rgba(1,45,29,0.14)]">
            <img src="/bronco-login-icon.png" alt="" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[#1b4332] text-xs font-bold tracking-[0.8px] uppercase">Bronco Repair Desk</p>
            <h1 className="text-[#012d1d] text-2xl font-bold tracking-[-0.5px]">Reset password</h1>
          </div>
        </div>

        <p className="text-[#414844] text-sm leading-relaxed">
          Enter a new password for your account. After it is saved, you can sign in with the updated password.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-xs leading-relaxed">
            {error}
          </div>
        )}

        {notice && (
          <div className="bg-[#edf8f1] border border-[#b6dec6] rounded-lg px-4 py-3 text-[#1b4332] text-xs leading-relaxed">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white border border-[#c1c8c2] rounded-xl px-5 py-3.5 text-[#1a1c18] text-sm placeholder-[#9ca3a0] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white border border-[#c1c8c2] rounded-xl px-5 py-3.5 text-[#1a1c18] text-sm placeholder-[#9ca3a0] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-4 rounded-xl hover:bg-[#012d1d] transition-colors shadow-[0px_4px_12px_rgba(27,67,50,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
