"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions/auth";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/repair/case-84920", label: "Repair Guide" },
  { href: "/rewards", label: "Impact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? null;

  return (
    <header className="sticky top-0 z-50 bg-[#f8f9f1] border-b border-[#e5e7eb]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/home" className="font-['Manrope',sans-serif] font-bold text-[#1b4332] text-xl tracking-tight">
            Bronco Repair Desk
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href) && link.label !== "Categories");
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-2 py-1 text-sm font-['Manrope',sans-serif] tracking-tight transition-colors ${
                    isActive
                      ? "font-bold text-[#1b4332] border-b-2 border-[#1b4332] pb-1.5"
                      : "font-medium text-[#4b5563] hover:text-[#1b4332]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#e2e3db] transition-colors"
              >
                <div className="w-7 h-7 bg-[#1b4332] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {displayName?.[0]?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="text-[#1a1c18] text-xs font-semibold hidden sm:block">{displayName}</span>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-[#717973] text-xs font-semibold hover:text-[#1a1c18] transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="p-2 rounded-full hover:bg-[#e2e3db] transition-colors"
              aria-label="Account"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="#1a1c18" strokeWidth="1.5" />
                <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#1a1c18" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
