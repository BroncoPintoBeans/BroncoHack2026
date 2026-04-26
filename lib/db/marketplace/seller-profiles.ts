import { getSupabaseClient, isSupabaseAvailable } from "@/lib/db/client";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface UserProfileRow {
  id: string;
  display_name: string | null;
}

function cleanName(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nameFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  return (
    cleanName(metadata?.display_name) ??
    cleanName(metadata?.full_name) ??
    cleanName(metadata?.name) ??
    cleanName(metadata?.user_name)
  );
}

async function fillFromProfiles(
  names: Map<string, string>,
  userIds: string[],
  query: PromiseLike<{ data: unknown; error: { message?: string } | null }>
) {
  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Could not load user profiles.");

  for (const profile of (data ?? []) as UserProfileRow[]) {
    const name = cleanName(profile.display_name);
    if (name) names.set(profile.id, name);
  }

  return userIds.filter((id) => !names.has(id));
}

export async function getUserDisplayNames(
  userIds: string[],
  supabase: SupabaseServerClient
) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  const names = new Map<string, string>();

  if (uniqueUserIds.length === 0) return names;

  let missingIds = await fillFromProfiles(
    names,
    uniqueUserIds,
    supabase.from("user_profiles").select("id,display_name").in("id", uniqueUserIds)
  );

  if (missingIds.length === 0 || !isSupabaseAvailable()) {
    return names;
  }

  const admin = getSupabaseClient();

  try {
    missingIds = await fillFromProfiles(
      names,
      missingIds,
      admin.from("user_profiles").select("id,display_name").in("id", missingIds)
    );
  } catch {
    // Keep the request-client results if the service role is not usable here.
  }

  await Promise.all(
    missingIds.map(async (id) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error) return;

        const metadataName = nameFromMetadata(data.user?.user_metadata);
        if (metadataName) names.set(id, metadataName);
      } catch {
        // A missing auth row should not break marketplace rendering.
      }
    })
  );

  return names;
}
