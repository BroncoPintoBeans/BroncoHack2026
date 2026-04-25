import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listHelperRequestsQuerySchema } from "@/lib/schemas/community/helper-requests";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";

export async function GET(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = listHelperRequestsQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid query", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const q = parsed.data;
    const limit = q.limit ? Math.min(parseInt(q.limit, 10), 100) : 20;

    const { items, nextCursor } = helperRequestRepository.list({
      status: q.status,
      category: q.category,
      urgency: q.urgency,
      campus_area: q.campus_area,
      skill: q.skill,
      q: q.q,
      mine: q.mine,
      userId,
      limit,
      cursor: q.cursor,
    });

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
