import { auth0 } from "@/src/auth/auth0";
import { NextResponse } from "next/server";

export async function proxy(request: Request) {
  const url = new URL(request.url);

  if (url.hostname === "openaux.net") {
    url.hostname = "www.openaux.net";
    return NextResponse.redirect(url);
  }

  return auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
