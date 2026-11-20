"use client";

import { AudioLines, LockKeyhole } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type Role = "coach" | "student";
type Enrollment = { role: Role; code: string };

async function requestAccess(data: object) {
  const response = await fetch("/api/access", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(problem.error ?? "Studio Français could not connect. Try again.");
  }
  return await response.json() as { ok?: boolean; code?: string };
}

export function AccessForm({ join = false }: { join?: boolean }) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [ready, setReady] = useState(!join);
  const [role, setRole] = useState<Role>("student");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!join) return;
    const values = new URLSearchParams(window.location.hash.slice(1));
    const setup = values.get("setup");
    const invite = values.get("invite");
    const raw = setup ?? invite;
    if (!raw || !/^[A-Za-z0-9_-]{32}$/.test(raw)) {
      setError("Open the personal setup link you received.");
      setReady(true);
      return;
    }
    const next: Enrollment = { role: setup ? "coach" : "student", code: raw };
    let active = true;
    requestAccess({ action: "check", ...next }).then(() => {
      if (active) setEnrollment(next);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : "The link could not be checked.");
    }).finally(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, [join]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (enrollment && password !== again) {
      setError("The two passwords need to match.");
      return;
    }
    setBusy(true);
    try {
      await requestAccess(enrollment
        ? { action: "enroll", ...enrollment, password }
        : { action: "sign-in", role, password });
      window.location.replace("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in could not be completed.");
      setBusy(false);
    }
  }

  return <main className="access-page">
    <div className="access-wrap">
      <a className="brand access-brand" href="/" aria-label="Studio Français home">
        <span className="brand-mark"><AudioLines size={23} /></span>
        <span className="wordmark">Studio <span>FRANÇAIS</span></span>
      </a>
      <section className="panel access-panel" aria-labelledby="access-title">
        <div className="panel-icon"><LockKeyhole size={21} /></div>
        <h1 id="access-title">{join ? enrollment?.role === "coach" ? "Set up parent access" : "Set up your account" : "Sign in to practise"}</h1>
        <p className="muted">{join ? "Choose a password for Studio Français." : "Private French practice for your family."}</p>
        {!ready && <p role="status">Checking your setup link…</p>}
        {ready && (!join || enrollment) && <form onSubmit={submit}>
          {!join && <fieldset>
            <legend>Account</legend>
            <div className="focus-options">
              <label className={role === "student" ? "choice chosen" : "choice"}><input type="radio" name="account" onChange={() => setRole("student")} checked={role === "student"} /> Student</label>
              <label className={role === "coach" ? "choice chosen" : "choice"}><input type="radio" name="account" onChange={() => setRole("coach")} checked={role === "coach"} /> Parent</label>
            </div>
          </fieldset>}
          <input type="text" className="access-username" tabIndex={-1} aria-hidden="true" autoComplete="username" name="username" value={enrollment?.role === "coach" || !join && role === "coach" ? "parent" : "student"} readOnly />
          <label>{join ? "Choose a password" : "Password"}<input type="password" name="password" required minLength={join ? 12 : undefined} maxLength={128} autoComplete={join ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} /></label>
          {join && <><p className="muted">Use at least 12 characters.</p><label>Confirm password<input type="password" name="confirmation" autoComplete="new-password" required maxLength={128} value={again} onChange={event => setAgain(event.target.value)} /></label></>}
          <button type="submit" className="button primary" disabled={busy}>{busy ? "Working…" : join ? "Create account" : "Sign in"}</button>
        </form>}
        {error && <p className="notice error" role="alert">{error}</p>}
        {join && <a className="text-button" href="/">Back to sign in</a>}
      </section>
    </div>
  </main>;
}

export function StudentInvitation({ joined }: { joined: boolean }) {
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { code } = await requestAccess({ action: "invite" });
      if (!code) throw new Error("The invitation could not be created.");
      setInvite(window.location.origin + "/join#invite=" + code);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The invitation could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(invite);
      setMessage("Copied.");
    } catch {
      setMessage("Select the link to copy it.");
    }
  }

  return <section className="panel invite-panel" aria-labelledby="invite-title">
    <div className="panel-icon"><LockKeyhole size={20} /></div>
    <div className="current-copy">
      <h2 id="invite-title">Student access</h2>
      <p>{joined ? "Her account is set up. Share this site’s main address if she needs the link again." : "Create a one-time link for your daughter. She’ll use it to choose her own password."}</p>
      {!joined && <>
        <button type="button" className="button secondary" disabled={busy} onClick={create}>{busy ? "Creating…" : invite ? "Replace invitation" : "Create student invitation"}</button>
        {invite && <div className="invite-link">
          <label>Invitation link<input value={invite} readOnly onFocus={event => event.currentTarget.select()} /></label>
          <button type="button" onClick={copy} className="button secondary">Copy link</button>
          <p className="muted">The link expires in seven days.</p>
        </div>}
      </>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="notice error">{error}</p>}
    </div>
  </section>;
}
