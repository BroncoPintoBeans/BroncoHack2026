import { NextRequest } from "next/server";

export const DEMO_USER_ID =
  process.env.DEMO_USER_ID ?? "00000000-0000-4000-8000-000000000001";
export const DEMO_HELPER_USER_ID =
  process.env.DEMO_HELPER_USER_ID ?? "00000000-0000-4000-8000-000000000002";

export function getCurrentUserId(req: NextRequest): string {
  return req.headers.get("x-demo-user-id") ?? DEMO_USER_ID;
}
