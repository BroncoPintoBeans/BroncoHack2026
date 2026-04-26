"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
  alwaysUseFallback?: boolean;
}

export default function BackButton({
  fallbackHref = "/home",
  label = "Back",
  className = "",
  alwaysUseFallback = false,
}: BackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (alwaysUseFallback) {
      router.push(fallbackHref);
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className={`inline-flex w-fit items-center gap-2 rounded-lg border border-[#c1c8c2] bg-white px-3 py-2 text-sm font-semibold text-[#1b4332] shadow-[0px_1px_2px_rgba(27,67,50,0.05)] transition-colors hover:bg-[#f3f4ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b4332] ${className}`}
    >
      <span aria-hidden="true">&lt;</span>
      <span>{label}</span>
    </button>
  );
}
