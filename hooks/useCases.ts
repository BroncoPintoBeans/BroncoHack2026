import { useState, useEffect } from 'react'
import { listCases } from '@/lib/api/client'
import type { CaseRecord } from '@/lib/types/case'

const POLL_INTERVAL = 5000

export function useCases(): { cases: CaseRecord[]; isLoading: boolean; error: Error | null } {
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      try {
        const data = await listCases()
        if (!cancelled) {
          setCases(data.cases)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetch()
    const id = setInterval(fetch, POLL_INTERVAL)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return { cases, isLoading, error }
}
