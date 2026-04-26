import { createClient } from "@/lib/supabase/server";

export type SupportResource = {
  id: string;
  orgKey: string;
  orgName: string;
  orgGroup: string;
  websiteUrl: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  hoursText: string | null;
  services: string[];
  description: string | null;
  sourceUrls: string[];
  lastVerifiedAt: string | null;
};

type SupportResourceRow = {
  id: string;
  org_key: string;
  org_name: string;
  org_group: string;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  hours_text: string | null;
  services: string[] | null;
  description: string | null;
  source_urls: string[] | null;
  last_verified_at: string | null;
};

const FALLBACK_SUPPORT_RESOURCES: SupportResource[] = [
  {
    id: "fallback-cpp-it-service-desk",
    orgKey: "cpp_it_service_desk",
    orgName: "CPP IT Service Desk",
    orgGroup: "CPP IT",
    websiteUrl: "https://cpp.service-now.com/kb_view.do?sysparm_article=KB0001064",
    phone: "(909) 869-6776",
    email: "itservicedesk@cpp.edu",
    location:
      "University Library (2nd floor Tech Desk counter) + Building 1, Suite 100 (per CPP IT)",
    hoursText:
      "Regular business hours: 7:30am-5:00pm, Monday-Friday. Student assistants: during library hours.",
    services: [
      "Account/login help",
      "Canvas & Duo help",
      "General IT troubleshooting",
      "Tickets/eHelp portal",
    ],
    description:
      "Campus IT support for students, faculty, and staff. Use eHelp for tickets and self-service articles.",
    sourceUrls: [
      "https://cpp.service-now.com/kb_view.do?sysparm_article=KB0001064",
      "https://cpp.service-now.com/ehelp",
    ],
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: "fallback-cpp-advanced-computing",
    orgKey: "cpp_advanced_computing",
    orgName: "Advanced Computing",
    orgGroup: "CPP IT",
    websiteUrl: "https://www.cpp.edu/it/advanced-computing/index.shtml",
    phone: null,
    email: null,
    location: "Cal Poly Pomona (see website for program details)",
    hoursText: "See website for current contact and availability.",
    services: [
      "Research computing",
      "HPC / advanced computing",
      "AI/ML resources",
      "Cybersecurity initiatives",
    ],
    description:
      "Advanced Computing initiatives and partnerships supporting research and instruction.",
    sourceUrls: ["https://www.cpp.edu/it/advanced-computing/index.shtml"],
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: "fallback-cpp-ilab",
    orgKey: "cpp_ilab",
    orgName: "iLab (Student Innovation Idea Labs)",
    orgGroup: "CPP",
    websiteUrl: "https://www.cpp.edu/ilab/index.shtml",
    phone: "(909) 869-3741",
    email: "siil@cpp.edu",
    location: "Building 1, Room 113 (iLab)",
    hoursText: "Open walk-in hours: Monday-Friday 8:00am-5:00pm.",
    services: [
      "Basic fabrication tools",
      "Project help",
      "Collaboration space",
      "Innovation support",
    ],
    description:
      "Campus innovation/maker space with basic fabrication tools and project assistance.",
    sourceUrls: [
      "https://www.cpp.edu/ilab/index.shtml",
      "https://www.cpp.edu/ilab/contact-us/index.shtml",
    ],
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: "fallback-cpp-makerstudio",
    orgKey: "cpp_makerstudio",
    orgName: "SIIL Maker Studio (MakerSpace Studio)",
    orgGroup: "CPP",
    websiteUrl: "https://www.cpp.edu/makerstudio/index.shtml",
    phone: "(909) 869-4098",
    email: "siil@cpp.edu",
    location: "University Library (Bldg. 15), 2nd Floor",
    hoursText: "Current hours: Monday-Friday 12:00pm-5:00pm.",
    services: [
      "Makerspace equipment",
      "Prototyping support",
      "Creative tools",
      "Workshops (varies)",
    ],
    description:
      "Campus makerspace providing equipment and support to build projects and prototypes.",
    sourceUrls: [
      "https://www.cpp.edu/makerstudio/index.shtml",
      "https://www.cpp.edu/makerstudio/contact/index.shtml",
    ],
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: "fallback-cpp-library-tech-lending",
    orgKey: "cpp_library_tech_lending",
    orgName: "CPP Library Tech Lending Program",
    orgGroup: "CPP Library",
    websiteUrl: "https://www.cpp.edu/library/access-services/tech-lending-program.shtml",
    phone: "(909) 869-3075",
    email: "libcirc@cpp.edu",
    location: "University Library, 2nd Floor Circulation Desk",
    hoursText:
      "Device checkout during library service hours; first-come, first-served. No reservations.",
    services: [
      "Laptop and hotspot loans",
      "Chargers/adapters/headphones",
      "Device access support",
      "Borrow/return guidance",
    ],
    description:
      "Library-operated technology lending for students needing laptops, hotspots, and related tech hardware support access.",
    sourceUrls: [
      "https://www.cpp.edu/library/access-services/tech-lending-program.shtml",
      "https://libguides.library.cpp.edu/techlending/",
    ],
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: "fallback-cpp-student-tech-desk",
    orgKey: "cpp_student_tech_desk",
    orgName: "CPP Student Tech Desk (Library)",
    orgGroup: "CPP IT",
    websiteUrl: "https://cpp.service-now.com/kb_view.do?sysparm_article=KB0001064",
    phone: "(909) 869-6776",
    email: "itservicedesk@cpp.edu",
    location: "University Library, 2nd Floor Tech Desk counter",
    hoursText:
      "Student assistants are available during library hours; IT staff during regular business hours.",
    services: [
      "In-person troubleshooting",
      "Login/account recovery guidance",
      "General student device support",
      "Campus software access help",
    ],
    description:
      "In-library IT help point for students who need hands-on support with devices, accounts, and campus technology tools.",
    sourceUrls: ["https://cpp.service-now.com/kb_view.do?sysparm_article=KB0001064"],
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: "fallback-cpp-innovation-orchard",
    orgKey: "cpp_innovation_orchard",
    orgName: "SIIL Innovation Orchard (IO)",
    orgGroup: "CPP",
    websiteUrl: "https://www.cpp.edu/siil/our-spaces/innovation-orchard.shtml",
    phone: null,
    email: "siil@cpp.edu",
    location: "1151 Fairplex Dr, Pomona, CA 91768",
    hoursText: "Tuesday: 4:00pm-7:00pm",
    services: [
      "Laser cutter access",
      "3D printing tools",
      "Hands-on fabrication support",
      "Workshops and machine training",
    ],
    description:
      "Extended SIIL build space for tools not suitable for the library, useful for hardware prototyping and repair-adjacent fabrication work.",
    sourceUrls: [
      "https://www.cpp.edu/siil/",
      "https://www.cpp.edu/siil/our-spaces/innovation-orchard.shtml",
    ],
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: "fallback-cpp-ehs-ewaste",
    orgKey: "cpp_ehs_ewaste_recycling",
    orgName: "CPP EH&S Electronic Waste (E-Waste)",
    orgGroup: "CPP",
    websiteUrl: "https://www.cpp.edu/ehs/environmental-safety/electronic-waste.shtml",
    phone: "(909) 869-4697",
    email: null,
    location: "Environmental Health & Safety (appointment-based campus drop-off)",
    hoursText:
      "By appointment during normal business hours; weekly collections on the last working day.",
    services: [
      "Campus e-waste recycling",
      "Electronics disposal guidance",
      "Accepted item list for devices/accessories",
      "Hazardous e-waste handling process",
    ],
    description:
      "EH&S accepts campus-generated electronic waste for proper recycling and disposal (off-campus public drop-off not accepted).",
    sourceUrls: ["https://www.cpp.edu/ehs/environmental-safety/electronic-waste.shtml"],
    lastVerifiedAt: new Date().toISOString(),
  },
];

export async function listSupportResources(): Promise<SupportResource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_resources")
    .select(
      "id,org_key,org_name,org_group,website_url,phone,email,location,hours_text,services,description,source_urls,last_verified_at"
    )
    .order("org_name", { ascending: true });

  if (error) {
    const message = error.message ?? "";
    const missingTable =
      message.includes("Could not find the table") ||
      message.includes("support_resources") ||
      (error as { code?: string }).code === "PGRST205";
    if (missingTable) return FALLBACK_SUPPORT_RESOURCES;
    throw new Error(error.message);
  }

  return ((data ?? []) as SupportResourceRow[]).map((row) => ({
    id: row.id,
    orgKey: row.org_key,
    orgName: row.org_name,
    orgGroup: row.org_group,
    websiteUrl: row.website_url,
    phone: row.phone,
    email: row.email,
    location: row.location,
    hoursText: row.hours_text,
    services: row.services ?? [],
    description: row.description,
    sourceUrls: row.source_urls ?? [],
    lastVerifiedAt: row.last_verified_at,
  }));
}
