import { NextRequest, NextResponse } from 'next/server'

// Define protected routes
const protectedRoutes = ['/collector', '/brand', '/dashboard']

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtected) {
    // Authentication will be checked in each route handler
    // We can't use async cookies() in proxy, so we'll check in route handlers
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 