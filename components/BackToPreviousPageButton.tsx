"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export default function BackToPreviousPageButton() {
  const router = useRouter();

  function handleBack(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    router.push("/home");
  }

  return (
    <Link
      href="/home"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-[#1b4332] text-sm font-semibold tracking-[0.4px] hover:underline"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back to Previous Page
    </Link>
  );
}
