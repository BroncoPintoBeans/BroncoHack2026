"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const heroImg = "https://www.figma.com/api/mcp/asset/e9af5714-e133-4b76-8ce4-65f1b50a0c81";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
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

  return (
    <div className="min-h-screen bg-[#f3f4ec] flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#1b4332] p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#ffca98] rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 15l4-4m0 0l2-6 6-2-2 6-6 2z" stroke="#7a532a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-white text-lg tracking-[-0.3px]">Bronco Repair Desk</span>
          </div>
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <h1 className="font-bold text-white text-[40px] leading-tight tracking-[-1px]">
            Sustainable Campus Life,<br />Made Practical.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-100">
            Trade items with fellow students or get a repair verdict for your broken essentials. Save money, reduce waste.
          </p>

          <div className="flex flex-col gap-3">
            {[
              { value: "500+", label: "Items Recirculated" },
              { value: "2 Tons", label: "Waste Prevented" },
              { value: "400+", label: "Students on Campus" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-4">
                <span className="font-bold text-[#ffca98] text-xl w-20">{stat.value}</span>
                <span className="text-white/70 text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-white/40 text-xs">© 2024 Bronco Repair Desk</p>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[#1b4332] rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 15l4-4m0 0l2-6 6-2-2 6-6 2z" stroke="#ffca98" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-[#012d1d] text-lg tracking-[-0.3px]">Bronco Repair Desk</span>
        </div>

        <div className="w-full max-w-100 flex flex-col gap-8">
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
              <div className="flex flex-col gap-1">
                <h2 className="font-bold text-[#012d1d] text-[28px] tracking-[-0.6px]">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-[#414844] text-sm">
                  {mode === "signin"
                    ? "Sign in to your Bronco Repair Desk account."
                    : "Join the campus sustainability network."}
                </p>
              </div>

              {/* Tab toggle */}
              <div className="flex bg-[#e8e9e1] rounded-lg p-1 gap-1">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null); }}
                    className={`flex-1 py-2 rounded-md text-xs font-semibold tracking-[0.4px] transition-all ${
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="bg-white border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-sm placeholder-[#9ca3a0] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
                    />
                  </div>
                )}
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
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[#1a1c18] text-xs font-semibold tracking-[0.4px]">Password</label>
                    {mode === "signin" && (
                      <Link href="/auth/forgot" className="text-[#1b4332] text-xs font-semibold hover:underline">Forgot password?</Link>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-white border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-sm placeholder-[#9ca3a0] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-3.5 rounded-lg hover:bg-[#012d1d] transition-colors shadow-[0px_4px_12px_rgba(27,67,50,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Please wait…"
                    : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#c1c8c2]" />
                <span className="text-[#717973] text-xs">or</span>
                <div className="flex-1 h-px bg-[#c1c8c2]" />
              </div>

              {/* Guest link */}
              <Link
                href="/home"
                className="text-center border border-[#c1c8c2] bg-white text-[#1a1c18] text-xs font-semibold tracking-[0.4px] px-6 py-3.5 rounded-lg hover:bg-[#f3f4ec] transition-colors"
              >
                Browse as Guest
              </Link>

              {/* Switch mode */}
              <p className="text-center text-[#717973] text-xs">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
                  className="text-[#1b4332] font-semibold hover:underline"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
