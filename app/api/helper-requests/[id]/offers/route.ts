import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { createOfferSchema } from "@/lib/schemas/community/helper-requests";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { createOffer } from "@/lib/services/community/helper-offer-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const userId = getCurrentUserId(req);

    const request = helperRequestRepository.findById(requestId);
    if (!request) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (request.user_id === userId) {
      return NextResponse.json(
        { error: "owner cannot offer on own request" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid request", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const result = createOffer(requestId, userId, parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status: e.status ?? 500 }
    );
  }
}
