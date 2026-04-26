import { useState, useEffect, useRef } from 'react'
import { ApiError } from '@/lib/api/client'
import { getCurrentCase, getEvents } from '@/lib/api/client'
import type { CurrentCaseOutput, CaseEventRecord } from '@/lib/types/case'

const POLL_INTERVAL = 2000
const ACTIVE_STATUSES = new Set(['running', 'awaiting_user'])

export function useCaseRun(id: string): {
  snapshot: CurrentCaseOutput | null
  events: CaseEventRecord[]
  isLoading: boolean
  error: ApiError | null
} {
  const [snapshot, setSnapshot] = useState<CurrentCaseOutput | null>(null)
  const [events, setEvents] = useState<CaseEventRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const pollingRef = useRef(true)

  useEffect(() => {
    pollingRef.current = true
    let cancelled = false

    async function poll() {
      try {
        const [currentRes, eventsRes] = await Promise.all([
          getCurrentCase(id),
          getEvents(id),
        ])
        if (cancelled) return

        setSnapshot(currentRes.snapshot)
        setEvents(eventsRes.events)
        setError(null)
        setIsLoading(false)

        const runStatus = currentRes.snapshot.currentRun?.status
        if (runStatus && !ACTIVE_STATUSES.has(runStatus)) {
          pollingRef.current = false
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err : new ApiError('Failed to load case data', 500))
          setIsLoading(false)
          pollingRef.current = true
        }
      }
    }

    poll()

    const id_ = setInterval(() => {
      if (pollingRef.current) poll()
    }, POLL_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(id_)
    }
  }, [id])

  return { snapshot, events, isLoading, error }
}
