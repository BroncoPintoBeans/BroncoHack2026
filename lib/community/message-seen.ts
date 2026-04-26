const MESSAGE_SEEN_STORAGE_KEY = "marketplace_message_seen_at_by_conversation";

export const MESSAGE_SEEN_EVENT = "marketplace-message-seen";

export type SeenAtByConversation = Record<string, string>;

export function readSeenAtByConversation(): SeenAtByConversation {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(MESSAGE_SEEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeSeenAtByConversation(next: SeenAtByConversation) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(MESSAGE_SEEN_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }

  window.dispatchEvent(new Event(MESSAGE_SEEN_EVENT));
}
