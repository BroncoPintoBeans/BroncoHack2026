import { useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { submitFollowup } from '@/lib/api/client'

export function useFollowUp(
  caseId: string,
  runId: string,
): { submit: (answer: string) => Promise<void>; isSubmitting: boolean; error: ApiError | null } {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  async function submit(answer: string): Promise<void> {
    if (!runId) {
      setError(new ApiError('No active run available for follow-up', 400))
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await submitFollowup(caseId, runId, answer)
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Failed to submit follow-up', 500))
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submit, isSubmitting, error }
}
