"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  MESSAGE_SEEN_EVENT,
  readSeenAtByConversation,
} from "@/lib/community/message-seen";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions/auth";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/messages", label: "Chats" },
  { href: "/repair/new", label: "Repair Guide" },
  { href: "/rewards", label: "Impact" },
];

type MessageStatusRow = {
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  created_at: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const refreshUnreadState = useCallback(async (userId: string | null, supabase = createClient()) => {
    if (!userId) {
      setHasUnreadMessages(false);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("conversation_id,sender_id,receiver_id,created_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      setHasUnreadMessages(false);
      return;
    }

    const latestByConversation = new Map<string, MessageStatusRow>();
    for (const row of (data ?? []) as MessageStatusRow[]) {
      if (!row.receiver_id) continue;
      if (!latestByConversation.has(row.conversation_id)) {
        latestByConversation.set(row.conversation_id, row);
      }
    }

    const seenAtByConversation = readSeenAtByConversation();
    const nextHasUnread = [...latestByConversation.values()].some((row) => {
      if (row.sender_id === userId) return false;
      const seenAt = seenAtByConversation[row.conversation_id];
      return !seenAt || seenAt < row.created_at;
    });

    setHasUnreadMessages(nextHasUnread);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      void refreshUnreadState(data.user?.id ?? null, supabase);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void refreshUnreadState(session?.user?.id ?? null, supabase);
    });

    return () => listener.subscription.unsubscribe();
  }, [refreshUnreadState]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`navbar-messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          void refreshUnreadState(user.id, supabase);
        }
      )
      .subscribe();

    const syncUnread = () => {
      void refreshUnreadState(user.id, supabase);
    };

    window.addEventListener("focus", syncUnread);
    window.addEventListener("storage", syncUnread);
    window.addEventListener(MESSAGE_SEEN_EVENT, syncUnread);

    return () => {
      window.removeEventListener("focus", syncUnread);
      window.removeEventListener("storage", syncUnread);
      window.removeEventListener(MESSAGE_SEEN_EVENT, syncUnread);
      void supabase.removeChannel(channel);
    };
  }, [refreshUnreadState, user]);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? null;
  const messagesActive = pathname.startsWith("/messages");

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
          <Link
            href="/messages"
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              messagesActive ? "bg-[#dce7df] text-[#1b4332]" : "hover:bg-[#e2e3db] text-[#1a1c18]"
            }`}
            aria-label="Messages"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4.167 5.833A2.5 2.5 0 0 1 6.667 3.333h6.666a2.5 2.5 0 0 1 2.5 2.5v5.834a2.5 2.5 0 0 1-2.5 2.5H8.56l-3.726 2.41V5.833Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {user && hasUnreadMessages ? (
              <span
                className="absolute right-1.5 top-1.5 inline-flex h-2.5 w-2.5 rounded-full bg-[#ff5a5f]"
                aria-label="Unread messages"
              />
            ) : null}
          </Link>
          <Link
            href="/repair/new"
            className="bg-[#1b4332] text-white text-xs font-semibold font-['Work_Sans',sans-serif] tracking-[0.6px] px-4 py-2 rounded-lg hover:bg-[#012d1d] transition-colors"
          >
            Start Repair
          </Link>
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
