// In-memory mutex for demo mode.
// Supabase path would use: pg_advisory_xact_lock(hashtext('case:' || case_id))

const locks = new Map<string, boolean>()

async function acquireLock(key: string): Promise<() => void> {
  const POLL_MS = 10
  const TIMEOUT_MS = 5000
  const deadline = Date.now() + TIMEOUT_MS

  while (locks.get(key)) {
    if (Date.now() >= deadline) throw new Error(`Lock timeout: ${key}`)
    await new Promise(resolve => setTimeout(resolve, POLL_MS))
  }

  locks.set(key, true)
  return () => locks.delete(key)
}

export async function acquireCaseLock(caseId: string): Promise<() => void> {
  // Supabase: pg_advisory_xact_lock(hashtext('case:' || case_id))
  return acquireLock(`case:${caseId}`)
}

export async function acquireRunLock(runId: string): Promise<() => void> {
  // Supabase: pg_advisory_xact_lock(hashtext('run:' || run_id))
  return acquireLock(`run:${runId}`)
}
