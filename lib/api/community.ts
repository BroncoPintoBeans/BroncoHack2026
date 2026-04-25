import type {
  CreateHelperRequestBody,
  CreateHelperRequestResponse,
  ListHelperRequestsQuery,
  ListHelperRequestsResponse,
  GetHelperRequestResponse,
  UpdateHelperRequestBody,
  UpdateHelperRequestResponse,
  CreateOfferBody,
  CreateOfferResponse,
  UpdateOfferBody,
  UpdateOfferResponse,
  CreateConversationBody,
  CreateConversationResponse,
  ListConversationsQuery,
  ListConversationsResponse,
  GetMessagesQuery,
  GetMessagesResponse,
  SendMessageBody,
  SendMessageResponse,
} from "@/lib/types/community";

const BASE = "";

async function apiFetch<T>(
  url: string,
  init?: RequestInit,
  userId?: string
): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (userId) headers["x-demo-user-id"] = userId;
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const communityApi = {
  escalateCase: (
    caseId: string,
    body: CreateHelperRequestBody,
    userId?: string
  ) =>
    apiFetch<CreateHelperRequestResponse>(
      `/api/cases/${caseId}/helper-request`,
      { method: "POST", body: JSON.stringify(body) },
      userId
    ),

  listHelperRequests: (query?: ListHelperRequestsQuery, userId?: string) => {
    const params = new URLSearchParams(
      query as Record<string, string>
    ).toString();
    return apiFetch<ListHelperRequestsResponse>(
      `/api/helper-requests${params ? `?${params}` : ""}`,
      {},
      userId
    );
  },

  getHelperRequest: (id: string, userId?: string) =>
    apiFetch<GetHelperRequestResponse>(`/api/helper-requests/${id}`, {}, userId),

  updateHelperRequest: (
    id: string,
    body: UpdateHelperRequestBody,
    userId?: string
  ) =>
    apiFetch<UpdateHelperRequestResponse>(
      `/api/helper-requests/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      userId
    ),

  createOffer: (requestId: string, body: CreateOfferBody, userId?: string) =>
    apiFetch<CreateOfferResponse>(
      `/api/helper-requests/${requestId}/offers`,
      { method: "POST", body: JSON.stringify(body) },
      userId
    ),

  respondToOffer: (
    requestId: string,
    offerId: string,
    body: UpdateOfferBody,
    userId?: string
  ) =>
    apiFetch<UpdateOfferResponse>(
      `/api/helper-requests/${requestId}/offers/${offerId}`,
      { method: "PATCH", body: JSON.stringify(body) },
      userId
    ),

  openConversation: (
    requestId: string,
    body: CreateConversationBody,
    userId?: string
  ) =>
    apiFetch<CreateConversationResponse>(
      `/api/helper-requests/${requestId}/conversation`,
      { method: "POST", body: JSON.stringify(body) },
      userId
    ),

  listConversations: (query?: ListConversationsQuery, userId?: string) => {
    const params = new URLSearchParams(
      query as Record<string, string>
    ).toString();
    return apiFetch<ListConversationsResponse>(
      `/api/conversations${params ? `?${params}` : ""}`,
      {},
      userId
    );
  },

  getMessages: (
    conversationId: string,
    query?: GetMessagesQuery,
    userId?: string
  ) => {
    const params = new URLSearchParams(
      query as Record<string, string>
    ).toString();
    return apiFetch<GetMessagesResponse>(
      `/api/conversations/${conversationId}/messages${params ? `?${params}` : ""}`,
      {},
      userId
    );
  },

  sendMessage: (
    conversationId: string,
    body: SendMessageBody,
    userId?: string
  ) =>
    apiFetch<SendMessageResponse>(
      `/api/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify(body) },
      userId
    ),
};
