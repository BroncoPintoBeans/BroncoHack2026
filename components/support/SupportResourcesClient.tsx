"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SupportResource } from "@/lib/db/support/resources";

type SupportSection = "hardware" | "software" | "recycling";

function getSectionsForResource(resource: SupportResource): SupportSection[] {
  const key = resource.orgKey.toLowerCase();
  const text = [resource.orgName, resource.description ?? "", ...(resource.services ?? [])]
    .join(" ")
    .toLowerCase();
  const sections: SupportSection[] = [];

  if (
    key.includes("recycling") ||
    key.includes("ewaste") ||
    text.includes("recycling") ||
    text.includes("e-waste") ||
    text.includes("electronic waste")
  ) {
    sections.push("recycling");
  }

  if (
    key.includes("it_service") ||
    key.includes("advanced_computing") ||
    key.includes("student_tech_desk") ||
    text.includes("software") ||
    text.includes("canvas") ||
    text.includes("duo") ||
    text.includes("account") ||
    text.includes("login")
  ) {
    sections.push("software");
  }

  if (
    key.includes("maker") ||
    key.includes("ilab") ||
    key.includes("orchard") ||
    key.includes("tech_lending") ||
    key.includes("tech_desk") ||
    text.includes("repair") ||
    text.includes("hardware") ||
    text.includes("laptop") ||
    text.includes("device") ||
    text.includes("fabrication") ||
    text.includes("prototyp")
  ) {
    sections.push("hardware");
  }

  return sections.length > 0 ? Array.from(new Set(sections)) : ["hardware"];
}

function sectionTitle(section: SupportSection) {
  if (section === "hardware") return "Hardware Help";
  if (section === "software") return "Software Help";
  return "Recycling Centers";
}

