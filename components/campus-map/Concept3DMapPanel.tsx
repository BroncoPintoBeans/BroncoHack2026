import {
  CPP_CONCEPT3D_BASE_URL,
  buildCampusLocationLink,
  buildCampusMapIframeSrc,
} from "@/lib/campus/concept3d";
import type { CampusLocation } from "@/lib/campus/locations";

const CPP_ACCESSIBLE_TEXT_MAP_URL = "https://www.cpp.edu/maps/text/index.shtml";
const CPP_MAP_ACCESSIBILITY_URL = "https://www.cpp.edu/maps/accessibility.shtml";

interface Concept3DMapPanelProps {
  location: CampusLocation;
}

export default function Concept3DMapPanel({
  location,
}: Concept3DMapPanelProps) {
  const campusMapLink = buildCampusLocationLink(location);
  const iframeSrc = buildCampusMapIframeSrc(location);

  return (
    <section
      aria-labelledby="concept3d-map-heading"
      className="rounded-lg border border-[#d9ded4] bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#58606a]">
            Official Map
          </p>
          <h2
            id="concept3d-map-heading"
            className="mt-1 font-['Manrope',sans-serif] text-xl font-bold tracking-tight text-[#1b4332]"
          >
            CPP campus map for {location.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={campusMapLink.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#b7c4b9] px-3 text-sm font-semibold text-[#1b4332] transition-colors hover:bg-[#edf4ee] focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:ring-offset-2"
          >
            {campusMapLink.label}
          </a>
          <a
            href={CPP_ACCESSIBLE_TEXT_MAP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#c9d7e8] px-3 text-sm font-semibold text-[#24415f] transition-colors hover:bg-[#eef6ff] focus:outline-none focus:ring-2 focus:ring-[#24415f] focus:ring-offset-2"
          >
            Accessible text map
          </a>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-[#d9ded4] bg-[#e9eee7]">
        <iframe
          title={`CPP campus map for ${location.name}`}
          src={iframeSrc}
          tabIndex={-1}
          className="h-[360px] w-full bg-white sm:h-[440px] lg:h-[520px]"
          loading="lazy"
        />
      </div>

      <div className="mt-3 grid gap-2 text-sm leading-6 text-[#4b5563] md:grid-cols-[1fr_auto] md:items-start">
        <p>
          Marker opening is best effort because this screen does not have a
          verified Concept3D marker ID for {location.name}. Use the official map
          search if the embedded view does not land on the expected place.
        </p>
        <a
          href={CPP_MAP_ACCESSIBILITY_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#1b4332] underline underline-offset-4"
        >
          Map accessibility
        </a>
      </div>

      <a
        href={CPP_CONCEPT3D_BASE_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex text-sm font-semibold text-[#1b4332] underline underline-offset-4"
      >
        Open base CPP campus map
      </a>
    </section>
  );
}
