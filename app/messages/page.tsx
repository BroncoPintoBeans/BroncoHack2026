import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import MessagesSeenTracker from "./MessagesSeenTracker";
import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";
import {
  getMarketplaceConversationReplyRecipient,
  listMarketplaceConversations,
  listMarketplaceMessages,
  sendMarketplaceListingMessage,
} from "@/lib/db/marketplace/conversations";
import { getMarketplaceListingById } from "@/lib/db/marketplace/listings";
import { getUser } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatChatTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

async function sendMarketplaceMessage(formData: FormData) {
  "use server";

  const user = await getUser();
  if (!user) return;

  const conversationId = String(formData.get("conversationId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if ((!conversationId && !listingId) || !body) return;

  let resolvedConversationId = conversationId;
  let receiverId: string | null = null;

  if (listingId) {
    const listing = await getMarketplaceListingById(listingId);
    if (!listing || listing.sellerId === user.id) return;

    resolvedConversationId = await sendMarketplaceListingMessage(listingId, body);
    revalidatePath("/messages");
    redirect(`/messages?conversation=${resolvedConversationId}&direct=1`);
  } else if (conversationId) {
    receiverId = await getMarketplaceConversationReplyRecipient(conversationId, user.id);
  }

  if (!resolvedConversationId || !receiverId) return;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: resolvedConversationId,
    sender_id: user.id,
    receiver_id: receiverId,
    body,
    created_at: now,
  });

  if (messageError) return;

  await supabase.from("conversations").update({ updated_at: now }).eq("id", resolvedConversationId);
  revalidatePath("/messages");
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; direct?: string; listing?: string }>;
}) {
  const [{ conversation: selectedConversationId, direct, listing: draftListingId }, user] = await Promise.all([
    searchParams,
    getUser(),
  ]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f9faf2]">
        <Navbar />
        <main className="max-w-[720px] mx-auto px-6 py-16">
          <h1 className="font-bold text-[#012d1d] text-[32px] tracking-tight">Chats</h1>
          <p className="text-[#414844] text-base mt-3">Sign in to see your marketplace conversations.</p>
          <Link
            href="/"
            className="inline-flex mt-6 bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] px-5 py-3 rounded-lg hover:bg-[#012d1d] transition-colors"
          >
            Sign in
          </Link>
        </main>
      </div>
    );
  }

  const [conversationsWithMessages, draftListing] = await Promise.all([
    listMarketplaceConversations(user.id),
    draftListingId ? getMarketplaceListingById(draftListingId) : Promise.resolve(null),
  ]);
  const activeConversation = selectedConversationId
    ? conversationsWithMessages.find((conversation) => conversation.id === selectedConversationId) ?? null
    : conversationsWithMessages[0] ?? null;
  const activeMessages = activeConversation
    ? await listMarketplaceMessages(activeConversation.id, user.id)
    : [];
  const latestActiveMessageAt =
    activeMessages[activeMessages.length - 1]?.createdAt ??
    activeConversation?.lastMessageAt ??
    null;
  const isDirectChat = Boolean(direct || draftListing);
  const draftRecipientName = draftListing?.sellerName ?? "Seller";
  const draftRecipientInitial = draftRecipientName[0]?.toUpperCase() ?? "S";
  const headerName = draftListing ? draftRecipientName : activeConversation?.otherUserName;
  const headerInitial = draftListing ? draftRecipientInitial : activeConversation?.otherUserInitial;
  const headerListingTitle = draftListing ? draftListing.title : activeConversation?.listingTitle;
  const headerListingId = draftListing ? draftListing.id : activeConversation?.listingId;
  const canRenderChat = Boolean(activeConversation || draftListing);

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <MessagesSeenTracker
        conversationId={activeConversation?.id ?? null}
        seenAt={latestActiveMessageAt}
      />
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col" style={{ height: "calc(100vh - 73px)" }}>
        <div className="min-h-0 flex-1 bg-white border border-[#e2e3db] rounded-2xl shadow-[0px_4px_20px_0px_rgba(27,67,50,0.06)] overflow-hidden flex">
          {!isDirectChat ? (
          <div className="w-80 border-r border-[#e2e3db] flex flex-col shrink-0">
            <div className="p-5 border-b border-[#e2e3db]">
              <h2 className="font-semibold text-[#1a1c18] text-xl mb-3">Chats</h2>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#717973" strokeWidth="1.2"/><path d="M12 12l-1.5-1.5" stroke="#717973" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <input className="w-full bg-[#f3f4ec] border border-[#e2e3db] rounded-full pl-9 pr-4 py-2 text-sm text-[#414844] outline-none" placeholder="Search chats..." />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {conversationsWithMessages.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/messages?conversation=${conversation.id}`}
                  className={`p-4 border-b border-[#e2e3db] flex items-start gap-3 cursor-pointer hover:bg-[#f9faf2] transition-colors ${
                    activeConversation?.id === conversation.id ? "bg-[#f3f4ec]" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1b4332] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {conversation.otherUserInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-[#1a1c18] text-sm truncate">{conversation.otherUserName}</span>
                      <span className="text-[#717973] text-xs shrink-0">{formatChatTime(conversation.lastMessageAt ?? conversation.updatedAt)}</span>
                    </div>
                    <p className="text-[#414844] text-xs mb-0.5 truncate">{conversation.listingTitle}</p>
                    <p className="text-[#717973] text-xs truncate">{conversation.preview}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          ) : null}

          {!canRenderChat ? (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div className="max-w-sm">
                <p className="text-[#1a1c18] text-xl font-semibold">
                  {conversationsWithMessages.length === 0 ? "No chats yet" : "Select a chat"}
                </p>
                <p className="text-[#717973] text-sm mt-2">
                  {conversationsWithMessages.length === 0
                    ? "Message a seller from a marketplace listing and your conversations will appear here."
                    : "Choose an existing conversation from the list to keep messaging."}
                </p>
                {conversationsWithMessages.length === 0 ? (
                  <Link
                    href="/marketplace"
                    className="inline-flex mt-5 bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] px-5 py-3 rounded-lg hover:bg-[#012d1d] transition-colors"
                  >
                    Browse Marketplace
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0">
              {canRenderChat ? (
                <>
                  <div className="p-5 border-b border-[#e2e3db] flex items-center gap-3">
                    {isDirectChat ? (
                      <BackButton fallbackHref="/marketplace" label="Back" className="mr-2" />
                    ) : null}
                    <div className="w-10 h-10 rounded-full bg-[#1b4332] flex items-center justify-center text-white text-sm font-semibold">{headerInitial}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a1c18] text-base">{headerName}</p>
                      <p className="text-[#717973] text-xs">Re: {headerListingTitle}</p>
                    </div>
                    {headerListingId ? (
                      <Link
                        href={`/marketplace/${headerListingId}`}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#1b4332] border border-[#1b4332] rounded-lg px-3 py-1.5 hover:bg-[#1b4332] hover:text-white transition-colors"
                      >
                        View listing
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 9.5l7-7M9.5 9.5V2.5H2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </Link>
                    ) : null}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                    {activeMessages.length === 0 ? (
                      <div className="m-auto text-center max-w-sm">
                        <p className="text-[#1a1c18] text-base font-semibold">No messages yet</p>
                        <p className="text-[#717973] text-sm mt-1">Start the conversation about this listing below.</p>
                      </div>
                    ) : (
                      activeMessages.map((message) => {
                        const mine = message.senderUserId === user.id;
                        return (
                          <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[60%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${mine ? "bg-[#1b4332] text-white rounded-br-sm" : "bg-[#f3f4ec] text-[#1a1c18] rounded-bl-sm"}`}>
                              <p>{message.body}</p>
                              <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-[#717973]"}`}>{formatChatTime(message.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form action={sendMarketplaceMessage} className="p-4 border-t border-[#e2e3db] flex items-center gap-3">
                    <input type="hidden" name="conversationId" value={activeConversation?.id ?? ""} />
                    <input type="hidden" name="listingId" value={draftListing?.id ?? ""} />
                    <input name="body" className="flex-1 bg-[#f3f4ec] border border-[#e2e3db] rounded-full px-5 py-3 text-sm text-[#414844] outline-none" placeholder="Type a message..." />
                    <button type="submit" className="bg-[#1b4332] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#012d1d] transition-colors shrink-0" aria-label="Send message">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M10 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
