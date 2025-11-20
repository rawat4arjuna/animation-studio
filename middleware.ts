
import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Allow API routes to be accessed without a session
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return true;
      }
      // For all other routes, require a session
      return !!token;
    },
  },
});

export const config = {
  // Match all routes except for the ones that should always be public
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     * - signup
     * - forgot-password
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|signup|forgot-password).*)',
  ],
}
