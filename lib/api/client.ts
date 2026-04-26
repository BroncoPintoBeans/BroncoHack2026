import type {
  ListCasesResponse,
  CreateCaseRequest,
  CreateCaseResponse,
  GetCaseResponse,
  UpdateCaseRequest,
  UpdateCaseResponse,
  CreateMediaRequest,
  CreateMediaResponse,
  StartRunResponse,
  FollowupRequest,
  FollowupResponse,
  GetCurrentResponse,
  GetEventsResponse,
} from '@/lib/types/api'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') message = body.error
    } catch {
      // ignore parse failure
    }
    throw new ApiError(message, res.status)
  }
  return res.json() as Promise<T>
}

export function listCases(): Promise<ListCasesResponse> {
  return apiFetch<ListCasesResponse>('/api/cases')
}

export function createCase(body: CreateCaseRequest): Promise<CreateCaseResponse> {
  return apiFetch<CreateCaseResponse>('/api/cases', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getCase(id: string): Promise<GetCaseResponse> {
  return apiFetch<GetCaseResponse>(`/api/cases/${id}`)
}

export function updateCase(id: string, body: UpdateCaseRequest): Promise<UpdateCaseResponse> {
  return apiFetch<UpdateCaseResponse>(`/api/cases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function createMedia(id: string, body: CreateMediaRequest): Promise<CreateMediaResponse> {
  return apiFetch<CreateMediaResponse>(`/api/cases/${id}/media`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function startRun(id: string): Promise<StartRunResponse> {
  return apiFetch<StartRunResponse>(`/api/cases/${id}/run`, { method: 'POST' })
}

export function submitFollowup(
  id: string,
  runId: string,
  answer: string,
): Promise<FollowupResponse> {
  const body: FollowupRequest = { answer }
  return apiFetch<FollowupResponse>(`/api/cases/${id}/runs/${runId}/followup`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getCurrentCase(id: string): Promise<GetCurrentResponse> {
  return apiFetch<GetCurrentResponse>(`/api/cases/${id}/current`)
}

export function getEvents(id: string): Promise<GetEventsResponse> {
  return apiFetch<GetEventsResponse>(`/api/cases/${id}/events`)
}
