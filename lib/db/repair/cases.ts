import { createClient } from "@/lib/supabase/server";

export interface RepairCaseMedia {
  id: string;
  storagePath: string;
  mediaType: "image" | "video" | "audio";
  ordinal: number;
  url: string | null;
}

export interface RepairCaseVerdict {
  runId: string;
  repairLowCents: number | null;
  repairHighCents: number | null;
  rrrScore: number | null;
  label: string | null;
  createdAt: string;
}

export interface RepairDashboardCase {
  id: string;
  userId: string;
  category: string;
  title: string | null;
  symptoms: string;
  urgency: string;
  modelNumber: string | null;
  quotedPriceCents: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  media: RepairCaseMedia[];
  imageUrl: string | null;
  verdict: RepairCaseVerdict | null;
}

interface RepairCaseMediaRow {
  id: string;
  storage_path: string;
  media_type: "image" | "video" | "audio";
  ordinal: number | null;
  created_at: string | null;
}

interface RepairCaseVerdictRow {
  run_id: string;
  repair_low_cents: number | null;
  repair_high_cents: number | null;
  rrr_score: number | string | null;
  label: string | null;
  created_at: string | null;
}

interface RepairCaseRow {
  id: string;
  user_id: string;
  category: string;
  title: string | null;
  symptoms: string;
  urgency: string;
  model_number: string | null;
  quoted_price_cents: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  case_media: RepairCaseMediaRow[] | null;
  verdicts: RepairCaseVerdictRow[] | null;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const CASE_MEDIA_BUCKET = "case-media";
const CASE_SELECT = `
  id,
  user_id,
  category,
  title,
  symptoms,
  urgency,
  model_number,
  quoted_price_cents,
  status,
  created_at,
  updated_at,
  case_media (
    id,
    storage_path,
    media_type,
    ordinal,
    created_at
  ),
  verdicts (
    run_id,
    repair_low_cents,
    repair_high_cents,
    rrr_score,
    label,
    created_at
  )
`;

function parseScore(value: number | string | null) {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveMediaUrl(supabase: SupabaseServerClient, storagePath: string) {
  const path = storagePath.trim();
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  return supabase.storage.from(CASE_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

function latestVerdict(rows: RepairCaseVerdictRow[] | null): RepairCaseVerdict | null {
  const verdict = [...(rows ?? [])].sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? "")
  )[0];

  if (!verdict) return null;

  return {
    runId: verdict.run_id,
    repairLowCents: verdict.repair_low_cents,
    repairHighCents: verdict.repair_high_cents,
    rrrScore: parseScore(verdict.rrr_score),
    label: verdict.label,
    createdAt: verdict.created_at ?? "",
  };
}

function rowToRepairDashboardCase(
  supabase: SupabaseServerClient,
  row: RepairCaseRow
): RepairDashboardCase {
  const media = (row.case_media ?? [])
    .map((item) => ({
      id: item.id,
      storagePath: item.storage_path,
      mediaType: item.media_type,
      ordinal: item.ordinal ?? 0,
      url: resolveMediaUrl(supabase, item.storage_path),
    }))
    .sort((a, b) => a.ordinal - b.ordinal);

  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    symptoms: row.symptoms,
    urgency: row.urgency,
    modelNumber: row.model_number,
    quotedPriceCents: row.quoted_price_cents,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media,
    imageUrl: media.find((item) => item.mediaType === "image" && item.url)?.url ?? null,
    verdict: latestVerdict(row.verdicts),
  };
}

export async function listRepairDashboardCases() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(CASE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as RepairCaseRow[]).map((row) =>
    rowToRepairDashboardCase(supabase, row)
  );
}
