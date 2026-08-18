import { NextResponse } from "next/server";
import { isUsMarketOpen } from "@/lib/cache";

export async function GET() {
  return NextResponse.json({ status: isUsMarketOpen() });
}
