import { sameOrigin, signOut } from "@/lib/access";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  await signOut();
  return new Response(null, { status: 303, headers: { Location: "/", "Cache-Control": "private, no-store" } });
}
