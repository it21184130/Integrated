import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Variable to store request counts for DDoS detection
const requestCounts: Record<string, number> = {};
const THRESHOLD = 100; // Requests per minute threshold

// Clean up old request counts every minute
setInterval(() => {
  for (const ip in requestCounts) {
    delete requestCounts[ip];
  }
}, 60000);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "Unknown";
  const ip = request.ip || request.headers.get("x-forwarded-for") || "Unknown";
  const referer = request.headers.get("referer") || "Direct";
  const method = request.method;
  const url = `${pathname}${search}`;
  const timestamp = new Date().toISOString();

  // Skip logging API calls to avoid infinite loops
  if (!pathname.startsWith("/api/log-request")) {
    // Increment request count for this IP
    requestCounts[ip] = (requestCounts[ip] || 0) + 1;

    // Determine if this might be a DoS attack
    const isSuspicious = requestCounts[ip] > THRESHOLD / 2;
    const isAttack = requestCounts[ip] > THRESHOLD;

    // Log the request data via API route (non-blocking)
    // We use fetch in a way that doesn't block the response
    try {
      const logData = {
        timestamp,
        ip,
        method,
        url,
        userAgent,
        referer,
        status: isAttack ? "blocked" : isSuspicious ? "suspicious" : "normal",
        requestCount: requestCounts[ip],
      };

      // Use setTimeout to make this non-blocking
      setTimeout(() => {
        fetch(`${request.nextUrl.origin}/api/log-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(logData),
        }).catch((error) => {
          console.error("Failed to log request:", error);
        });
      }, 0);

      // If this looks like an attack, optionally block it
      if (isAttack && !pathname.startsWith("/admin")) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        );
      }
    } catch (error) {
      console.error("Error in middleware:", error);
      // Continue even if logging fails
    }
  }

  // Continue with the request
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/* (app/public/images files)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
