"use client";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";
import { marketplaceCategoryValues } from "@/lib/marketplace/categories";
import { createClient } from "@/lib/supabase/client";

const categories = [...marketplaceCategoryValues];
const conditions = ["New", "Open Box", "Like New", "Excellent", "Good", "Used - Fair", "Needs Repair", "For Parts"];
const mediaLimit = 3;
const maxMediaSize = 10 * 1024 * 1024;
const acceptedMediaTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
const listingTypes = [
  { value: "sale", label: "For Sale", desc: "Set a price and sell", color: "#1b4332" },
  { value: "trade", label: "Trade", desc: "Swap for something else", color: "#7d562d" },
  { value: "free", label: "Free", desc: "Give it away", color: "#012d1d" },
  { value: "repair", label: "Needs Repair", desc: "Sell as-is for parts", color: "#623f18" },
];

type FieldErrors = Partial<Record<"media" | "title" | "category" | "customCategory" | "condition" | "description" | "pickupLocation" | "price" | "tradeRequest", string>>;

function getPublishErrorMessage(error: unknown) {
  const message = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
    ? error.message
    : error instanceof Error
      ? error.message
      : "Something went wrong while publishing this listing.";

  if (message.includes("marketplace_listings") && (message.includes("column") || message.includes("schema cache"))) {
    return "Supabase setup is incomplete: marketplace_listings is missing columns. Run supabase/listing_publish_setup.sql, then try again.";
  }

  if (message.includes("marketplace_media") && (message.includes("column") || message.includes("schema cache"))) {
    return `Supabase marketplace_media schema mismatch: ${message}`;
  }

  if (message.toLowerCase().includes("bucket") || message.includes("marketplace-media")) {
    return "Supabase Storage is missing the marketplace-media bucket or upload policy. Run supabase/listing_publish_setup.sql, then try again.";
  }

  return message;
}

