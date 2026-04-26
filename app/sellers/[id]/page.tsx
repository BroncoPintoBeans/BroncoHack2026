import Link from "next/link";
import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";
import SellerReviewComposer from "@/components/marketplace/SellerReviewComposer";
import { getSellerProfileData } from "@/lib/db/marketplace/sellers";
import { getUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function summarizeProductTitles(productTitles: string[]) {
  if (productTitles.length === 0) return "No active products";
  if (productTitles.length <= 3) return productTitles.join(", ");
  return `${productTitles.slice(0, 3).join(", ")} +${productTitles.length - 3} more`;
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  const profile = await getSellerProfileData(id, user?.id);

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <main className="mx-auto flex max-w-[1180px] flex-col gap-6 px-6 py-10">
        <BackButton fallbackHref="/marketplace" label="Back to Marketplace" />

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-[#e2e3db] bg-white p-6 shadow-[0px_4px_20px_0px_rgba(27,67,50,0.06)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1b4332] text-xl font-bold text-white">
              {profile.displayName[0]?.toUpperCase() ?? "S"}
            </div>
            <h1 className="mt-4 text-[28px] font-bold tracking-tight text-[#1a1c18]">
              {profile.displayName}
            </h1>
            <p className="mt-2 text-sm text-[#414844]">
              {profile.averageRating
                ? `${profile.averageRating.toFixed(1)} average rating`
                : "No ratings yet"}
            </p>
            <p className="mt-1 text-sm text-[#717973]">
              {profile.totalReviews} {profile.totalReviews === 1 ? "review" : "reviews"}
            </p>
            <div className="mt-5 rounded-xl border border-[#e2e3db] bg-[#f9faf2] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#717973]">
                Products
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#414844]">
                {summarizeProductTitles(profile.productTitles)}
              </p>
            </div>

            {user?.id && user.id !== profile.sellerId ? (
              <div className="mt-6 rounded-xl border border-[#e2e3db] bg-[#f9faf2] p-4">
                {profile.canReview ? (
                  <>
                    <p className="mb-3 text-sm font-semibold text-[#1a1c18]">
                      Leave a seller review
                    </p>
                    <SellerReviewComposer sellerId={profile.sellerId} />
                  </>
                ) : profile.existingReview ? (
                  <>
                    <p className="text-sm font-semibold text-[#1a1c18]">
                      You already reviewed this seller
                    </p>
                    <p className="mt-2 text-sm text-[#717973]">
                      Thanks for leaving feedback after your exchange.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#1a1c18]">
                      Reviews unlock after a real exchange
                    </p>
                    <p className="mt-2 text-sm text-[#717973]">
                      Once both of you have messaged each other, you can post a seller review here.
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-[#e2e3db] bg-white p-6 shadow-[0px_4px_20px_0px_rgba(27,67,50,0.06)]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#1a1c18]">Active listings</h2>
                  <p className="text-sm text-[#717973]">
                    Current products posted by this seller.
                  </p>
                </div>
              </div>

              {profile.activeListings.length === 0 ? (
                <p className="text-sm text-[#717973]">No active listings right now.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {profile.activeListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/marketplace/${listing.id}`}
                      className="rounded-xl border border-[#e2e3db] bg-[#f9faf2] p-4 transition-colors hover:bg-[#f3f4ec]"
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#e2e3db]">
                        {listing.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-[#717973]">
                            No photo
                          </div>
                        )}
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm font-semibold text-[#1a1c18]">
                        {listing.title}
                      </p>
                      <p className="mt-1 text-xs text-[#717973]">
                        {listing.price !== null ? `$${listing.price}` : "Price TBD"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#e2e3db] bg-white p-6 shadow-[0px_4px_20px_0px_rgba(27,67,50,0.06)]">
              <h2 className="text-xl font-semibold text-[#1a1c18]">Ratings and reviews</h2>
              <p className="mt-1 text-sm text-[#717973]">
                Feedback from buyers who have interacted with this seller.
              </p>

              {profile.reviews.length === 0 ? (
                <p className="mt-5 text-sm text-[#717973]">No reviews yet.</p>
              ) : (
                <div className="mt-5 flex flex-col gap-4">
                  {profile.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-xl border border-[#e2e3db] bg-[#f9faf2] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#1a1c18]">
                            {review.reviewerName}
                          </p>
                          <p className="mt-1 text-sm text-[#1b4332]">
                            {renderStars(review.rating)}
                          </p>
                        </div>
                        <p className="text-xs text-[#717973]">
                          {formatReviewDate(review.createdAt)}
                        </p>
                      </div>
                      {review.comment ? (
                        <p className="mt-3 text-sm leading-relaxed text-[#414844]">
                          {review.comment}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
