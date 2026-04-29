import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";
import { getMarketplaceListingById } from "@/lib/db/marketplace/listings";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const categories = ["Laptops", "Phones", "Tablets", "Monitors", "Gaming", "Audio", "Appliances", "Bike", "Other"];
const conditions = ["New", "Open Box", "Like New", "Excellent", "Good", "Used - Fair", "Needs Repair", "For Parts"];
const listingTypes = [
  { value: "sale", label: "For Sale" },
  { value: "trade", label: "Trade" },
  { value: "free", label: "Free" },
  { value: "repair", label: "Needs Repair" },
];

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function priceValue(formData: FormData, listingType: string) {
  if (listingType !== "sale") return null;

  const price = Number(stringValue(formData, "price"));
  return Number.isFinite(price) && price > 0 ? Math.round(price) : null;
}

function getFileExtension(filename: string, fallback = "jpg") {
  const ext = filename.split(".").pop()?.trim().toLowerCase();
  return ext || fallback;
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, user] = await Promise.all([getMarketplaceListingById(id), requireUser()]);

  if (!item) notFound();
  if (item.sellerId !== user.id) redirect(`/marketplace/${id}`);
  const draftNeedsImage =
    item.status === "draft" && !item.media.some((media) => media.mediaType === "image");

  const categoryOptions = categories.includes(item.category) ? categories : [item.category, ...categories];

  async function updateListing(formData: FormData) {
    "use server";

    const user = await requireUser();
    const listing = await getMarketplaceListingById(id);

    if (!listing) notFound();
    if (listing.sellerId !== user.id) redirect(`/marketplace/${id}`);

    const listingType = stringValue(formData, "listingType");
    const intent = stringValue(formData, "intent");
    const isPublishIntent = intent === "publish";
    const price = priceValue(formData, listingType);
    const maybeImage = formData.get("listingImage");
    const uploadedImage = maybeImage instanceof File && maybeImage.size > 0 ? maybeImage : null;
    const hasExistingImage = listing.media.some((media) => media.mediaType === "image");

    if (isPublishIntent && !hasExistingImage && !uploadedImage) {
      throw new Error("Add at least one image before publishing this listing.");
    }

    const payload = {
      title: stringValue(formData, "title"),
      description: stringValue(formData, "description"),
      category: stringValue(formData, "category"),
      condition: stringValue(formData, "condition") || null,
      listing_type: listingType,
      price,
      trade_request: listingType === "trade" ? stringValue(formData, "tradeRequest") || null : null,
      pickup_location: stringValue(formData, "pickupLocation"),
      status: isPublishIntent ? "active" : listing.status,
      updated_at: new Date().toISOString(),
    };

    const supabase = await createClient();
    const { error } = await supabase
      .from("marketplace_listings")
      .update(payload)
      .eq("id", id)
      .eq("seller_id", user.id);

    if (error) throw new Error(error.message);

    if (uploadedImage) {
      const extension = getFileExtension(uploadedImage.name);
      const path = `${user.id}/${id}/edit-${crypto.randomUUID()}.${extension}`;
      const uploadBuffer = Buffer.from(await uploadedImage.arrayBuffer());
      const mediaType = uploadedImage.type.startsWith("video/") ? "video" : "image";

      const { error: uploadError } = await supabase.storage
        .from("marketplace-media")
        .upload(path, uploadBuffer, {
          contentType: uploadedImage.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { error: mediaInsertError } = await supabase.from("marketplace_media").insert({
        listing_id: id,
        storage_path: path,
        media_type: mediaType,
      });

      if (mediaInsertError) throw new Error(mediaInsertError.message);
    }

    revalidatePath("/marketplace");
    revalidatePath(`/marketplace/${id}`);
    revalidatePath(`/marketplace/${id}/edit`);
    redirect(`/marketplace/${id}`);
  }

  async function deleteDraft() {
    "use server";

    const user = await requireUser();
    const listing = await getMarketplaceListingById(id);

    if (!listing) notFound();
    if (listing.sellerId !== user.id) redirect(`/marketplace/${id}`);
    if (listing.status !== "draft") {
      throw new Error("Only draft listings can be deleted.");
    }

    const supabase = await createClient();

    const mediaPaths = listing.media
      .map((media) => media.storagePath?.trim())
      .filter((path): path is string => Boolean(path));

    if (mediaPaths.length > 0) {
      const { error: removeStorageError } = await supabase
        .storage
        .from("marketplace-media")
        .remove(mediaPaths);

      if (removeStorageError) throw new Error(removeStorageError.message);
    }

    const { error: mediaDeleteError } = await supabase
      .from("marketplace_media")
      .delete()
      .eq("listing_id", id);

    if (mediaDeleteError) throw new Error(mediaDeleteError.message);

    const { error: listingDeleteError } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", id)
      .eq("seller_id", user.id)
      .eq("status", "draft");

    if (listingDeleteError) throw new Error(listingDeleteError.message);

    revalidatePath("/marketplace");
    revalidatePath(`/marketplace/${id}`);
    revalidatePath(`/marketplace/${id}/edit`);
    redirect("/marketplace");
  }

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <main className="max-w-[860px] mx-auto px-6 py-12">
        <BackButton fallbackHref={`/marketplace/${item.id}`} label="Back to Listing" className="mb-6" />
        <div className="mb-8">
          <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px]">Edit Listing</h1>
          <p className="text-[#414844] text-lg mt-1">Update the details buyers see on your post.</p>
        </div>

        <form action={updateListing} className="bg-white border border-[#e2e3db] rounded-2xl shadow-[0px_4px_20px_rgba(27,67,50,0.06)] p-8 flex flex-col gap-6">
          {draftNeedsImage ? (
            <div className="rounded-xl border border-[#f0b6ad] bg-[#fff2f0] p-4 text-sm text-[#9b2c2c]">
              You can save this draft without an image, but an image is required to publish.
            </div>
          ) : null}
          <div>
            <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="title">Title</label>
            <input id="title" name="title" required defaultValue={item.title} className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="category">Category</label>
              <select id="category" name="category" defaultValue={item.category} className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332] bg-white">
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="condition">Condition</label>
              <select id="condition" name="condition" defaultValue={item.condition ?? "Good"} className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332] bg-white">
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="description">Description</label>
            <textarea id="description" name="description" required defaultValue={item.description} className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#414844] text-base outline-none focus:border-[#1b4332] h-32 resize-none" />
          </div>

          <div>
            <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="pickupLocation">Pickup Location</label>
            <input id="pickupLocation" name="pickupLocation" required defaultValue={item.pickupLocation} className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="listingType">Listing Type</label>
              <select id="listingType" name="listingType" defaultValue={item.listingType} className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332] bg-white">
                {listingTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="price">Sale Price</label>
              <input id="price" name="price" type="number" min="1" defaultValue={item.price ?? ""} className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332]" />
            </div>
            <div>
              <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="tradeRequest">Trade Request</label>
              <input id="tradeRequest" name="tradeRequest" defaultValue={item.tradeRequest ?? ""} className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332]" />
            </div>
          </div>

          <div>
            <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5" htmlFor="listingImage">
              Add or Replace Image
            </label>
            <input
              id="listingImage"
              name="listingImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-sm outline-none focus:border-[#1b4332] bg-white"
            />
            <p className="text-[#717973] text-xs mt-1.5">
              {draftNeedsImage
                ? "Image is optional for draft saves, but required to publish."
                : "Optional: upload an image to add/update listing media."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {item.status === "draft" ? (
              <>
                <button
                  type="submit"
                  name="intent"
                  value="save"
                  className="border border-[#e2e3db] text-[#1a1c18] text-sm font-semibold tracking-[0.6px] px-6 py-4 rounded-xl text-center hover:bg-[#f3f4ec] transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="publish"
                  className="bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] px-6 py-4 rounded-xl hover:bg-[#012d1d] transition-colors"
                >
                  Publish Listing
                </button>
              </>
            ) : (
              <button type="submit" className="bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] px-6 py-4 rounded-xl hover:bg-[#012d1d] transition-colors">
                Save Changes
              </button>
            )}
            <Link href={`/marketplace/${item.id}`} className="border border-[#e2e3db] text-[#1a1c18] text-sm font-semibold tracking-[0.6px] px-6 py-4 rounded-xl text-center hover:bg-[#f3f4ec] transition-colors">
              Cancel
            </Link>
          </div>
          {item.status === "draft" ? (
            <div className="pt-1">
              <button
                type="submit"
                formAction={deleteDraft}
                className="text-[#991b1b] text-sm font-semibold tracking-[0.4px] hover:text-[#7f1d1d] transition-colors"
              >
                Delete Draft
              </button>
            </div>
          ) : null}
        </form>
      </main>
    </div>
  );
}
