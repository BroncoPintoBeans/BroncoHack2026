import { NextResponse } from "next/server";
import { z } from "zod";
import { createSellerReview } from "@/lib/db/marketplace/sellers";
import { requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid review", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const review = await createSellerReview({
      sellerId: id,
      reviewerId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    return NextResponse.json({ review });
  } catch (err) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: error.message ?? "internal server error" },
      { status: error.status ?? 500 }
    );
  }
}
