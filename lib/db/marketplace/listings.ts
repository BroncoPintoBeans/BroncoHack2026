import { createClient } from "@/lib/supabase/server";

export type MarketplaceListingType = "sale" | "trade" | "free" | "repair";

export interface MarketplaceMedia {
  id: string;
  storagePath: string;
  publicUrl: string | null;
  url: string | null;
  mediaType: "image" | "video";
  sortOrder: number;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  category: string;
  title: string;
  description: string;
  price: number | null;
  condition: string | null;
  status: string;
  listingType: MarketplaceListingType;
  tradeRequest: string | null;
  pickupLocation: string;
  createdAt: string;
  updatedAt: string;
  media: MarketplaceMedia[];
  imageUrl: string | null;
}

export interface MarketplaceListingFilters {
  category?: string;
  condition?: string;
  listingType?: string;
  q?: string;
  status?: string;
  limit?: number;
}

interface MarketplaceMediaRow {
  id: string;
  storage_path: string;
  public_url: string | null;
  media_type: "image" | "video";
  ordinal: number | null;
  sort_order: number | null;
}

interface MarketplaceListingRow {
  id: string;
  seller_id: string;
  category: string;
  title: string;
  description: string | null;
  price: number | null;
  condition: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  listing_type: MarketplaceListingType | null;
  trade_request: string | null;
  pickup_location: string | null;
  marketplace_media: MarketplaceMediaRow[] | null;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const MARKETPLACE_MEDIA_BUCKET = "marketplace-media";
const LISTING_SELECT = `
  id,
  seller_id,
  category,
  title,
  description,
  price,
  condition,
  status,
  created_at,
  updated_at,
  listing_type,
  trade_request,
  pickup_location,
  marketplace_media (
    id,
    storage_path,
    public_url,
    media_type,
    ordinal,
    sort_order
  )
`;

function normalizeListingType(value: MarketplaceListingType | null): MarketplaceListingType {
  return value ?? "sale";
}

function resolveMediaUrl(supabase: SupabaseServerClient, row: MarketplaceMediaRow) {
  const publicUrl = row.public_url?.trim();
  if (publicUrl) return publicUrl;

  const storagePath = row.storage_path?.trim();
  if (!storagePath) return null;

  return supabase.storage.from(MARKETPLACE_MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

function rowToMarketplaceListing(
  supabase: SupabaseServerClient,
  row: MarketplaceListingRow
): MarketplaceListing {
  const media = (row.marketplace_media ?? [])
    .map((item) => ({
      id: item.id,
      storagePath: item.storage_path,
      publicUrl: item.public_url,
      url: resolveMediaUrl(supabase, item),
      mediaType: item.media_type,
      sortOrder: item.sort_order ?? item.ordinal ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    sellerId: row.seller_id,
    category: row.category,
    title: row.title,
    description: row.description ?? "",
    price: row.price,
    condition: row.condition,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    listingType: normalizeListingType(row.listing_type),
    tradeRequest: row.trade_request,
    pickupLocation: row.pickup_location ?? "",
    media,
    imageUrl: media.find((item) => item.mediaType === "image" && item.url)?.url ?? null,
  };
}

function matchesSearch(listing: MarketplaceListing, q: string) {
  const normalized = q.trim().toLowerCase();
  if (!normalized) return true;

  return [
    listing.title,
    listing.description,
    listing.category,
    listing.condition ?? "",
    listing.pickupLocation,
    listing.tradeRequest ?? "",
  ].some((value) => value.toLowerCase().includes(normalized));
}

export async function listMarketplaceListings(filters: MarketplaceListingFilters = {}) {
  const supabase = await createClient();
  const limit = Math.min(filters.limit ?? 100, 100);
  let query = supabase
    .from("marketplace_listings")
    .select(LISTING_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.condition) {
    query = query.eq("condition", filters.condition);
  }
  if (filters.listingType) {
    query = query.eq("listing_type", filters.listingType);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const listings = ((data ?? []) as MarketplaceListingRow[]).map((row) =>
    rowToMarketplaceListing(supabase, row)
  );

  return filters.q ? listings.filter((listing) => matchesSearch(listing, filters.q!)) : listings;
}

export async function getMarketplaceListingById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return rowToMarketplaceListing(supabase, data as MarketplaceListingRow);
}
