// Next 16 (ex-middleware): protege las rutas por rol leyendo el JWT de la
// cookie httpOnly. Las API routes verifican además la sesión en cada handler
// (nunca confiar solo en el proxy — ver AGENTS.md §Convenciones).
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Rutas (customer) y (admin); las (public) no pasan por el proxy
  matcher: ["/admin/:path*", "/cart", "/orders/:path*", "/checkout/:path*"],
};
