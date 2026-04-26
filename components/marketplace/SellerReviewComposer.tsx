"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SellerReviewComposer({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/sellers/${sellerId}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save review");
      }

      setComment("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
              rating === value
                ? "border-[#1b4332] bg-[#1b4332] text-white"
                : "border-[#d7dbd1] bg-white text-[#1a1c18] hover:bg-[#f3f4ec]"
            }`}
            aria-label={`Set rating to ${value}`}
          >
            {value}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-[#d7dbd1] bg-white px-4 py-3 text-sm text-[#1a1c18] outline-none"
        placeholder="Share what the interaction was like."
      />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className={`w-fit rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          submitting
            ? "bg-[#d7dbd1] text-white"
            : "bg-[#1b4332] text-white hover:bg-[#012d1d]"
        }`}
      >
        {submitting ? "Posting..." : "Post Review"}
      </button>
    </form>
  );
}
