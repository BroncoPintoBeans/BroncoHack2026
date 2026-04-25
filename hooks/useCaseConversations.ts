"use client";
import { useState, useEffect, useCallback } from "react";
import { communityApi } from "@/lib/api/community";
import type { ConversationSummary, MessageDTO, SendMessageBody } from "@/lib/types/community";

export function useCaseConversation(conversationId: string | null, userId?: string) {
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await communityApi.getMessages(conversationId, undefined, userId);
      setConversation(res.conversation);
      setMessages(res.messages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const send = useCallback(
    async (body: SendMessageBody["body"]) => {
      if (!conversationId) return;
      const res = await communityApi.sendMessage(conversationId, { body }, userId);
      setMessages((prev) => [...prev, res.message]);
      return res.message;
    },
    [conversationId, userId]
  );

  return { conversation, messages, loading, error, reload: load, send };
}
