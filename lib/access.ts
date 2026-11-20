import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { changeRecord, readRecord } from "./records";

export type Role = "coach" | "student";
type Account = { salt: string; digest: string };
type Accounts = { coach?: Account; student?: Account; invite?: { hash: string; expires: number } };
type Session = { role: Role; expires: number };
const emptyAccounts = (): Accounts => ({});
const key = "accounts";
const cookieName = process.env.VERCEL ? "__Host-studio-session" : "studio-session";
const sessionAge = 14 * 24 * 60 * 60;
const inviteAge = 7 * 24 * 60 * 60 * 1000;
const limiter = new Map<string, { count: number; until: number }>();

function signingKey() {
  return process.env.STUDIO_SESSION_KEY;
}

function same(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export async function getRole(): Promise<Role | null> {
  const secret = signingKey();
  const value = (await cookies()).get(cookieName)?.value;
  if (!secret || secret.length < 32 || !value || value.length > 200) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [body, sign] = parts;
  if (!same(signature(body, secret), sign)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (payload.expires <= Date.now() || !Number.isFinite(payload.expires)) return null;
    return payload.role === "coach" || payload.role === "student" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function signIn(role: Role) {
  const secret = signingKey();
  if (!secret || secret.length < 32) throw new Error("Studio sign-in is being configured.");
  const payload = { role, expires: Date.now() + sessionAge * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  (await cookies()).set(cookieName, body + "." + signature(body, secret), {
    httpOnly: true, secure: Boolean(process.env.VERCEL), sameSite: "lax", path: "/", maxAge: sessionAge,
  });
}

export async function signOut() {
  (await cookies()).set(cookieName, "", {
    httpOnly: true, secure: Boolean(process.env.VERCEL), sameSite: "lax", path: "/", maxAge: 0,
  });
}

export function allowedAttempt(request: Request) {
  const now = Date.now();
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const identity = digest(ip);
  const current = limiter.get(identity);
  if (current && current.until > now) {
    if (current.count >= 12) return false;
    current.count++;
    return true;
  }
  for (const [id, entry] of limiter) if (entry.until <= now) limiter.delete(id);
  if (limiter.size >= 1000) return false;
  limiter.set(identity, { count: 1, until: now + 60000 });
  return true;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configuredOrigin = process.env.STUDIO_ORIGIN;
  if (configuredOrigin) return origin === configuredOrigin;
  return !process.env.VERCEL && origin === new URL(request.url).origin;
}

async function passwordDigest(password: string, salt: string) {
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
  return derived.toString("base64url");
}

export async function checkPassword(role: Role, password: string) {
  const accounts = await readRecord(key, emptyAccounts);
  const account = accounts[role];
  const computed = await passwordDigest(password, account?.salt ?? "studio-missing-account-salt");
  return account ? same(account.digest, computed) : false;
}

export async function studentIsSetUp() {
  return Boolean((await readRecord(key, emptyAccounts)).student);
}

export async function createInvitation() {
  const code = randomBytes(24).toString("base64url");
  return changeRecord(key, emptyAccounts, accounts => {
    if (!accounts.coach || accounts.student) return { result: null };
    return { value: { ...accounts, invite: { hash: digest(code), expires: Date.now() + inviteAge } }, result: code };
  });
}

export async function canUseEnrollment(role: Role, code: string) {
  return validEnrollment(await readRecord(key, emptyAccounts), role, code);
}

function validEnrollment(accounts: Accounts, role: Role, code: string) {
  if (accounts[role]) return false;
  const hash = digest(code);
  if (role === "coach") {
    const bootstrap = process.env.STUDIO_SETUP_HASH;
    return Boolean(bootstrap && same(bootstrap, hash));
  }
  return Boolean(accounts.coach && accounts.invite && accounts.invite.expires > Date.now() && same(accounts.invite.hash, hash));
}

export async function enroll(role: Role, code: string, password: string) {
  const accounts = await readRecord(key, emptyAccounts);
  if (!validEnrollment(accounts, role, code)) return false;
  const salt = randomBytes(24).toString("base64url");
  const account = { salt, digest: await passwordDigest(password, salt) };
  return changeRecord(key, emptyAccounts, current => {
    if (!validEnrollment(current, role, code)) return { result: false };
    const rotated = { ...current, [role]: account };
    if (role === "student") delete rotated.invite;
    return { value: rotated, result: true };
  });
}
