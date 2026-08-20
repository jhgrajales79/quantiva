import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/register", "/api/cron"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // La landing pública vive en "/" exacto — no se puede meter en
  // PUBLIC_PATHS con startsWith porque "/" es prefijo de cualquier ruta,
  // lo que dejaría todo el sitio sin autenticación.
  const isPublic = pathname === "/" || PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/public");

  if (isPublic || isStaticAsset) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
