import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listConversationsQuerySchema } from "@/lib/schemas/community/conversations";
import { conversationRepository } from "@/lib/db/community/conversation-repository";

export async function GET(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = listConversationsQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid query", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const q = parsed.data;
    const limit = q.limit ? Math.min(parseInt(q.limit, 10), 100) : 20;

    const { items, nextCursor } = conversationRepository.listForUser(
      userId,
      q.type,
      limit,
      q.cursor
    );

    return NextResponse.json({
      items,
      page: { next_cursor: nextCursor, limit },
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status: e.status ?? 500 }
    );
  }
}
