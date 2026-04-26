-- Support resources directory for on-campus technical help.
-- Data is sourced from public, official CPP webpages and stored with attribution URLs.

create table if not exists public.support_resources (
  id uuid primary key default gen_random_uuid(),
  org_key text not null unique,
  org_name text not null,
  org_group text not null default 'CPP',
  website_url text,
  phone text,
  email text,
  location text,
  hours_text text,
  services text[] not null default '{}'::text[],
  description text,
  source_urls text[] not null default '{}'::text[],
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_resources_org_name_idx
  on public.support_resources (org_name);

alter table public.support_resources enable row level security;

drop policy if exists "support_resources public read" on public.support_resources;
create policy "support_resources public read"
  on public.support_resources
  for select
  using (true);

-- Seed a small directory of CPP resources.
insert into public.support_resources (
  org_key,
  org_name,
  org_group,
  website_url,
  phone,
  email,
  location,
  hours_text,
  services,
  description,
  source_urls,
  last_verified_at
)
values
  (
    'cpp_it_service_desk',
    'CPP IT Service Desk',
    'CPP IT',
    'https://cpp.service-now.com/kb_view.do?sysparm_article=KB0001064',
    '(909) 869-6776',
    'itservicedesk@cpp.edu',
    'University Library (2nd floor Tech Desk counter) + Building 1, Suite 100 (per CPP IT)',
    'Regular business hours: 7:30am–5:00pm, Monday–Friday. Student assistants: during library hours. (See source for details.)',
    array['Account/login help', 'Canvas & Duo help', 'General IT troubleshooting', 'Tickets/eHelp portal'],
    'Campus IT support for students, faculty, and staff. Use eHelp for tickets and self-service articles; staff are available in-person and over the phone during business hours.',
    array[
      'https://cpp.service-now.com/kb_view.do?sysparm_article=KB0001064',
      'https://cpp.service-now.com/ehelp'
    ],
    now()
  ),
  (
    'cpp_advanced_computing',
    'Advanced Computing',
    'CPP IT',
    'https://www.cpp.edu/it/advanced-computing/index.shtml',
    null,
    null,
    'Cal Poly Pomona (see website for program details)',
    'See website for current contact + availability.',
    array['Research computing', 'HPC / advanced computing', 'AI/ML resources', 'Cybersecurity initiatives'],
    'Advanced Computing initiatives and partnerships supporting research and instruction (HPC, AI, and related resources).',
    array['https://www.cpp.edu/it/advanced-computing/index.shtml'],
    now()
  ),
  (
    'cpp_ilab',
    'iLab (Student Innovation Idea Labs)',
    'CPP',
    'https://www.cpp.edu/ilab/index.shtml',
    '(909) 869-3741',
    'siil@cpp.edu',
    'Building 1, Room 113 (iLab)',
    'Open walk-in hours: Monday–Friday 8:00am–5:00pm.',
    array['Basic fabrication tools', 'Project help', 'Collaboration space', 'Innovation support'],
    'Campus innovation/maker space with basic fabrication tools and project assistance. Good for student projects and hands-on help.',
    array[
      'https://www.cpp.edu/ilab/index.shtml',
      'https://www.cpp.edu/ilab/contact-us/index.shtml'
    ],
    now()
  ),
  (
    'cpp_makerstudio',
    'SIIL Maker Studio (MakerSpace Studio)',
    'CPP',
    'https://www.cpp.edu/makerstudio/index.shtml',
    '(909) 869-4098',
    'siil@cpp.edu',
    'University Library (Bldg. 15), 2nd Floor',
    'Current hours: Monday–Friday 12:00pm–5:00pm. Closed on holidays and over Winter Break.',
    array['Makerspace equipment', 'Prototyping support', 'Creative tools', 'Workshops (varies)'],
    'Campus makerspace providing equipment and support to build projects and prototypes. Great for hands-on repair, fabrication, and making.',
    array[
      'https://www.cpp.edu/makerstudio/index.shtml',
      'https://www.cpp.edu/makerstudio/contact/index.shtml'
    ],
    now()
  ),
  (
    'cpp_library_tech_lending',
    'CPP Library Tech Lending Program',
    'CPP Library',
    'https://www.cpp.edu/library/access-services/tech-lending-program.shtml',
    '(909) 869-3075',
    'libcirc@cpp.edu',
    'University Library, 2nd Floor Circulation Desk',
    'Device checkout during library service hours; first-come, first-served. No reservations.',
    array['Laptop and hotspot loans', 'Chargers/adapters/headphones', 'Device access support', 'Borrow/return guidance'],
    'Library-operated technology lending for students needing laptops, hotspots, and related tech hardware support access.',
    array[
      'https://www.cpp.edu/library/access-services/tech-lending-program.shtml',
      'https://libguides.library.cpp.edu/techlending/'
    ],
    now()
  ),
  (
    'cpp_student_tech_desk',
    'CPP Student Tech Desk (Library)',
    'CPP IT',
    'https://cpp.service-now.com/kb_view.do?sysparm_article=KB0001064',
    '(909) 869-6776',
    'itservicedesk@cpp.edu',
    'University Library, 2nd Floor Tech Desk counter',
    'Student assistants are available during library hours; IT staff during regular business hours.',
    array['In-person troubleshooting', 'Login/account recovery guidance', 'General student device support', 'Campus software access help'],
    'In-library IT help point for students who need hands-on support with devices, accounts, and campus technology tools.',
    array['https://cpp.service-now.com/kb_view.do?sysparm_article=KB0001064'],
    now()
  ),
  (
    'cpp_innovation_orchard',
    'SIIL Innovation Orchard (IO)',
    'CPP',
    'https://www.cpp.edu/siil/our-spaces/innovation-orchard.shtml',
    null,
    'siil@cpp.edu',
    '1151 Fairplex Dr, Pomona, CA 91768',
    'Tuesday: 4:00pm-7:00pm',
    array['Laser cutter access', '3D printing tools', 'Hands-on fabrication support', 'Workshops and machine training'],
    'Extended SIIL build space for tools not suitable for the library, useful for hardware prototyping and repair-adjacent fabrication work.',
    array[
      'https://www.cpp.edu/siil/',
      'https://www.cpp.edu/siil/our-spaces/innovation-orchard.shtml'
    ],
    now()
  ),
  (
    'cpp_ehs_ewaste_recycling',
    'CPP EH&S Electronic Waste (E-Waste)',
    'CPP',
    'https://www.cpp.edu/ehs/environmental-safety/electronic-waste.shtml',
    '(909) 869-4697',
    null,
    'Environmental Health & Safety (appointment-based campus drop-off)',
    'By appointment during normal business hours; weekly collections on the last working day.',
    array['Campus e-waste recycling', 'Electronics disposal guidance', 'Accepted item list for devices/accessories', 'Hazardous e-waste handling process'],
    'EH&S accepts campus-generated electronic waste for proper recycling and disposal (off-campus public drop-off not accepted).',
    array['https://www.cpp.edu/ehs/environmental-safety/electronic-waste.shtml'],
    now()
  )
on conflict (org_key) do update set
  org_name = excluded.org_name,
  org_group = excluded.org_group,
  website_url = excluded.website_url,
  phone = excluded.phone,
  email = excluded.email,
  location = excluded.location,
  hours_text = excluded.hours_text,
  services = excluded.services,
  description = excluded.description,
  source_urls = excluded.source_urls,
  last_verified_at = excluded.last_verified_at,
  updated_at = now();
