import { createClient } from "@/lib/supabase/server";
import { getUserDisplayNames } from "./seller-profiles";

export interface MarketplaceConversationSummary {
  id: string;
  listingId: string;
  listingTitle: string;
  otherUserId: string;
  otherUserName: string;
  otherUserInitial: string;
  preview: string;
  lastMessageAt: string | null;
  updatedAt: string;
  unreadCount: number;
}

export interface MarketplaceMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  receiverUserId: string;
  body: string;
  createdAt: string;
}

interface ConversationRow {
  id: string;
  listing_id: string | null;
  conversation_type: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  body: string;
  created_at: string;
}

interface ListingRow {
  id: string;
  title: string;
  seller_id: string;
}

const CONVERSATION_SELECT = "id,listing_id,conversation_type,created_at,updated_at";

function initialFor(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

export async function sendMarketplaceListingMessage(listingId: string, body: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_listing_message", {
    p_listing_id: listingId,
    p_body: body,
  });

  if (error) {
    if (error.message.includes("listing not found")) {
      throw Object.assign(new Error("listing not found"), { status: 404 });
    }
    if (error.message.includes("cannot message your own listing")) {
      throw Object.assign(new Error("You cannot message yourself about your own listing."), { status: 400 });
    }
    throw new Error(error.message);
  }

  if (!data) throw new Error("Could not send this seller message.");

  return data as string;
}

export async function listMarketplaceConversations(userId: string) {
  const supabase = await createClient();
  const { data: messageData, error: messagesError } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,receiver_id,body,created_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(300);

  if (messagesError) throw new Error(messagesError.message);

  const messageRows = ((messageData ?? []) as MessageRow[]).filter((message) => message.receiver_id);
  if (messageRows.length === 0) return [];

  const latestByConversation = new Map<string, MessageRow>();
  for (const message of messageRows) {
    if (!latestByConversation.has(message.conversation_id)) {
      latestByConversation.set(message.conversation_id, message);
    }
  }

  const conversationIds = [...latestByConversation.keys()];

  const { data: conversations, error: conversationError } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .in("id", conversationIds)
    .eq("conversation_type", "listing")
    .order("updated_at", { ascending: false });

  if (conversationError) throw new Error(conversationError.message);

  const conversationRows = ((conversations ?? []) as ConversationRow[]).filter((row) => row.listing_id);
  if (conversationRows.length === 0) return [];

  const listingIds = [...new Set(conversationRows.map((row) => row.listing_id!).filter(Boolean))];

  const { data: listings, error: listingsError } = await supabase
    .from("marketplace_listings")
    .select("id,title,seller_id")
    .in("id", listingIds);

  if (listingsError) throw new Error(listingsError.message);

  const listingById = new Map(((listings ?? []) as ListingRow[]).map((listing) => [listing.id, listing]));
  const userIds = [
    ...new Set(
      messageRows.flatMap((message) => [message.sender_id, message.receiver_id]).filter(Boolean) as string[]
    ),
  ];
  const displayNamesById = await getUserDisplayNames(userIds, supabase);

  return conversationRows.flatMap((conversation): MarketplaceConversationSummary[] => {
    const listing = listingById.get(conversation.listing_id!);
    const latest = latestByConversation.get(conversation.id);
    if (!latest?.receiver_id) return [];

    const otherUserId = latest.sender_id === userId ? latest.receiver_id : latest.sender_id;
    const otherUserName = displayNamesById.get(otherUserId) ?? "Seller";

    return [{
      id: conversation.id,
      listingId: conversation.listing_id!,
      listingTitle: listing?.title ?? "Marketplace listing",
      otherUserId,
      otherUserName,
      otherUserInitial: initialFor(otherUserName),
      preview: latest?.body ?? "",
      lastMessageAt: latest?.created_at ?? null,
      updatedAt: conversation.updated_at,
      unreadCount: 0,
    }];
  });
}

export async function listMarketplaceMessages(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,receiver_id,body,created_at")
    .eq("conversation_id", conversationId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw new Error(error.message);

  return ((data ?? []) as MessageRow[]).map((message): MarketplaceMessage => ({
    id: message.id,
    conversationId: message.conversation_id,
    senderUserId: message.sender_id,
    receiverUserId: message.receiver_id ?? "",
    body: message.body,
    createdAt: message.created_at,
  }));
}

export async function getMarketplaceConversationReplyRecipient(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("sender_id,receiver_id,created_at")
    .eq("conversation_id", conversationId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.receiver_id) return null;

  return data.sender_id === userId ? data.receiver_id : data.sender_id;
}
