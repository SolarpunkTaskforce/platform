import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const redirectFundingPath = (request: NextRequest, prefix: string) => {
  const { pathname, search } = request.nextUrl;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    const targetPath = pathname.replace(prefix, "/funding");
    return NextResponse.redirect(new URL(`${targetPath}${search}`, request.url));
  }
  return null;
};

export function middleware(request: NextRequest) {
  const grantsRedirect = redirectFundingPath(request, "/grants");
  if (grantsRedirect) return grantsRedirect;

  const findGrantsRedirect = redirectFundingPath(request, "/find-grants");
  if (findGrantsRedirect) return findGrantsRedirect;

  return NextResponse.next();
}

export const config = {
  matcher: ["/grants/:path*", "/find-grants/:path*"],
};
