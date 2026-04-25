"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { communityApi } from "@/lib/api/community";
import type { HelperRequestCard, ListHelperRequestsQuery } from "@/lib/types/community";

export function useHelperRequests(query?: ListHelperRequestsQuery, userId?: string) {
  const [items, setItems] = useState<HelperRequestCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(query ?? {}), [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await communityApi.listHelperRequests(query, userId);
      setItems(res.items);
      setNextCursor(res.page.next_cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [queryKey, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { items, loading, error, nextCursor, reload: load };
}
