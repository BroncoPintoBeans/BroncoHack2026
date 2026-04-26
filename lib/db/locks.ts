// In-memory mutex for demo mode.
// Supabase path would use: pg_advisory_xact_lock(hashtext('case:' || case_id))

const lockTails = new Map<string, Promise<void>>()

async function acquireLock(key: string): Promise<() => void> {
  const previous = lockTails.get(key) ?? Promise.resolve()
  let releaseCurrent!: () => void
  const current = new Promise<void>(resolve => {
    releaseCurrent = resolve
  })

  const next = previous.then(() => current)
  lockTails.set(key, next)
  await previous

  let released = false
  return () => {
    if (released) return
    released = true
    releaseCurrent()
    if (lockTails.get(key) === next) {
      lockTails.delete(key)
    }
  }
}

export async function acquireCaseLock(caseId: string): Promise<() => void> {
  // Supabase: pg_advisory_xact_lock(hashtext('case:' || case_id))
  return acquireLock(`case:${caseId}`)
}

export async function acquireRunLock(runId: string): Promise<() => void> {
  // Supabase: pg_advisory_xact_lock(hashtext('run:' || run_id))
  return acquireLock(`run:${runId}`)
}
