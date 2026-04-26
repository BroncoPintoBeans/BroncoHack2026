import MarketplaceGridClient from "@/components/marketplace/MarketplaceGridClient";
import { listMarketplaceListings } from "@/lib/db/marketplace/listings";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const items = await listMarketplaceListings({ status: "active" });

  return <MarketplaceGridClient initialItems={items} />;
}
