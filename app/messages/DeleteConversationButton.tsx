"use client";

import { useId, useRef, useState } from "react";

export default function DeleteConversationButton({
  conversationId,
  conversationName,
  action,
}: {
  conversationId: string;
  conversationName: string;
  action: (formData: FormData) => void;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <button
        type="button"
        disabled={submitting}
        className="shrink-0 rounded-md p-1 text-red-700 hover:bg-red-50 disabled:opacity-60"
        aria-label={`Delete chat with ${conversationName}`}
        title={submitting ? "Deleting..." : "Delete chat"}
        onClick={() => {
          if (submitting) return;
          setConfirmOpen(true);
          queueMicrotask(() => confirmButtonRef.current?.focus());
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 11v6M14 11v6M4 7h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 7l1 14h10l1-14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClick={() => {
            if (submitting) return;
            setConfirmOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !submitting) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e2e3db] bg-white p-5 shadow-[0px_12px_40px_0px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id={titleId} className="text-base font-semibold text-[#1a1c18]">
              Delete chat?
            </h3>
            <p id={descriptionId} className="mt-2 text-sm text-[#717973]">
              Are you sure you want to delete your chat with{" "}
              <span className="font-semibold text-[#1a1c18]">{conversationName}</span>
              ? This can’t be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                className="rounded-lg border border-[#e2e3db] bg-white px-4 py-2 text-sm font-semibold text-[#1a1c18] hover:bg-[#f3f4ec] disabled:opacity-60"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                disabled={submitting}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                onClick={() => {
                  if (submitting) return;
                  setSubmitting(true);
                  formRef.current?.requestSubmit();
                }}
              >
                {submitting ? "Deleting..." : "Delete chat"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

