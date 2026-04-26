import { getSupabaseClient, isSupabaseAvailable } from "@/lib/db/client";
import {
  getMarketplaceSellerSummary,
  listMarketplaceListingsBySeller,
  type MarketplaceListing,
} from "@/lib/db/marketplace/listings";
import { createClient } from "@/lib/supabase/server";

type UserRatingRow = {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  order_id: string | null;
  case_id: string | null;
};

type UserProfileRow = {
  id: string;
  display_name: string | null;
};

type MessageInteractionRow = {
  sender_id: string;
  receiver_id: string | null;
};

export type SellerReview = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type SellerOverview = {
  sellerId: string;
  displayName: string;
  productTitles: string[];
  averageRating: number | null;
  totalReviews: number;
};

export type SellerProfileData = SellerOverview & {
  activeListings: MarketplaceListing[];
  reviews: SellerReview[];
  canReview: boolean;
  hasInteraction: boolean;
  existingReview: SellerReview | null;
};

function createSeededRng(seedText: string) {
  let seed = 2166136261;
  for (let idx = 0; idx < seedText.length; idx += 1) {
    seed ^= seedText.charCodeAt(idx);
    seed = Math.imul(seed, 16777619);
  }

  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

function buildMockSellerReviews(sellerId: string): SellerReview[] {
  const rng = createSeededRng(sellerId);
  const reviewerNames = [
    "Jordan",
    "Taylor",
    "Avery",
    "Casey",
    "Morgan",
    "Riley",
    "Sam",
    "Jamie",
    "Drew",
    "Parker",
  ];
  const commentTemplates = [
    "Quick responses and exactly as described.",
    "Easy pickup and super friendly.",
    "Great communication — would buy again.",
    "Item was clean and worked perfectly.",
    "On time and helpful with questions.",
    "Smooth exchange, no issues at all.",
    "Fair price and honest description.",
    "Fast handoff and everything matched the listing.",
    "Very respectful and easy to coordinate with.",
  ];

  const reviewCount = 3 + Math.floor(rng() * 4); // 3..6
  const now = Date.now();

  return Array.from({ length: reviewCount }).map((_, index) => {
    const ratingRoll = rng();
    const rating = ratingRoll < 0.05 ? 3 : ratingRoll < 0.35 ? 4 : 5;
    const includeComment = rng() > 0.15;
    const daysAgo = 2 + Math.floor(rng() * 120);
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: `mock-${sellerId}-${index + 1}`,
      reviewerId: `mock-${index + 1}`,
      reviewerName:
        reviewerNames[Math.floor(rng() * reviewerNames.length)] ?? "Campus buyer",
      rating,
      comment: includeComment
        ? commentTemplates[Math.floor(rng() * commentTemplates.length)] ??
          "Smooth exchange."
        : null,
      createdAt,
    };
  });
}

async function getUserRatingsForSeller(sellerId: string) {
  const supabase = await createClient();
  const baseQuery = supabase
    .from("user_ratings")
    .select(
      "id, reviewer_id, reviewed_user_id, rating, comment, created_at, order_id, case_id"
    )
    .eq("reviewed_user_id", sellerId)
    .is("case_id", null)
    .order("created_at", { ascending: false });

  const { data, error } = await baseQuery;
  if (!error) return (data ?? []) as UserRatingRow[];

  if (!isSupabaseAvailable()) return [];

  const admin = await getSupabaseClient();
  const { data: adminData, error: adminError } = await admin
    .from("user_ratings")
    .select(
      "id, reviewer_id, reviewed_user_id, rating, comment, created_at, order_id, case_id"
    )
    .eq("reviewed_user_id", sellerId)
    .is("case_id", null)
    .order("created_at", { ascending: false });

  if (adminError) throw new Error(adminError.message);
  return (adminData ?? []) as UserRatingRow[];
}

async function getReviewerNames(reviewerIds: string[]) {
  const supabase = await createClient();
  const uniqueReviewerIds = [...new Set(reviewerIds.filter(Boolean))];
  if (uniqueReviewerIds.length === 0) return new Map<string, string>();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, display_name")
    .in("id", uniqueReviewerIds);

  let rows = (data ?? []) as UserProfileRow[];
  if (error && isSupabaseAvailable()) {
    const admin = await getSupabaseClient();
    const { data: adminData, error: adminError } = await admin
      .from("user_profiles")
      .select("id, display_name")
      .in("id", uniqueReviewerIds);
    if (adminError) throw new Error(adminError.message);
    rows = (adminData ?? []) as UserProfileRow[];
  } else if (error) {
    throw new Error(error.message);
  }

  return new Map(
    rows.map((row) => [row.id, row.display_name?.trim() || "Campus buyer"])
  );
}

