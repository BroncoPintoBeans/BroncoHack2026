import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId } from "@/lib/auth/demo-user";
import { createHelperRequestSchema } from "@/lib/schemas/community/helper-requests";
import {
  escalateToHelperRequest,
} from "@/lib/services/community/helper-request-service";
import { getCase } from "@/lib/db/queries/cases";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const caseRow = await getCase(caseId);
    if (!caseRow) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if (caseRow.userId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createHelperRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid request", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const result = await escalateToHelperRequest(caseId, userId, parsed.data);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    const status = e.status ?? 500;
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status }
    );
  }
}
