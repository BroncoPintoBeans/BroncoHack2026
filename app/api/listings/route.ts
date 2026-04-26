import { NextRequest, NextResponse } from "next/server";
import { listMarketplaceListings } from "@/lib/db/marketplace/listings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limitParam = Number(searchParams.get("limit") ?? 100);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 100;
    const items = await listMarketplaceListings({
      status: searchParams.get("status") ?? "active",
      category: searchParams.get("category") ?? undefined,
      condition: searchParams.get("condition") ?? undefined,
      listingType: searchParams.get("listing_type") ?? undefined,
      q: searchParams.get("q") ?? searchParams.get("search") ?? undefined,
      limit,
    });

    return NextResponse.json({
      items,
      page: { count: items.length, limit },
    });
  } catch (err) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message ?? "internal server error" },
      { status: 500 }
    );
  }
}
