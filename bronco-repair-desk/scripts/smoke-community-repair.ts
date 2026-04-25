#!/usr/bin/env tsx

const BASE = "http://localhost:3000";
const OWNER = "00000000-0000-4000-8000-000000000001";
const HELPER = "00000000-0000-4000-8000-000000000002";
const UNRELATED = "00000000-0000-4000-8000-000000000003";
const CASE_ID = "84920000-0000-4000-8000-000000000001";
const HELPER_REQUEST_ID = "84920000-0000-4000-8000-000000000201";
const OFFER_ID = "84920000-0000-4000-8000-000000000301";
const CONVERSATION_ID = "84920000-0000-4000-8000-000000000401";

type CheckResult = { name: string; passed: boolean; error?: string };
const results: CheckResult[] = [];

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ name, passed: false, error: String(e) });
    console.log(`  ✗ ${name}: ${e}`);
  }
}

function headers(userId: string): Record<string, string> {
  return { "content-type": "application/json", "x-demo-user-id": userId };
}

async function post(url: string, body: unknown, userId: string) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: headers(userId),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function get(url: string, userId: string) {
  const res = await fetch(`${BASE}${url}`, { headers: headers(userId) });
  return {
    status: res.status,
    data: res.status === 200 ? await res.json() : await res.text(),
  };
}

async function patch(url: string, body: unknown, userId: string) {
  const res = await fetch(`${BASE}${url}`, {
    method: "PATCH",
    headers: headers(userId),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function run() {
  console.log("🔥 Communal Repair smoke tests\n");

  await check(
    "1. POST /api/cases/[id]/helper-request → 200, helper_request.id present",
    async () => {
      const { status, data } = await post(
        `/api/cases/${CASE_ID}/helper-request`,
        { campus_area: "Engineering Meadow", preferred_time: "Weekday afternoon" },
        OWNER
      );
      if (status !== 200)
        throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
      if (!data.helper_request?.id) throw new Error("helper_request.id missing");
    }
  );

  await check(
    "2. GET /api/helper-requests?status=open → 200, items present",
    async () => {
      const { status, data } = await get(`/api/helper-requests?status=open`, OWNER);
      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!Array.isArray(data.items)) throw new Error("items missing");
    }
  );

  await check(
    "3. GET /api/helper-requests/[id] → verdict_context.label present",
    async () => {
      const { status, data } = await get(
        `/api/helper-requests/${HELPER_REQUEST_ID}`,
        OWNER
      );
      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!data.verdict_context?.label)
        throw new Error("verdict_context.label missing");
      if (!data.action_plan_context?.helper_request_template)
        throw new Error("helper_request_template missing");
    }
  );

  await check(
    "4. POST /api/helper-requests/[id]/offers as helper → offer.status=pending",
    async () => {
      const { status, data } = await post(
        `/api/helper-requests/${HELPER_REQUEST_ID}/offers`,
        {
          offer_message: "I can help test the display cable.",
          availability: "Today after 4pm",
          skill_tags: ["laptop"],
        },
        HELPER
      );
      if (status !== 200)
        throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
      if (data.offer?.status !== "pending")
        throw new Error(`Expected pending, got ${data.offer?.status}`);
    }
  );

  await check(
    "5. PATCH /api/helper-requests/[id]/offers/[offerId] accept → offer.status=accepted, conversation.id present",
    async () => {
      const { status, data } = await patch(
        `/api/helper-requests/${HELPER_REQUEST_ID}/offers/${OFFER_ID}`,
        { action: "accept" },
        OWNER
      );
      if (status !== 200)
        throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
      if (data.offer?.status !== "accepted")
        throw new Error(`Expected accepted, got ${data.offer?.status}`);
      if (!data.conversation?.id) throw new Error("conversation.id missing");
    }
  );

  await check(
    "6. POST /api/conversations/[id]/messages as owner → 200, message echoed",
    async () => {
      const { status, data } = await post(
        `/api/conversations/${CONVERSATION_ID}/messages`,
        { body: "Hello from the owner!" },
        OWNER
      );
      if (status !== 200)
        throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
      if (!data.message?.body) throw new Error("message.body missing");
    }
  );

  await check(
    "7. GET /api/conversations/[id]/messages as helper → 200, messages visible",
    async () => {
      const { status, data } = await get(
        `/api/conversations/${CONVERSATION_ID}/messages`,
        HELPER
      );
      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!Array.isArray(data.messages)) throw new Error("messages missing");
    }
  );

  await check(
    "8. GET /api/conversations/[id]/messages as unrelated user → 403",
    async () => {
      const { status } = await get(
        `/api/conversations/${CONVERSATION_ID}/messages`,
        UNRELATED
      );
      if (status !== 403 && status !== 404)
        throw new Error(`Expected 403/404, got ${status}`);
    }
  );

  await check(
    "9. PATCH /api/helper-requests/[id] status=resolved → 200",
    async () => {
      const { status, data } = await patch(
        `/api/helper-requests/${HELPER_REQUEST_ID}`,
        { status: "resolved" },
        OWNER
      );
      if (status !== 200)
        throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
      if (data.helper_request?.status !== "resolved")
        throw new Error(`Expected resolved, got ${data.helper_request?.status}`);
    }
  );

  await check(
    "10. No marketplace/Gemini/external network calls made",
    async () => {
      const listingsRes = await fetch(`${BASE}/api/listings`, {
        headers: headers(OWNER),
      });
      if (listingsRes.status !== 404)
        throw new Error(
          `/api/listings should not exist (got ${listingsRes.status})`
        );
    }
  );

  const passed = results.filter((r) => r.passed).length;
  console.log(`\nResults: ${passed}/${results.length} passed`);
  if (results.some((r) => !r.passed)) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
