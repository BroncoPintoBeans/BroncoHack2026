"use client";

import { useMemo, useState } from "react";
import Concept3DMapPanel from "@/components/campus-map/Concept3DMapPanel";
import DirectionsPanel from "@/components/campus-map/DirectionsPanel";
import LocationList from "@/components/campus-map/LocationList";
import {
  CPP_CONCEPT3D_BASE_URL,
  buildTextMapFallback,
} from "@/lib/campus/concept3d";
import {
  type CampusLocation,
  type CampusLocationId,
  getCampusLocation,
} from "@/lib/campus/locations";

interface CampusMapClientProps {
  locations: readonly CampusLocation[];
  initialLocationId: CampusLocationId;
  initialQuery: string;
  unknownLocationParam: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  pickup_zone: "Pickup zone",
  shuttle_stop: "Shuttle stop",
  map_landmark: "Map landmark",
  repair_destination: "Repair",
  reuse_destination: "Reuse",
  parts_destination: "Parts",
  meetup_zone: "Meetup",
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function getSearchText(location: CampusLocation): string {
  return [
    location.id,
    location.name,
    location.campusArea,
    location.directions,
    location.accessibilityNote,
    ...location.types,
  ]
    .join(" ")
    .toLowerCase();
}

function getBestTextMatch(
  locations: readonly CampusLocation[],
  query: string,
): CampusLocation | null {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return null;
  }

  const exactName = locations.find(
    (location) => location.name.toLowerCase() === normalizedQuery,
  );

  if (exactName) {
    return exactName;
  }

  const exactId = locations.find((location) => location.id === normalizedQuery);

  if (exactId) {
    return exactId;
  }

  return (
    locations.find((location) => getSearchText(location).includes(normalizedQuery)) ??
    null
  );
}

function filterLocations(
  locations: readonly CampusLocation[],
  query: string,
): readonly CampusLocation[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return locations;
  }

  return locations.filter((location) =>
    getSearchText(location).includes(normalizedQuery),
  );
}

export default function CampusMapClient({
  locations,
  initialLocationId,
  initialQuery,
  unknownLocationParam,
}: CampusMapClientProps) {
  const initialSelectedLocation = useMemo(() => {
    return getBestTextMatch(locations, initialQuery) ?? getCampusLocation(initialLocationId);
  }, [initialLocationId, initialQuery, locations]);
  const [searchText, setSearchText] = useState(initialQuery);
  const [selectedLocationId, setSelectedLocationId] = useState<CampusLocationId>(
    initialSelectedLocation?.id ?? initialLocationId,
  );

  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ??
    locations[0];
  const filteredLocations = useMemo(
    () => filterLocations(locations, searchText),
    [locations, searchText],
  );
  const hasSearchText = normalizeSearchText(searchText).length > 0;
  const hasNoResults = hasSearchText && filteredLocations.length === 0;
  const typeLabels = selectedLocation.types
    .map((type) => TYPE_LABELS[type] ?? type.replace(/_/g, " "))
    .join(" / ");

  function handleSearchChange(value: string) {
    setSearchText(value);

    const nextMatch = getBestTextMatch(locations, value);
    if (nextMatch) {
      setSelectedLocationId(nextMatch.id);
    }
  }

  function handleClearSearch() {
    setSearchText("");
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-2 border-b border-[#d9ded4] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6f5a22]">
          Campus Exchange Guide
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-['Manrope',sans-serif] text-3xl font-bold tracking-tight text-[#16372a] sm:text-4xl">
              Campus Map
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">
              Choose a public campus reference point for Marketplace exchanges,
              repair routing, reuse destinations, or the V1 shuttle advisory.
            </p>
          </div>
          <a
            href={CPP_CONCEPT3D_BASE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center justify-center rounded-lg border border-[#b7c4b9] bg-white px-4 py-2 text-sm font-semibold text-[#1b4332] shadow-sm transition-colors hover:bg-[#edf4ee] focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:ring-offset-2"
          >
            Open CPP map
          </a>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-start">
        <div className="order-1 rounded-lg border border-[#d9ded4] bg-white p-4 shadow-sm">
          <label
            htmlFor="campus-map-search"
            className="block text-sm font-bold text-[#1b4332]"
          >
            Search campus locations
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <input
              id="campus-map-search"
              type="search"
              value={searchText}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Try Library, shuttle, repair, or bookstore"
              className="min-h-11 flex-1 rounded-lg border border-[#b7c4b9] bg-[#fbfcf7] px-3 text-sm text-[#1a1c18] outline-none transition-colors placeholder:text-[#717973] focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/20"
            />
            <button
              type="button"
              onClick={handleClearSearch}
              className="min-h-11 rounded-lg border border-[#b7c4b9] px-4 text-sm font-semibold text-[#1b4332] transition-colors hover:bg-[#edf4ee] focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasSearchText}
            >
              Clear
            </button>
          </div>

          {unknownLocationParam ? (
            <p className="mt-3 rounded-md border border-[#f0cf8b] bg-[#fff8e8] px-3 py-2 text-sm leading-5 text-[#6f4a12]">
              Saved location &quot;{unknownLocationParam}&quot; is no longer
              recognized. The screen falls back to recognized campus locations,
              using the public Marketplace meetup area unless the search text
              matches another location.
            </p>
          ) : null}

          {hasSearchText && !hasNoResults ? (
            <p className="mt-3 text-sm text-[#4b5563]">
              Showing {filteredLocations.length} result
              {filteredLocations.length === 1 ? "" : "s"} for &quot;{searchText}&quot;.
            </p>
          ) : null}

          {hasNoResults ? (
            <div className="mt-3 rounded-md border border-[#c9d7e8] bg-[#eef6ff] px-3 py-3 text-sm leading-5 text-[#24415f]">
              <p className="font-semibold text-[#18324d]">
                No campus locations matched &quot;{searchText}&quot;.
              </p>
              <p className="mt-1">
                Use the official CPP map search for this typed text, or clear
                the search to return to the campus list.
              </p>
              <a
                href={buildTextMapFallback(null)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex font-semibold text-[#1b4332] underline underline-offset-4"
              >
                Search CPP map for &quot;{searchText}&quot;
              </a>
            </div>
          ) : null}
        </div>

        <div className="order-2 flex flex-col gap-5 lg:col-start-2 lg:row-span-2">
          <section
            aria-labelledby="selected-campus-location"
            className="rounded-lg border border-[#d9ded4] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#58606a]">
                  Selected Location
                </p>
                <h2
                  id="selected-campus-location"
                  className="mt-1 font-['Manrope',sans-serif] text-2xl font-bold tracking-tight text-[#1b4332]"
                >
                  {selectedLocation.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4b5563]">
                  {selectedLocation.directions}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {selectedLocation.types.map((type) => (
                  <span
                    key={type}
                    className="rounded-md border border-[#d8c58c] bg-[#fff8e8] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#6f5a22]"
                  >
                    {TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#717973]">
              {typeLabels} / {selectedLocation.campusArea.replace(/-/g, " ")}
            </p>
          </section>

          <Concept3DMapPanel location={selectedLocation} />
          <DirectionsPanel location={selectedLocation} />
        </div>

        <div className="order-3 rounded-lg border border-[#d9ded4] bg-white p-3 shadow-sm lg:col-start-1">
          <LocationList
            locations={filteredLocations}
            selectedLocationId={selectedLocation.id}
            onSelect={setSelectedLocationId}
          />
        </div>
      </section>
    </main>
  );
}
