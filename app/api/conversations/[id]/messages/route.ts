import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import {
  getMessagesQuerySchema,
  sendMessageSchema,
} from "@/lib/schemas/community/conversations";
import { conversationRepository } from "@/lib/db/community/conversation-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getCurrentUserId(req);

    if (!conversationRepository.isParticipant(id, userId)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const conversation = conversationRepository.findById(id);
    if (!conversation) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = getMessagesQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid query", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const q = parsed.data;
    const limit = q.limit ? Math.min(parseInt(q.limit, 10), 100) : 50;

    const { messages, nextCursor } = conversationRepository.listMessages(
      id,
      limit,
      q.before
    );

    return NextResponse.json({
      conversation,
      messages,
      page: { next_cursor: nextCursor, limit },
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status: e.status ?? 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getCurrentUserId(req);

    if (!conversationRepository.isParticipant(id, userId)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid request", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    if (!conversationRepository.findById(id)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const message = conversationRepository.addMessage(
      id,
      userId,
      parsed.data.body.trim(),
      parsed.data.client_id
    );

    return NextResponse.json({ message });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status: e.status ?? 500 }
    );
  }
}