export default function CreateListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState("sale");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [price, setPrice] = useState("");
  const [tradeRequest, setTradeRequest] = useState("");
  const [media, setMedia] = useState<{ file: File; url: string }[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [publishError, setPublishError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [reviewMediaIndex, setReviewMediaIndex] = useState(0);
  const [isMediaExpanded, setIsMediaExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<{ file: File; url: string }[]>([]);
  const isMediaFull = media.length >= mediaLimit;
  const selectedCategory = category === "Other" ? customCategory.trim() : category;
  const selectedListingType = listingTypes.find((listingType) => listingType.value === type);
  const reviewMedia = media[reviewMediaIndex] ?? media[0];
  const reviewPrice = type === "sale" ? `$${price || "0"}` : type === "free" ? "Free" : type === "trade" ? "Trade" : "As-is";

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  const addMedia = (files: FileList | File[]) => {
    setMediaError("");
    setFieldErrors((current) => ({ ...current, media: undefined }));

    const selectedFiles = Array.from(files);
    const validFiles = selectedFiles.filter((file) => {
      if (!acceptedMediaTypes.includes(file.type)) {
        setMediaError("Use JPG, PNG, WEBP, MP4, or MOV files only.");
        return false;
      }

      if (file.size > maxMediaSize) {
        setMediaError("Each file must be 10MB or smaller.");
        return false;
      }

      return true;
    });

    setMedia((current) => {
      const availableSlots = mediaLimit - current.length;

      if (availableSlots <= 0) {
        return current;
      }

      if (validFiles.length > availableSlots) {
        setMediaError(`Only ${availableSlots} more ${availableSlots === 1 ? "file" : "files"} can be added.`);
      }

      const nextFiles = validFiles.slice(0, availableSlots).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

      return [...current, ...nextFiles];
    });
  };

  const removeMedia = (index: number) => {
    const removed = media[index];

    if (!removed) {
      return;
    }

    URL.revokeObjectURL(removed.url);
    setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setReviewMediaIndex((currentIndex) => Math.min(currentIndex, Math.max(media.length - 2, 0)));
    setMediaError("");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addMedia(event.target.files);
      event.target.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isMediaFull) {
      return;
    }
    addMedia(event.dataTransfer.files);
  };

  const validateCurrentStep = () => {
    const errors: FieldErrors = {};

    if (step === 1 && media.length === 0) {
      errors.media = "Add at least one photo or video.";
    }

    if (step === 2) {
      if (!title.trim()) {
        errors.title = "Title needs to be filled out.";
      }

      if (!category) {
        errors.category = "Category needs to be selected.";
      }

      if (category === "Other" && !customCategory.trim()) {
        errors.customCategory = "Custom category needs to be filled out.";
      }

      if (!condition) {
        errors.condition = "Condition needs to be selected.";
      }

      if (!description.trim()) {
        errors.description = "Description needs to be filled out.";
      }

      if (!pickupLocation.trim()) {
        errors.pickupLocation = "Pickup location needs to be filled out.";
      }
    }

    if (step === 3) {
      if (type === "sale" && (!price.trim() || Number(price) <= 0)) {
        errors.price = "Price needs to be filled out.";
      }

      if (type === "trade" && !tradeRequest.trim()) {
        errors.tradeRequest = "Trade request needs to be filled out.";
      }
    }

    return errors;
  };

  const validateAllSteps = () => {
    const errors: FieldErrors = {};

    if (media.length === 0) {
      errors.media = "Add at least one photo or video.";
    }

    if (!title.trim()) {
      errors.title = "Title needs to be filled out.";
    }

    if (!category) {
      errors.category = "Category needs to be selected.";
    }

    if (category === "Other" && !customCategory.trim()) {
      errors.customCategory = "Custom category needs to be filled out.";
    }

    if (!condition) {
      errors.condition = "Condition needs to be selected.";
    }

    if (!description.trim()) {
      errors.description = "Description needs to be filled out.";
    }

    if (!pickupLocation.trim()) {
      errors.pickupLocation = "Pickup location needs to be filled out.";
    }

    if (type === "sale" && (!price.trim() || Number(price) <= 0)) {
      errors.price = "Price needs to be filled out.";
    }

    if (type === "trade" && !tradeRequest.trim()) {
      errors.tradeRequest = "Trade request needs to be filled out.";
    }

    return errors;
  };

  const handleContinue = () => {
    const validationErrors = validateCurrentStep();

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setStep(step + 1);
  };

  const showPreviousMedia = () => {
    setReviewMediaIndex((current) => (current === 0 ? media.length - 1 : current - 1));
  };

  const showNextMedia = () => {
    setReviewMediaIndex((current) => (current === media.length - 1 ? 0 : current + 1));
  };

  const handlePublish = async () => {
    const validationErrors = validateAllSteps();

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setPublishError("Some required information is missing. Go back and fill out the highlighted fields.");
      const firstStepWithError = validationErrors.media ? 1 : validationErrors.title || validationErrors.category || validationErrors.customCategory || validationErrors.condition || validationErrors.description || validationErrors.pickupLocation ? 2 : 3;
      setStep(firstStepWithError);
      return;
    }

    setIsPublishing(true);
    setPublishError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You need to be signed in before publishing a listing.");
      }

      const { data: listing, error: listingError } = await supabase
        .from("marketplace_listings")
        .insert({
          title: title.trim(),
          description: description.trim(),
          category: selectedCategory,
          condition,
          listing_type: type,
          price: type === "sale" ? Number(price) : null,
          trade_request: type === "trade" ? tradeRequest.trim() : null,
          pickup_location: pickupLocation.trim(),
          seller_id: user.id,
          status: "active",
        })
        .select("id")
        .single();

      if (listingError) {
        throw listingError;
      }

      const uploadedMedia = await Promise.all(
        media.map(async (item, index) => {
          const extension = item.file.name.split(".").pop()?.toLowerCase() || (item.file.type.startsWith("video/") ? "mp4" : "jpg");
          const path = `${user.id}/${listing.id}/${index + 1}-${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage.from("marketplace-media").upload(path, item.file, {
            contentType: item.file.type,
            upsert: false,
          });

          if (uploadError) {
            throw uploadError;
          }

          return {
            listing_id: listing.id,
            storage_path: path,
            media_type: item.file.type.startsWith("video/") ? "video" : "image",
          };
        })
      );

      const { error: mediaInsertError } = await supabase.from("marketplace_media").insert(uploadedMedia);

      if (mediaInsertError) {
        throw mediaInsertError;
      }

      router.push(`/marketplace/${listing.id}`);
    } catch (error) {
      console.error("Publish listing failed:", error);
      setPublishError(getPublishErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[860px] mx-auto px-6 py-12">
        <BackButton fallbackHref="/marketplace" label="Back" className="mb-6" />
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px]">Create a Listing</h1>
          <p className="text-[#414844] text-lg mt-1">Help an item find its next home.</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-10">
          {["Media", "Details", "Pricing", "Review"].map((label, i) => {
            const s = i + 1;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${s <= step ? "bg-[#1b4332] text-white" : "bg-[#e2e3db] text-[#717973]"}`}>{s}</div>
                  <span className={`text-sm font-semibold ${s <= step ? "text-[#1b4332]" : "text-[#717973]"}`}>{label}</span>
                </div>
                {i < 3 && <div className={`flex-1 h-0.5 ${s < step ? "bg-[#1b4332]" : "bg-[#e2e3db]"}`} />}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#e2e3db] rounded-2xl shadow-[0px_4px_20px_rgba(27,67,50,0.06)] overflow-hidden">
          {step === 1 && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="font-semibold text-[#1a1c18] text-3xl">Add Media</h2>
              <div
                role="button"
                aria-disabled={isMediaFull}
                tabIndex={isMediaFull ? -1 : 0}
                onClick={() => {
                  if (!isMediaFull) {
                    fileInputRef.current?.click();
                  }
                }}
                onKeyDown={(event) => {
                  if (!isMediaFull && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (!isMediaFull) {
                    setIsDragging(true);
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!isMediaFull) {
                    setIsDragging(true);
                  }
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setIsDragging(false);
                  }
                }}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 transition-colors ${
                  fieldErrors.media
                    ? "border-[#9b2c2c] bg-[#fff2f0] cursor-pointer"
                    : isMediaFull
                    ? "border-[#aab2ab] bg-[#f3f4ec] cursor-not-allowed opacity-80"
                    : isDragging
                      ? "border-[#1b4332] bg-[rgba(27,67,50,0.04)] cursor-pointer"
                      : "border-[#c1c8c2] hover:border-[#1b4332] cursor-pointer"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  multiple
                  disabled={isMediaFull}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isMediaFull ? "bg-[#dde0d8]" : "bg-[#e8e9e1]"}`}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="7" width="22" height="16" rx="3" stroke="#717973" strokeWidth="1.5"/><circle cx="14" cy="15" r="4" stroke="#717973" strokeWidth="1.5"/><path d="M10 7l1.5-3h5L18 7" stroke="#717973" strokeWidth="1.5"/></svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#1a1c18] text-base">
                    {isMediaFull ? "Media limit reached" : "Drop photos or videos here, or click to upload"}
                  </p>
                  <p className="text-[#717973] text-sm mt-1">
                    {isMediaFull ? "Remove a file below to upload something else." : "JPG, PNG, WEBP, MP4, or MOV up to 10MB each. Up to 3 files."}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isMediaFull}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!isMediaFull) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`text-xs font-semibold tracking-[0.6px] px-5 py-2.5 rounded-lg transition-colors ${
                    isMediaFull ? "bg-[#dde0d8] text-[#717973] cursor-not-allowed" : "bg-[#e8e9e1] text-[#1a1c18]"
                  }`}
                >
                  {isMediaFull ? "Limit Reached" : "Choose Files"}
                </button>
              </div>
              {fieldErrors.media && <p className="text-[#9b2c2c] text-sm font-semibold -mt-3">{fieldErrors.media}</p>}
              {mediaError && !isMediaFull && <p className="text-[#9b2c2c] text-sm font-semibold">{mediaError}</p>}
              {media.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {media.map((item, index) => {
                    const isVideo = item.file.type.startsWith("video/");
                    return (
                      <div key={item.url} className="relative border border-[#e2e3db] rounded-xl overflow-hidden bg-[#f3f4ec]">
                        <div className="aspect-[4/3] bg-[#e2e3db]">
                          {isVideo ? (
                            <video src={item.url} controls className="h-full w-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element -- Blob previews come from the local file picker and cannot be optimized by next/image.
                            <img src={item.url} alt={`Selected media ${index + 1}`} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-[#1a1c18] text-xs font-semibold truncate">{item.file.name}</p>
                          <p className="text-[#717973] text-xs mt-0.5">{isVideo ? "Video" : "Photo"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute right-2 top-2 bg-white/95 text-[#1a1c18] border border-[#e2e3db] rounded-full w-8 h-8 flex items-center justify-center text-lg leading-none hover:bg-[#f3f4ec] transition-colors"
                          aria-label={`Remove ${item.file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[#414844] text-sm">Tip: Clear, well-lit media gets more views, and showing damage honestly builds trust.</p>
            </div>
          )}

          {step === 2 && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="font-semibold text-[#1a1c18] text-3xl">Item Details</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Title</label>
                  <input
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setFieldErrors((current) => ({ ...current, title: undefined }));
                    }}
                    className={`w-full border rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332] ${
                      fieldErrors.title ? "border-[#9b2c2c] bg-[#fffafa]" : "border-[#c1c8c2]"
                    }`}
                    placeholder="e.g. Gaming monitor, calculator, laptop charger"
                  />
                  {fieldErrors.title && <p className="text-[#9b2c2c] text-sm font-semibold mt-1.5">{fieldErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setFieldErrors((current) => ({ ...current, category: undefined, customCategory: undefined }));
                        }}
                        className={`border rounded-lg py-2 text-xs font-semibold tracking-[0.6px] transition-colors ${
                          category === cat
                            ? "border-[#1b4332] bg-[#1b4332] text-white"
                            : fieldErrors.category
                              ? "border-[#9b2c2c] text-[#414844] hover:border-[#1b4332] hover:text-[#1b4332]"
                              : "border-[#c1c8c2] text-[#414844] hover:border-[#1b4332] hover:text-[#1b4332]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.category && <p className="text-[#9b2c2c] text-sm font-semibold mt-1.5">{fieldErrors.category}</p>}
                  {category === "Other" && (
                    <>
                      <input
                        value={customCategory}
                        onChange={(event) => {
                          setCustomCategory(event.target.value);
                          setFieldErrors((current) => ({ ...current, customCategory: undefined }));
                        }}
                        className={`mt-3 w-full border rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332] ${
                          fieldErrors.customCategory ? "border-[#9b2c2c] bg-[#fffafa]" : "border-[#c1c8c2]"
                        }`}
                        placeholder="Enter a category name"
                      />
                      {fieldErrors.customCategory && <p className="text-[#9b2c2c] text-sm font-semibold mt-1.5">{fieldErrors.customCategory}</p>}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Condition</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {conditions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCondition(c);
                          setFieldErrors((current) => ({ ...current, condition: undefined }));
                        }}
                        className={`border rounded-lg py-2 text-xs font-semibold tracking-[0.6px] transition-colors ${
                          condition === c
                            ? "border-[#1b4332] bg-[#1b4332] text-white"
                            : fieldErrors.condition
                              ? "border-[#9b2c2c] text-[#414844] hover:border-[#1b4332] hover:text-[#1b4332]"
                              : "border-[#c1c8c2] text-[#414844] hover:border-[#1b4332] hover:text-[#1b4332]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.condition && <p className="text-[#9b2c2c] text-sm font-semibold mt-1.5">{fieldErrors.condition}</p>}
                </div>
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      setFieldErrors((current) => ({ ...current, description: undefined }));
                    }}
                    className={`w-full border rounded-lg px-4 py-3 text-[#414844] text-base outline-none focus:border-[#1b4332] h-28 resize-none ${
                      fieldErrors.description ? "border-[#9b2c2c] bg-[#fffafa]" : "border-[#c1c8c2]"
                    }`}
                    placeholder="Describe the item's condition, any defects, and why you're selling..."
                  />
                  {fieldErrors.description && <p className="text-[#9b2c2c] text-sm font-semibold mt-1.5">{fieldErrors.description}</p>}
                </div>
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Pickup Location</label>
                  <input
                    value={pickupLocation}
                    onChange={(event) => {
                      setPickupLocation(event.target.value);
                      setFieldErrors((current) => ({ ...current, pickupLocation: undefined }));
                    }}
                    className={`w-full border rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332] ${
                      fieldErrors.pickupLocation ? "border-[#9b2c2c] bg-[#fffafa]" : "border-[#c1c8c2]"
                    }`}
                    placeholder="e.g. West Village, Engineering Building lobby..."
                  />
                  {fieldErrors.pickupLocation && <p className="text-[#9b2c2c] text-sm font-semibold mt-1.5">{fieldErrors.pickupLocation}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="font-semibold text-[#1a1c18] text-3xl">Pricing &amp; Type</h2>
              <div>
                <label className="block text-[#1a1c18] text-sm font-semibold mb-3">Listing Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {listingTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setType(t.value);
                        setFieldErrors((current) => ({ ...current, price: undefined, tradeRequest: undefined }));
                      }}
                      className={`border-2 rounded-xl p-4 text-left transition-all ${type === t.value ? "border-[#1b4332] bg-[rgba(27,67,50,0.04)]" : "border-[#e2e3db]"}`}
                    >
                      <p className="font-semibold text-[#1a1c18] text-base">{t.label}</p>
                      <p className="text-[#717973] text-sm mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {type === "sale" && (
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#414844] text-base">$</span>
                    <input
                      type="number"
                      min="1"
                      value={price}
                      onChange={(event) => {
                        setPrice(event.target.value);
                        setFieldErrors((current) => ({ ...current, price: undefined }));
                      }}
                      className={`w-full border rounded-lg pl-8 pr-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332] ${
                        fieldErrors.price ? "border-[#9b2c2c] bg-[#fffafa]" : "border-[#c1c8c2]"
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {fieldErrors.price && <p className="text-[#9b2c2c] text-sm font-semibold mt-1.5">{fieldErrors.price}</p>}
                </div>
              )}
              {type === "trade" && (
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">What are you looking to trade for?</label>
                  <input
                    value={tradeRequest}
                    onChange={(event) => {
                      setTradeRequest(event.target.value);
                      setFieldErrors((current) => ({ ...current, tradeRequest: undefined }));
                    }}
                    className={`w-full border rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332] ${
                      fieldErrors.tradeRequest ? "border-[#9b2c2c] bg-[#fffafa]" : "border-[#c1c8c2]"
                    }`}
                    placeholder="e.g. HDMI cable, keyboard, monitor stand..."
                  />
                  {fieldErrors.tradeRequest && <p className="text-[#9b2c2c] text-sm font-semibold mt-1.5">{fieldErrors.tradeRequest}</p>}
                </div>
              )}
              <div className="bg-[rgba(193,236,212,0.2)] border border-[#c1ecd4] rounded-xl p-4 flex items-start gap-3">
                <svg className="shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#274e3d" strokeWidth="1.5"/><path d="M10 6v4.5M10 13h.01" stroke="#274e3d" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <p className="text-[#274e3d] text-sm leading-relaxed">If your item is damaged, consider using the <Link href="/repair/new" className="font-semibold underline">Repair Verdict</Link> tool first. Items with a repair verdict attached get 2× more interest!</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="font-semibold text-[#1a1c18] text-3xl">Review &amp; Publish</h2>
              <div className="bg-[#f3f4ec] rounded-xl p-5 flex flex-col gap-3">
                <div className="relative w-full h-80 bg-[#1a1c18] rounded-lg flex items-center justify-center overflow-hidden">
                  {reviewMedia ? (
                    reviewMedia.file.type.startsWith("video/") ? (
                      <video src={reviewMedia.url} controls className="h-full w-full object-contain rounded-lg" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- Blob previews come from the local file picker and cannot be optimized by next/image.
                      <img src={reviewMedia.url} alt={`Listing media preview ${reviewMediaIndex + 1}`} className="h-full w-full object-contain rounded-lg" />
                    )
                  ) : (
                    <span className="text-[#717973] text-sm">No media added</span>
                  )}
                  {reviewMedia && (
                    <button
                      type="button"
                      onClick={() => setIsMediaExpanded(true)}
                      className="absolute right-3 top-3 bg-white/95 text-[#1a1c18] border border-[#e2e3db] rounded-full w-9 h-9 flex items-center justify-center text-lg font-semibold hover:bg-[#f3f4ec] transition-colors"
                      aria-label="Expand media"
                    >
                      ⛶
                    </button>
                  )}
                  {media.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPreviousMedia}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 text-[#1a1c18] border border-[#e2e3db] rounded-full w-10 h-10 flex items-center justify-center text-2xl font-semibold hover:bg-[#f3f4ec] transition-colors"
                        aria-label="Show previous media"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={showNextMedia}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 text-[#1a1c18] border border-[#e2e3db] rounded-full w-10 h-10 flex items-center justify-center text-2xl font-semibold hover:bg-[#f3f4ec] transition-colors"
                        aria-label="Show next media"
                      >
                        ›
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 text-[#1a1c18] border border-[#e2e3db] rounded-full px-3 py-1 text-xs font-semibold">
                        {reviewMediaIndex + 1} / {media.length}
                      </div>
                    </>
                  )}
                </div>
                {media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {media.map((item, index) => {
                      const isVideo = item.file.type.startsWith("video/");
                      return (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => setReviewMediaIndex(index)}
                          className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 bg-[#e2e3db] ${
                            reviewMediaIndex === index ? "border-[#1b4332]" : "border-transparent"
                          }`}
                          aria-label={`Show media ${index + 1}`}
                        >
                          {isVideo ? (
                            <video src={item.url} className="h-full w-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element -- Blob previews come from the local file picker and cannot be optimized by next/image.
                            <img src={item.url} alt={`Media thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <h3 className="font-semibold text-[#1a1c18] text-3xl leading-tight">{title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#ffca98] text-[#7a532b] text-sm font-semibold tracking-[0.6px] px-3 py-1 rounded">{selectedCategory}</span>
                  <span className="bg-[#e2e3db] text-[#1a1c18] text-sm font-semibold tracking-[0.6px] px-3 py-1 rounded">{condition}</span>
                  {selectedListingType && <span className="bg-[#c1ecd4] text-[#274e3d] text-sm font-semibold tracking-[0.6px] px-3 py-1 rounded">{selectedListingType.label}</span>}
                </div>
                <p className="text-[#414844] text-lg leading-7">{description}</p>
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#e2e3db]">
                  <span className="font-semibold text-[#012d1d] text-2xl">{reviewPrice}</span>
                  <span className="flex items-center gap-2 text-[#414844] text-sm font-semibold">
                    <svg className="shrink-0" width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                      <path d="M7 1C3.686 1 1 3.686 1 7c0 4.418 6 10 6 10s6-5.582 6-10c0-3.314-2.686-6-6-6z" stroke="#414844" strokeWidth="1.4" />
                      <circle cx="7" cy="7" r="2" stroke="#414844" strokeWidth="1.4" />
                    </svg>
                    <span>Pickup: {pickupLocation}</span>
                  </span>
                </div>
              </div>
              {publishError && (
                <p className="bg-[#fff2f0] border border-[#f0b6ad] text-[#9b2c2c] text-sm font-semibold rounded-lg px-4 py-3">
                  {publishError}
                </p>
              )}
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className={`text-white text-sm font-semibold tracking-[0.6px] py-4 rounded-xl transition-colors ${
                  isPublishing ? "bg-[#717973] cursor-not-allowed" : "bg-[#1b4332] hover:bg-[#012d1d]"
                }`}
              >
                {isPublishing ? "Publishing..." : "Publish Listing"}
              </button>
            </div>
          )}

          {/* Step Controls */}
          <div className="px-8 py-5 border-t border-[#e2e3db] flex justify-between">
            <button
              onClick={() => {
                setFieldErrors({});
                setStep(Math.max(1, step - 1));
              }}
              className={`border border-[#e2e3db] text-[#414844] text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#f3f4ec] transition-colors ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
            >
              Back
            </button>
            {step < 4 ? (
              <button onClick={handleContinue} className="bg-[#1b4332] text-white text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-[#012d1d] transition-colors">
                Continue
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {isMediaExpanded && reviewMedia && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6">
          <div className="relative w-full max-w-6xl h-[82vh] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsMediaExpanded(false)}
              className="absolute right-0 top-0 z-10 bg-white text-[#1a1c18] border border-[#e2e3db] rounded-full w-11 h-11 flex items-center justify-center text-2xl font-semibold hover:bg-[#f3f4ec] transition-colors"
              aria-label="Close expanded media"
            >
              ×
            </button>
            {media.length > 1 && (
              <button
                type="button"
                onClick={showPreviousMedia}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-white text-[#1a1c18] border border-[#e2e3db] rounded-full w-12 h-12 flex items-center justify-center text-3xl font-semibold hover:bg-[#f3f4ec] transition-colors"
                aria-label="Show previous media"
              >
                ‹
              </button>
            )}
            <div className="h-full w-full flex items-center justify-center px-14">
              {reviewMedia.file.type.startsWith("video/") ? (
                <video src={reviewMedia.url} controls className="max-h-full max-w-full rounded-xl bg-black" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- Blob previews come from the local file picker and cannot be optimized by next/image.
                <img src={reviewMedia.url} alt={`Expanded media ${reviewMediaIndex + 1}`} className="max-h-full max-w-full rounded-xl object-contain" />
              )}
            </div>
            {media.length > 1 && (
              <button
                type="button"
                onClick={showNextMedia}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-white text-[#1a1c18] border border-[#e2e3db] rounded-full w-12 h-12 flex items-center justify-center text-3xl font-semibold hover:bg-[#f3f4ec] transition-colors"
                aria-label="Show next media"
              >
                ›
              </button>
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white text-[#1a1c18] border border-[#e2e3db] rounded-full px-4 py-2 text-sm font-semibold">
              {reviewMediaIndex + 1} / {media.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
