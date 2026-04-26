import type {
  HelperRequestCard,
  HelperRequestDetail,
  HelperRequestOffer,
  HelperRequestPermissions,
  HelperRequestStatus,
  CasePublicSummary,
  DiagnosisSnapshot,
  VerdictSnapshot,
  ActionPlanSnapshot,
} from "./helper-requests";
import type { ConversationSummary, MessageDTO } from "./conversations";

export interface PageInfo {
  next_cursor: string | null;
  limit: number;
}

// POST /api/cases/[id]/helper-request
export interface CreateHelperRequestBody {
  report_id: string;
  title?: string;
  public_summary?: string;
  campus_area?: string;
  preferred_time?: string;
  skill_tags?: string[];
  expires_at?: string;
}
export interface CreateHelperRequestResponse {
  helper_request: HelperRequestDetail;
  created: boolean;
}

// GET /api/helper-requests
export interface ListHelperRequestsQuery {
  status?: string;
  category?: string;
  urgency?: string;
  campus_area?: string;
  skill?: string;
  q?: string;
  mine?: "owner" | "helper";
  limit?: string;
  cursor?: string;
}
export interface ListHelperRequestsResponse {
  items: HelperRequestCard[];
  page: PageInfo;
}

// GET /api/helper-requests/[id]
export interface GetHelperRequestResponse {
  helper_request: HelperRequestDetail;
  case_summary: CasePublicSummary;
  diagnosis_context: DiagnosisSnapshot;
  verdict_context: VerdictSnapshot;
  action_plan_context: ActionPlanSnapshot;
  offers?: HelperRequestOffer[];
  conversation?: ConversationSummary | null;
  permissions: HelperRequestPermissions;
}

// PATCH /api/helper-requests/[id]
export interface UpdateHelperRequestBody {
  title?: string;
  public_summary?: string;
  campus_area?: string | null;
  preferred_time?: string | null;
  skill_tags?: string[];
  status?:
    | "open"
    | "in_progress"
    | "resolved"
    | "cancelled"
    | "expired"
    | "no_helper_found";
}
export interface UpdateHelperRequestResponse {
  helper_request: HelperRequestDetail;
}

// POST /api/helper-requests/[id]/offers
export interface CreateOfferBody {
  offer_message: string;
  availability?: string;
  skill_tags?: string[];
  technician_profile_id?: string;
}
export interface CreateOfferResponse {
  offer: HelperRequestOffer;
  helper_request_status: HelperRequestStatus;
}

// PATCH /api/helper-requests/[id]/offers/[offerId]
export interface UpdateOfferBody {
  action: "accept" | "decline" | "withdraw";
}
export interface UpdateOfferResponse {
  offer: HelperRequestOffer;
  helper_request: HelperRequestDetail;
  conversation?: ConversationSummary;
}

// POST /api/helper-requests/[id]/conversation
export interface CreateConversationBody {
  offer_id?: string;
  initial_message?: string;
}
export interface CreateConversationResponse {
  conversation: ConversationSummary;
}

// GET /api/conversations
export interface ListConversationsQuery {
  type?: "case_helper";
  limit?: string;
  cursor?: string;
}
export interface ListConversationsResponse {
  items: ConversationSummary[];
  page: PageInfo;
}

// GET /api/conversations/[id]/messages
export interface GetMessagesQuery {
  limit?: string;
  before?: string;
}
export interface GetMessagesResponse {
  conversation: ConversationSummary;
  messages: MessageDTO[];
  page: PageInfo;
}

// POST /api/conversations/[id]/messages
export interface SendMessageBody {
  body: string;
  client_id?: string;
}
export interface SendMessageResponse {
  message: MessageDTO;
}
