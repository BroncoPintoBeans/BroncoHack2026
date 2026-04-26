export const marketplaceCategoryValues = [
  "Laptops",
  "Phones",
  "Tablets",
  "Monitors",
  "Gaming",
  "Audio",
  "Appliances",
  "Other",
] as const;

export const marketplaceCategoryLabels = marketplaceCategoryValues.map((value) => ({
  value,
  label: value === "Other" ? "Misc" : value,
}));

export function getMarketplaceCategoryLabel(category: string) {
  const normalized = category.trim().toLowerCase();
  const match = marketplaceCategoryLabels.find((item) => item.value.toLowerCase() === normalized);

  return match?.label ?? "Misc";
}