function getWebsitePreviewUrl(websiteUrl: string | null) {
  if (!websiteUrl) return null;
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(websiteUrl)}?w=1000`;
}

export default function SupportResourcesClient({
  resources,
}: {
  resources: SupportResource[];
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");

  const groups = useMemo(() => {
    return ["All", ...Array.from(new Set(resources.map((r) => r.orgGroup))).sort()];
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((resource) => {
      if (group !== "All" && resource.orgGroup !== group) return false;
      if (!q) return true;
      return [
        resource.orgName,
        resource.orgGroup,
        resource.location ?? "",
        resource.hoursText ?? "",
        resource.phone ?? "",
        resource.email ?? "",
        resource.description ?? "",
        ...(resource.services ?? []),
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [group, query, resources]);

  const sectioned = useMemo(() => {
    const buckets: Record<SupportSection, SupportResource[]> = {
      hardware: [],
      software: [],
      recycling: [],
    };

    for (const resource of filtered) {
      const sections = getSectionsForResource(resource);
      for (const section of sections) {
        buckets[section].push(resource);
      }
    }
    return buckets;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[#e2e3db] bg-white p-5 shadow-[0px_4px_20px_0px_rgba(27,67,50,0.06)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.8px] text-[#1b4332]">
              Repair Help Directory
            </p>
            <p className="mt-1 text-sm text-[#414844]">
              Find campus support desks, labs, and makerspaces for technical hardware help.
            </p>
          </div>
          <p className="text-xs text-[#717973]">
            Showing <span className="font-semibold text-[#1a1c18]">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "resource" : "resources"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <input
            aria-label="Search support resources"
            className="bg-white border border-[#c1c8c2] rounded-full px-4 py-2.5 text-sm text-[#1a1c18] w-full sm:w-80 outline-none focus:border-[#1b4332]"
            placeholder="Search for support, labs, or services..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="border border-[#c1c8c2] rounded-full px-4 py-2 text-xs font-semibold text-[#414844] tracking-[0.6px] bg-white"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
          >
            {groups.map((value) => (
              <option key={value} value={value}>
                {value === "All" ? "All groups" : value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(["hardware", "software", "recycling"] as SupportSection[]).map((section) => (
        <section key={section} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#1a1c18]">{sectionTitle(section)}</h2>
            <span className="text-xs text-[#717973]">
              {sectioned[section].length}{" "}
              {sectioned[section].length === 1 ? "resource" : "resources"}
            </span>
          </div>

          {sectioned[section].length === 0 ? (
            <div className="bg-white border border-[#e2e3db] rounded-xl p-5 text-sm text-[#717973]">
              No resources currently match this section and filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sectioned[section].map((resource) => (
                <section
                  key={`${section}-${resource.orgKey}`}
                  className="bg-white border border-[#e2e3db] rounded-2xl p-6 shadow-[0px_4px_20px_0px_rgba(27,67,50,0.06)] flex flex-col gap-4"
                >
              {resource.websiteUrl ? (
                <Link
                  href={resource.websiteUrl}
                  target="_blank"
                  className="block overflow-hidden rounded-xl border border-[#e2e3db] bg-[#f3f4ec] hover:opacity-90 transition-opacity"
                  aria-label={`Open ${resource.orgName} website`}
                >
                  {getWebsitePreviewUrl(resource.websiteUrl) ? (
                    <img
                      src={getWebsitePreviewUrl(resource.websiteUrl)!}
                      alt={`${resource.orgName} website preview`}
                      className="h-36 w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-36 w-full bg-[#f3f4ec]" />
                  )}
                </Link>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#e2e3db] bg-[#f3f4ec]">
                  <div className="h-36 w-full bg-[#f3f4ec]" />
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span
                    className="inline-flex rounded-full border border-[#d7dbd1] bg-[#f3f4ec] px-2.5 py-1 text-[11px] font-semibold tracking-[0.6px] uppercase text-[#1b4332]"
                  >
                    {resource.orgGroup}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-[#1a1c18] whitespace-normal break-words">
                    {resource.orgName}
                  </h3>
                </div>
              </div>

              {resource.description ? (
                <p className="text-sm text-[#414844] leading-relaxed">{resource.description}</p>
              ) : null}

              <div className="flex flex-col gap-2 text-sm">
                {resource.location ? (
                  <div className="flex gap-2">
                    <span className="text-[#717973]">Location:</span>
                    <span className="text-[#1a1c18] font-semibold">{resource.location}</span>
                  </div>
                ) : null}
                {resource.hoursText ? (
                  <div className="flex gap-2">
                    <span className="text-[#717973]">Hours:</span>
                    <span className="text-[#1a1c18]">{resource.hoursText}</span>
                  </div>
                ) : null}
                {resource.phone ? (
                  <div className="flex gap-2">
                    <span className="text-[#717973]">Phone:</span>
                    <span className="text-[#1a1c18] font-semibold">{resource.phone}</span>
                  </div>
                ) : null}
                {resource.email ? (
                  <div className="flex gap-2">
                    <span className="text-[#717973]">Email:</span>
                    <a
                      href={`mailto:${resource.email}`}
                      className="text-[#1b4332] font-semibold hover:underline"
                    >
                      {resource.email}
                    </a>
                  </div>
                ) : null}
              </div>

              {resource.services.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {resource.services.slice(0, 6).map((service) => (
                    <span
                      key={service}
                      className="bg-[#f3f4ec] border border-[#e2e3db] text-[#414844] text-xs font-semibold tracking-[0.4px] px-2 py-1 rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              ) : null}

              {resource.sourceUrls.length > 0 ? (
                <div className="mt-auto pt-2 border-t border-[#e2e3db]">
                  <p className="text-[11px] text-[#717973]">
                    Sourced from official CPP pages.{" "}
                    {resource.lastVerifiedAt ? (
                      <>
                        Last verified{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(resource.lastVerifiedAt))}
                        .
                      </>
                    ) : null}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {resource.sourceUrls.slice(0, 3).map((url) => (
                      <Link
                        key={url}
                        href={url}
                        target="_blank"
                        className="text-[11px] font-semibold text-[#1b4332] hover:underline"
                        title={url}
                      >
                        Source
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
                </section>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