async function hasSellerInteraction(viewerId: string, sellerId: string) {
  if (viewerId === sellerId) return false;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("sender_id,receiver_id")
    .or(
      `and(sender_id.eq.${viewerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${viewerId})`
    )
    .limit(300);

  if (error) {
    if (!isSupabaseAvailable()) throw new Error(error.message);

    const admin = await getSupabaseClient();
    const { data: adminData, error: adminError } = await admin
      .from("messages")
      .select("sender_id,receiver_id")
      .or(
        `and(sender_id.eq.${viewerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${viewerId})`
      )
      .limit(300);

    if (adminError) throw new Error(adminError.message);
    return hasTwoWayInteraction((adminData ?? []) as MessageInteractionRow[], viewerId, sellerId);
  }

  return hasTwoWayInteraction((data ?? []) as MessageInteractionRow[], viewerId, sellerId);
}

function hasTwoWayInteraction(
  rows: MessageInteractionRow[],
  viewerId: string,
  sellerId: string
) {
  const viewerSent = rows.some(
    (row) => row.sender_id === viewerId && row.receiver_id === sellerId
  );
  const sellerSent = rows.some(
    (row) => row.sender_id === sellerId && row.receiver_id === viewerId
  );

  return viewerSent && sellerSent;
}

function summarizeReviews(
  sellerId: string,
  reviewRows: UserRatingRow[],
  reviewerNames: Map<string, string>
) {
  const reviews: SellerReview[] = reviewRows
    .filter((row) => row.reviewed_user_id === sellerId)
    .map((row) => ({
      id: row.id,
      reviewerId: row.reviewer_id,
      reviewerName: reviewerNames.get(row.reviewer_id) ?? "Campus buyer",
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
    }));

  const hydratedReviews =
    reviews.length === 0 ? buildMockSellerReviews(sellerId) : reviews;
  const totalReviews = hydratedReviews.length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            hydratedReviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          ).toFixed(1)
        )
      : null;

  return {
    reviews: hydratedReviews,
    totalReviews,
    averageRating,
  };
}

export async function getSellerOverview(sellerId: string): Promise<SellerOverview> {
  const seller = await getMarketplaceSellerSummary(sellerId);
  const reviewRows = await getUserRatingsForSeller(sellerId);
  const reviewerNames = await getReviewerNames(reviewRows.map((row) => row.reviewer_id));
  const reviewSummary = summarizeReviews(sellerId, reviewRows, reviewerNames);

  return {
    sellerId,
    displayName: seller.displayName,
    productTitles: seller.productTitles,
    averageRating: reviewSummary.averageRating,
    totalReviews: reviewSummary.totalReviews,
  };
}

export async function getSellerProfileData(
  sellerId: string,
  viewerId?: string | null
): Promise<SellerProfileData> {
  const [seller, activeListings, reviewRows] = await Promise.all([
    getMarketplaceSellerSummary(sellerId),
    listMarketplaceListingsBySeller(sellerId, "active", 12),
    getUserRatingsForSeller(sellerId),
  ]);
  const reviewerNames = await getReviewerNames(reviewRows.map((row) => row.reviewer_id));
  const reviewSummary = summarizeReviews(sellerId, reviewRows, reviewerNames);
  const hasInteraction = viewerId ? await hasSellerInteraction(viewerId, sellerId) : false;
  const existingReview = viewerId
    ? reviewSummary.reviews.find((review) => review.reviewerId === viewerId) ?? null
    : null;

  return {
    sellerId,
    displayName: seller.displayName,
    productTitles: seller.productTitles,
    averageRating: reviewSummary.averageRating,
    totalReviews: reviewSummary.totalReviews,
    activeListings,
    reviews: reviewSummary.reviews,
    canReview: Boolean(viewerId && viewerId !== sellerId && !existingReview),
    hasInteraction,
    existingReview,
  };
}

export async function createSellerReview(input: {
  sellerId: string;
  reviewerId: string;
  rating: number;
  comment?: string | null;
}) {
  const { sellerId, reviewerId, rating, comment } = input;
  if (sellerId === reviewerId) {
    const error = new Error("cannot review your own seller profile") as Error & {
      status?: number;
    };
    error.status = 400;
    throw error;
  }

  const profile = await getSellerProfileData(sellerId, reviewerId);

  if (profile.existingReview) {
    const error = new Error("you already reviewed this seller") as Error & {
      status?: number;
    };
    error.status = 409;
    throw error;
  }

  if (!isSupabaseAvailable()) {
    const error = new Error("reviews are not configured on this environment") as Error & {
      status?: number;
    };
    error.status = 500;
    throw error;
  }

  const admin = await getSupabaseClient();
  const { data, error } = await admin
    .from("user_ratings")
    .insert({
      reviewer_id: reviewerId,
      reviewed_user_id: sellerId,
      rating,
      comment: comment?.trim() || null,
    })
    .select("id, reviewer_id, rating, comment, created_at")
    .single();

  if (error) {
    const nextError = new Error(error.message) as Error & { status?: number };
    nextError.status = 500;
    throw nextError;
  }

  return {
    id: data.id,
    reviewerId: data.reviewer_id,
    reviewerName: "You",
    rating: data.rating,
    comment: data.comment,
    createdAt: data.created_at,
  };
}
