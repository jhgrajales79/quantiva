import { NextResponse } from "next/server";
import { getMarketStatusDetail } from "@/lib/cache";

export async function GET() {
  return NextResponse.json(getMarketStatusDetail());
}
