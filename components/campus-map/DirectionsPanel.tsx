import ShuttleRecommendationCard from "@/components/campus-map/ShuttleRecommendationCard";
import {
  recommendReverseLogisticsDestination,
  type ReverseLogisticsRecommendation,
} from "@/lib/campus/reverse-logistics";
import type { CampusLocation } from "@/lib/campus/locations";

const CPP_DRC_URL = "https://www.cpp.edu/drc/";
const CPP_MAP_ACCESSIBILITY_URL = "https://www.cpp.edu/maps/accessibility.shtml";

interface DirectionsPanelProps {
  location: CampusLocation;
}

function getReverseLogisticsIntent(location: CampusLocation): string {
  if (location.types.includes("parts_destination")) {
    return "parts";
  }

  if (location.types.includes("repair_destination")) {
    return "repair";
  }

  if (location.types.includes("reuse_destination")) {
    return "reuse";
  }

  if (
    location.types.includes("meetup_zone") ||
    location.types.includes("pickup_zone")
  ) {
    return "public-exchange";
  }

  return "unknown";
}

function renderRecommendationList(recommendation: ReverseLogisticsRecommendation) {
  return (
    <div className="mt-3 grid gap-4 border-t border-[#e2e8df] pt-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="border-l-4 border-[#84a98c] bg-[#f2f8f3] px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#41634a]">
          Primary
        </p>
        <p className="mt-1 text-sm font-bold text-[#1b4332]">
          {recommendation.primary.label}
        </p>
        <p className="mt-1 text-sm leading-5 text-[#4b5563]">
          {recommendation.primary.reason}
        </p>
      </div>

      <div className="border-l-4 border-[#9db6ca] bg-[#f7fafc] px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#37546a]">
          Alternatives
        </p>
        {recommendation.alternatives.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {recommendation.alternatives.map((alternative) => (
              <li key={alternative.locationId}>
                <p className="text-sm font-bold text-[#1a1c18]">
                  {alternative.label}
                </p>
                <p className="text-sm leading-5 text-[#4b5563]">
                  {alternative.reason}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-5 text-[#4b5563]">
            No additional V1 campus alternatives are listed for this route.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DirectionsPanel({ location }: DirectionsPanelProps) {
  const recommendation = recommendReverseLogisticsDestination(
    getReverseLogisticsIntent(location),
  );

  return (
    <section
      aria-labelledby="directions-heading"
      className="rounded-lg border border-[#d9ded4] bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#58606a]">
            Directions
          </p>
          <h2
            id="directions-heading"
            className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-[#1b4332]"
          >
            Getting to {location.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#4b5563]">
            {location.directions}
          </p>

          <div className="mt-4 border-l-4 border-[#9db6ca] bg-[#eef6ff] px-3 py-2 text-sm leading-6 text-[#24415f]">
            <p className="font-bold text-[#18324d]">Accessibility note</p>
            <p className="mt-1">{location.accessibilityNote}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <a
                href={CPP_MAP_ACCESSIBILITY_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                CPP map accessibility
              </a>
              <a
                href={CPP_DRC_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                CPP DRC
              </a>
            </div>
          </div>

          <div className="mt-4 border-l-4 border-[#d8b04a] bg-[#fff8e8] px-3 py-2 text-sm leading-6 text-[#6f4a12]">
            <p className="font-bold text-[#5d3b0c]">Public meetup safety</p>
            <p className="mt-1">
              Meet in public visible campus areas, avoid private or isolated
              locations, and confirm the exact meetup point through messages
              before traveling.
            </p>
          </div>
        </div>

        <ShuttleRecommendationCard destination={location} />
      </div>

      <div className="mt-5 border-t border-[#e2e8df] pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#58606a]">
          Reverse Logistics
        </p>
        <p className="mt-1 text-sm leading-6 text-[#4b5563]">
          {recommendation.explanation}
        </p>
        {renderRecommendationList(recommendation)}
        <p className="mt-3 text-xs leading-5 text-[#717973]">
          {recommendation.disclaimer}
        </p>
      </div>
    </section>
  );
}
