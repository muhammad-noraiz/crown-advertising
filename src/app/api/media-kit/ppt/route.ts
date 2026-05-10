import { NextResponse } from "next/server";

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/api/locations-showcase/ppt", request.url), 307);
}
