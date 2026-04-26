import { notFound } from "next/navigation";
import MarketplaceDetailClient from "@/components/marketplace/MarketplaceDetailClient";
import { getMarketplaceListingById } from "@/lib/db/marketplace/listings";
import { getUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, user] = await Promise.all([getMarketplaceListingById(id), getUser()]);

  if (!item) notFound();

  return <MarketplaceDetailClient item={item} isOwner={user?.id === item.sellerId} />;
}
