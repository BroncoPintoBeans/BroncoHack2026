import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { createConversationSchema } from "@/lib/schemas/community/conversations";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { createOrResumeConversation } from "@/lib/services/community/conversation-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: helperRequestId } = await params;
    const userId = getCurrentUserId(req);

    const request = helperRequestRepository.findById(helperRequestId);
    if (!request) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid request", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const offerId = parsed.data.offer_id ?? request.accepted_offer_id;
    if (!offerId) {
      return NextResponse.json(
        { error: "no offer_id provided and no accepted offer on request" },
        { status: 422 }
      );
    }

    const conversation = createOrResumeConversation(
      helperRequestId,
      offerId,
      userId,
      parsed.data.initial_message
    );

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status: e.status ?? 500 }
    );
  }
}
