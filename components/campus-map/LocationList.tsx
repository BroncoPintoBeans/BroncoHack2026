import type {
  CampusLocation,
  CampusLocationId,
} from "@/lib/campus/locations";

interface LocationListProps {
  locations: readonly CampusLocation[];
  selectedLocationId: CampusLocationId;
  onSelect: (locationId: CampusLocationId) => void;
}

const TYPE_LABELS: Record<string, string> = {
  pickup_zone: "Pickup",
  shuttle_stop: "Shuttle",
  map_landmark: "Map",
  repair_destination: "Repair",
  reuse_destination: "Reuse",
  parts_destination: "Parts",
  meetup_zone: "Meetup",
};

export default function LocationList({
  locations,
  selectedLocationId,
  onSelect,
}: LocationListProps) {
  return (
    <section aria-labelledby="campus-location-results">
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <h2
          id="campus-location-results"
          className="text-sm font-bold text-[#1b4332]"
        >
          Location results
        </h2>
        <span className="text-xs font-semibold text-[#717973]">
          {locations.length}
        </span>
      </div>

      {locations.length > 0 ? (
        <div className="flex flex-col gap-2">
          {locations.map((location) => {
            const isSelected = location.id === selectedLocationId;

            return (
              <button
                key={location.id}
                type="button"
                onClick={() => onSelect(location.id)}
                aria-pressed={isSelected}
                aria-current={isSelected ? "true" : undefined}
                className={`w-full rounded-lg border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:ring-offset-2 ${
                  isSelected
                    ? "border-[#1b4332] bg-[#edf4ee]"
                    : "border-[#e2e8df] bg-[#fbfcf7] hover:border-[#b7c4b9] hover:bg-[#f4f7ef]"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-5 text-[#1a1c18]">
                      {location.name}
                    </span>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[#58606a]">
                      {location.campusArea.replace(/-/g, " ")}
                    </span>
                  </span>
                  {isSelected ? (
                    <span className="shrink-0 rounded-md bg-[#1b4332] px-2 py-1 text-xs font-bold text-white">
                      Selected
                    </span>
                  ) : null}
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {location.types.map((type) => (
                    <span
                      key={type}
                      className="rounded-md border border-[#d4dde4] bg-white px-2 py-0.5 text-xs font-semibold text-[#37546a]"
                    >
                      {TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-[#b7c4b9] bg-[#fbfcf7] px-3 py-4 text-sm leading-6 text-[#4b5563]">
          No saved campus locations match the current search.
        </p>
      )}
    </section>
  );
}
