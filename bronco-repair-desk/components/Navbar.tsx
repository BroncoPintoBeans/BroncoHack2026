"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/repair/case-84920", label: "Repair Guide" },
  { href: "/rewards", label: "Impact" },
  { href: "/marketplace", label: "Categories" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#f8f9f1] border-b border-[#e5e7eb]">
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-['Manrope',sans-serif] font-bold text-[#1b4332] text-xl tracking-tight">
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
          <Link
            href="/repair/case-84920"
            className="bg-[#1b4332] text-white text-xs font-semibold font-['Work_Sans',sans-serif] tracking-[0.6px] px-4 py-2 rounded-lg hover:bg-[#012d1d] transition-colors"
          >
            Start Repair
          </Link>
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
        </div>
      </div>
    </header>
  );
}
