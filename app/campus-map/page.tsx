import Navbar from "@/components/Navbar";
import CampusMapClient from "@/components/campus-map/CampusMapClient";
import {
  CAMPUS_LOCATIONS,
  type CampusLocationId,
  isCampusLocationId,
} from "@/lib/campus/locations";

const DEFAULT_LOCATION_ID = "marketplace-exchange-public-meetup" satisfies CampusLocationId;

type CampusMapSearchParams = Promise<{
  location?: string | string[] | undefined;
  q?: string | string[] | undefined;
}>;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function CampusMapPage({
  searchParams,
}: {
  searchParams: CampusMapSearchParams;
}) {
  const params = await searchParams;
  const locationParam = firstParam(params.location).trim();
  const initialQuery = firstParam(params.q).trim();
  const initialLocationId = isCampusLocationId(locationParam)
    ? locationParam
    : DEFAULT_LOCATION_ID;

  return (
    <div className="min-h-screen bg-[#f8f9f1] text-[#1a1c18]">
      <Navbar />
      <CampusMapClient
        locations={CAMPUS_LOCATIONS}
        initialLocationId={initialLocationId}
        initialQuery={initialQuery}
        unknownLocationParam={
          locationParam && !isCampusLocationId(locationParam) ? locationParam : null
        }
      />
    </div>
  );
}
