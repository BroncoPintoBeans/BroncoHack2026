import { NextResponse } from "next/server";
import {
  getMarketplaceListingById,
  getMarketplaceSellerSummary,
} from "@/lib/db/marketplace/listings";

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

    const seller = await getMarketplaceSellerSummary(item.sellerId, item.title);

    return NextResponse.json({
      item,
      seller: {
        id: seller.sellerId,
        display_name: seller.displayName,
      },
      seller_products: seller.productTitles,
    });
  } catch (err) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message ?? "internal server error" },
      { status: 500 }
    );
  }
}
