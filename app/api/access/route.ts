import { z } from "zod";
import { allowedAttempt, canUseEnrollment, checkPassword, createInvitation, enroll, getRole, sameOrigin, signIn } from "@/lib/access";

export const dynamic = "force-dynamic";
const role = z.enum(["coach", "student"]);
const code = z.string().regex(/^[A-Za-z0-9_-]{32}$/);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("sign-in"), role, password: z.string().min(1).max(128) }),
  z.object({ action: z.literal("check"), role, code }),
  z.object({ action: z.literal("enroll"), role, code, password: z.string().min(12).max(128) }),
  z.object({ action: z.literal("invite") }),
]);

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Open Studio Français to continue." }, 403);
  if (Number(request.headers.get("content-length")) > 2048) return reply({ error: "The request is too large." }, 413);
  if (!allowedAttempt(request)) return reply({ error: "Too many attempts. Try again in a minute." }, 429);
  let raw: unknown;
  try {
    const data = await request.text();
    if (data.length > 2048) return reply({ error: "The request is too large." }, 413);
    raw = JSON.parse(data);
  } catch {
    return reply({ error: "Check the form and try again." }, 400);
  }
  const validated = schema.safeParse(raw);
  if (!validated.success) return reply({ error: "Check the form and try again. New passwords need at least 12 characters." }, 400);
  const input = validated.data;

  try {
    if (input.action === "invite") {
      if (await getRole() !== "coach") return reply({ error: "The parent account creates invitations." }, 403);
      const invite = await createInvitation();
      return invite ? reply({ code: invite }, 201) : reply({ error: "The student account is already set up." }, 409);
    }
    if (input.action === "check") {
      return await canUseEnrollment(input.role, input.code) ? reply({ ok: true })
        : reply({ error: "This setup link has already been used, replaced, or expired." }, 403);
    }
    const valid = input.action === "enroll"
      ? await enroll(input.role, input.code, input.password)
      : await checkPassword(input.role, input.password);
    if (!valid) return reply({ error: input.action === "enroll"
      ? "This setup link has already been used, replaced, or expired."
      : "Check the account and password, then try again." }, 401);
    await signIn(input.role);
    return reply({ ok: true });
  } catch {
    return reply({ error: "Studio Français is temporarily unavailable. Try again in a moment." }, 503);
  }
}
