"use client";

import { useEffect } from "react";
import {
  readSeenAtByConversation,
  writeSeenAtByConversation,
} from "@/lib/community/message-seen";

interface MessagesSeenTrackerProps {
  conversationId: string | null;
  seenAt: string | null;
}

export default function MessagesSeenTracker({
  conversationId,
  seenAt,
}: MessagesSeenTrackerProps) {
  useEffect(() => {
    if (!conversationId || !seenAt) return;

    const current = readSeenAtByConversation();
    const previous = current[conversationId];
    if (previous && previous >= seenAt) return;

    writeSeenAtByConversation({
      ...current,
      [conversationId]: seenAt,
    });
  }, [conversationId, seenAt]);

  return null;
}
