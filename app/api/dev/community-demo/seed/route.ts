import { NextResponse } from "next/server";
import { seedCommunityDemo } from "@/scripts/seed-community-demo";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  seedCommunityDemo();
  return NextResponse.json({ seeded: true });
}
