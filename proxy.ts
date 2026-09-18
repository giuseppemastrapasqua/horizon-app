export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/((?!api/auth|calendar-feed|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
