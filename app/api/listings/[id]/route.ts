import { NextResponse } from "next/server";
import { getMarketplaceListingById } from "@/lib/db/marketplace/listings";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getMarketplaceListingById(id);

    if (!item) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message ?? "internal server error" },
      { status: 500 }
    );
  }
}
