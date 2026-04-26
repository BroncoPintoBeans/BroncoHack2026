import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  return NextResponse.json(
    { error: "Start marketplace chats from /messages?listing=<id>; the conversation is created only when the first message is sent." },
    { status: 410 }
  );
}
