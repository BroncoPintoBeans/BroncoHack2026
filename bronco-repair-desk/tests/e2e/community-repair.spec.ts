/**
 * Communal Repair E2E test suite.
 *
 * Playwright is not yet installed. These tests are structured as plain
 * describe/it blocks (commented out) that document the expected HTTP
 * interactions. Once `@playwright/test` is added as a dev dependency,
 * uncomment the test bodies and run:
 *
 *   npx playwright test tests/e2e/community-repair.spec.ts
 *
 * Auth is via X-Demo-User-Id header (no real auth required in dev).
 */

import {
  OWNER_USER_ID,
  HELPER_USER_ID,
  SECOND_HELPER_USER_ID,
  CASE_ID,
  HELPER_REQUEST_ID,
  OFFER_ID,
  CONVERSATION_ID,
} from "@/tests/fixtures/community";

// Re-export IDs so they appear in module scope for documentation purposes
export const ids = {
  OWNER_USER_ID,
  HELPER_USER_ID,
  SECOND_HELPER_USER_ID,
  CASE_ID,
  HELPER_REQUEST_ID,
  OFFER_ID,
  CONVERSATION_ID,
} as const;

/**
 * TODO: Install Playwright and uncomment the following test suite.
 *
 * Install command:
 *   npm install --save-dev @playwright/test
 *   npx playwright install chromium
 *
 * Then replace the block below with the uncommented version.
 */

/*
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

function headers(userId: string) {
  return {
    "content-type": "application/json",
    "x-demo-user-id": userId,
  };
}

test.describe("Communal Repair — API smoke suite", () => {
  test("1. escalate case: POST /api/cases/[id]/helper-request returns 200 with helper_request.id", async ({
    request,
  }) => {
    const res = await request.post(
      `${BASE}/api/cases/${CASE_ID}/helper-request`,
      {
        headers: headers(OWNER_USER_ID),
        data: {
          campus_area: "Engineering Meadow",
          preferred_time: "Weekday afternoon",
        },
      }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.helper_request?.id).toBeTruthy();
  });

  test("2. board list: GET /api/helper-requests?status=open returns 200 with items array", async ({
    request,
  }) => {
    const res = await request.get(
      `${BASE}/api/helper-requests?status=open`,
      { headers: headers(OWNER_USER_ID) }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("3. detail: GET /api/helper-requests/[id] returns verdict_context.label and helper_request_template", async ({
    request,
  }) => {
    const res = await request.get(
      `${BASE}/api/helper-requests/${HELPER_REQUEST_ID}`,
      { headers: headers(OWNER_USER_ID) }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.verdict_context?.label).toBeTruthy();
    expect(body.action_plan_context?.helper_request_template).toBeTruthy();
  });

  test("4. offer: POST /api/helper-requests/[id]/offers as helper returns offer with status=pending", async ({
    request,
  }) => {
    const res = await request.post(
      `${BASE}/api/helper-requests/${HELPER_REQUEST_ID}/offers`,
      {
        headers: headers(HELPER_USER_ID),
        data: {
          offer_message: "I can help test the display cable.",
          availability: "Today after 4pm",
          skill_tags: ["laptop"],
        },
      }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.offer?.status).toBe("pending");
  });

  test("5. accept: PATCH /api/helper-requests/[id]/offers/[offerId] accept returns accepted offer and conversation.id", async ({
    request,
  }) => {
    const res = await request.patch(
      `${BASE}/api/helper-requests/${HELPER_REQUEST_ID}/offers/${OFFER_ID}`,
      {
        headers: headers(OWNER_USER_ID),
        data: { action: "accept" },
      }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.offer?.status).toBe("accepted");
    expect(body.conversation?.id).toBeTruthy();
  });

  test("6. message: POST /api/conversations/[id]/messages as owner returns 200 with echoed message body", async ({
    request,
  }) => {
    const res = await request.post(
      `${BASE}/api/conversations/${CONVERSATION_ID}/messages`,
      {
        headers: headers(OWNER_USER_ID),
        data: { body: "Hello from the owner!" },
      }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message?.body).toBeTruthy();
  });

  test("7. message: GET /api/conversations/[id]/messages as helper returns 200 with messages array", async ({
    request,
  }) => {
    const res = await request.get(
      `${BASE}/api/conversations/${CONVERSATION_ID}/messages`,
      { headers: headers(HELPER_USER_ID) }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.messages)).toBe(true);
  });

  test("8. non-participant denied: GET /api/conversations/[id]/messages as unrelated user returns 403 or 404", async ({
    request,
  }) => {
    const res = await request.get(
      `${BASE}/api/conversations/${CONVERSATION_ID}/messages`,
      { headers: headers(SECOND_HELPER_USER_ID) }
    );
    expect([403, 404]).toContain(res.status());
  });

  test("9. resolve close: PATCH /api/helper-requests/[id] status=resolved returns 200 with resolved status", async ({
    request,
  }) => {
    const res = await request.patch(
      `${BASE}/api/helper-requests/${HELPER_REQUEST_ID}`,
      {
        headers: headers(OWNER_USER_ID),
        data: { status: "resolved" },
      }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.helper_request?.status).toBe("resolved");
  });

  test("10. No marketplace/Gemini routes: GET /api/listings returns 404", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/listings`, {
      headers: headers(OWNER_USER_ID),
    });
    expect(res.status()).toBe(404);
  });
});
*/
