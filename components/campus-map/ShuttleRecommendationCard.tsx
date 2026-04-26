import {
  CPP_BRONCO_SHUTTLE_SOURCE_URL,
  getShuttleRecommendation,
} from "@/lib/campus/shuttle-routes";
import type { CampusLocation } from "@/lib/campus/locations";

interface ShuttleRecommendationCardProps {
  destination: CampusLocation;
}

export default function ShuttleRecommendationCard({
  destination,
}: ShuttleRecommendationCardProps) {
  const recommendation = getShuttleRecommendation("village", destination.id);

  if (!recommendation.recommended) {
    return (
      <aside
        aria-label="Shuttle advisory"
        className="border-l-4 border-[#9db6ca] bg-[#f7fafc] px-3 py-2 text-sm leading-6 text-[#4b5563]"
      >
        <p className="font-bold text-[#37546a]">Shuttle advisory</p>
        <p className="mt-1">{recommendation.reason}</p>
        <p className="mt-2 text-xs leading-5 text-[#58606a]">
          Estimates only, not real-time. Service may not operate during breaks
          or campus holidays.
        </p>
        <a
          href={CPP_BRONCO_SHUTTLE_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex font-semibold text-[#1b4332] underline underline-offset-4"
        >
          Official Bronco Shuttle source
        </a>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Recommended shuttle advisory"
      className="border-l-4 border-[#84a98c] bg-[#f2f8f3] px-3 py-2 text-sm leading-6 text-[#2e5638]"
    >
      <p className="font-bold text-[#1b4332]">Recommended from The Village</p>
      <p className="mt-1">{recommendation.reason}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="border border-[#dce8df] bg-white px-3 py-2">
          <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#58606a]">
            Ride
          </dt>
          <dd className="text-base font-bold text-[#1b4332]">
            {recommendation.rideMinutes} min
          </dd>
        </div>
        <div className="border border-[#dce8df] bg-white px-3 py-2">
          <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#58606a]">
            Walk
          </dt>
          <dd className="text-base font-bold text-[#1b4332]">
            {recommendation.walkMinutes} min
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-[#41634a]">
        Estimates only, not real-time. Service may not operate during breaks or
        campus holidays.
      </p>
      <a
        href={recommendation.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex font-semibold text-[#1b4332] underline underline-offset-4"
      >
        Official Bronco Shuttle source
      </a>
    </aside>
  );
}
