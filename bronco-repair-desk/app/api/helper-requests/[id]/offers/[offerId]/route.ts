import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { updateOfferSchema } from "@/lib/schemas/community/helper-requests";
import { respondToOffer } from "@/lib/services/community/helper-offer-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const { id: requestId, offerId } = await params;
    const userId = getCurrentUserId(req);

    const body = await req.json().catch(() => ({}));
    const parsed = updateOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid request", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const result = respondToOffer(requestId, offerId, userId, parsed.data.action);
    return NextResponse.json(result);
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status: e.status ?? 500 }
    );
  }
}
