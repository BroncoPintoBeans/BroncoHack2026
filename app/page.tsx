"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const isRecoveryHash = hashParams.get("type") === "recovery" || hashParams.has("access_token");
    const isRecoveryQuery = queryParams.get("type") === "recovery";
    const code = queryParams.get("code");
    const errorCode = queryParams.get("error_code");
    const errorDescription = queryParams.get("error_description");

    if (errorCode === "otp_expired" || errorDescription) {
      setError("Your password reset link has expired. Please request a new one.");
      window.history.replaceState({}, "", "/");
      return;
    }

    if (isRecoveryHash) {
      router.replace(`/reset-password${window.location.hash}`);
      return;
    }

    if (isRecoveryQuery && code) {
      router.replace(`/auth/callback${window.location.search}&next=/reset-password`);
    }
  }, [router]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/home");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSignUpSuccess(true);
      }
    }

    setLoading(false);
  }

  async function handleForgotPassword() {
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your campus email first, then request a password reset.");
      return;
    }

    setResetLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setNotice(`Password reset instructions were sent to ${trimmedEmail}.`);
    }

    setResetLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f3f4ec] flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#173f30] p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-[#f3f4ec] shadow-[0px_16px_36px_rgba(1,45,29,0.24)] overflow-hidden flex items-center justify-center">
              <img src="/bronco-login-icon.png" alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold text-white text-2xl tracking-[-0.4px]">Bronco Repair Desk</span>
          </div>
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <h1 className="font-bold text-white text-[38px] leading-tight tracking-[-0.8px] drop-shadow-[0px_2px_8px_rgba(0,0,0,0.18)]">
            Keep Campus Gear<br />In Use Longer.
          </h1>
          <p className="text-white/90 text-base leading-relaxed max-w-100">
            Bronco Repair Desk helps students repair, reuse, trade, and responsibly route items before they become waste.
          </p>

          <div className="flex flex-col gap-4 pt-1">
            {[
              { label: "Repair first", body: "Diagnose issues before replacing usable items." },
              { label: "Recirculate value", body: "Move working gear back through the campus community." },
              { label: "Reduce landfill waste", body: "Give electronics and essentials a clearer next step." },
            ].map((principle) => (
              <div key={principle.label} className="flex items-start gap-4">
                <span className="mt-1.5 h-3 w-3 rounded-full bg-[#ffca98] shadow-[0px_0px_0px_5px_rgba(255,202,152,0.12)]" />
                <div>
                  <p className="font-bold text-[#ffca98] text-xs tracking-[0.5px] uppercase">{principle.label}</p>
                  <p className="text-white/82 text-sm leading-relaxed">{principle.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-white/40 text-xs">© 2026 Bronco Repair Desk</p>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-14 py-20">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[#1b4332] rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 15l4-4m0 0l2-6 6-2-2 6-6 2z" stroke="#ffca98" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-[#012d1d] text-lg tracking-[-0.3px]">Bronco Repair Desk</span>
        </div>

        <div className="w-full max-w-[480px] flex flex-col gap-10">
          {signUpSuccess ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="w-16 h-16 bg-[#c1ecd4] rounded-full flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" stroke="#274e3d" strokeWidth="1.5"/>
                  <path d="M8 14l4 4 8-8" stroke="#274e3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-bold text-[#012d1d] text-2xl tracking-[-0.5px]">Check your email</h2>
              <p className="text-[#414844] text-sm leading-relaxed">
                We sent a confirmation link to <span className="font-semibold text-[#1a1c18]">{email}</span>. Click it to activate your account.
              </p>
              <button
                onClick={() => { setSignUpSuccess(false); setMode("signin"); }}
                className="text-[#1b4332] text-xs font-semibold hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="flex flex-col gap-3">
                <h2 className="font-bold text-[#012d1d] text-[30px] leading-tight tracking-[-0.6px]">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-[#414844] text-sm leading-relaxed">
                  {mode === "signin"
                    ? "Sign in to your Bronco Repair Desk account."
                    : "Join the campus sustainability network."}
                </p>
              </div>

              {/* Tab toggle */}
              <div className="flex bg-[#e8e9e1] rounded-xl p-1.5 gap-1.5">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null); setNotice(null); }}
                    className={`flex-1 py-3 rounded-lg text-xs font-semibold tracking-[0.4px] transition-all ${
                      mode === m
                        ? "bg-white text-[#012d1d] shadow-sm"
                        : "text-[#717973] hover:text-[#414844]"
                    }`}
                  >
                    {m === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Error banner */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                    <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/>
                    <path d="M8 5v3M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-red-700 text-xs leading-relaxed">{error}</p>
                </div>
              )}

              {notice && (
                <div className="bg-[#edf8f1] border border-[#b6dec6] rounded-lg px-4 py-3 flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                    <circle cx="8" cy="8" r="7" stroke="#1b4332" strokeWidth="1.5"/>
                    <path d="M4.75 8.1l2.1 2.1 4.4-4.4" stroke="#1b4332" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-[#1b4332] text-xs leading-relaxed">{notice}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {mode === "signup" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="bg-white border border-[#c1c8c2] rounded-xl px-5 py-3.5 text-[#1a1c18] text-sm placeholder-[#9ca3a0] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">Campus Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    required
                    className="bg-white border border-[#c1c8c2] rounded-xl px-5 py-3.5 text-[#1a1c18] text-sm placeholder-[#9ca3a0] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={resetLoading}
                        className="text-[#1b4332] text-xs font-semibold hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {resetLoading ? "Sending..." : "Forgot password?"}
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-white border border-[#c1c8c2] rounded-xl px-5 py-3.5 text-[#1a1c18] text-sm placeholder-[#9ca3a0] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-4 rounded-xl hover:bg-[#012d1d] transition-colors shadow-[0px_4px_12px_rgba(27,67,50,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Please wait…"
                    : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </button>
              </form>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
