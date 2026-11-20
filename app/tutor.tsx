"use client";

import { StudentInvitation } from "./access-form";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AudioLines, BookOpen, CalendarDays, Check, Headphones, Lightbulb, ListPlus, LockKeyhole, LogOut, RotateCcw } from "lucide-react";
import {
  exercisesFor, focusLabels, listeningTopic, musicTopic, quizTopic, speakingPrompts, starterTopic, suggestTopic,
  type Focus, type HomeView, type RunView, type Topic,
} from "@/lib/lesson";

type Pane = "home" | "topics" | "add" | "preview" | "practice" | "speak";
type Custom = {
  scene: string; sentence: string; cue: string; answer: string; hint: string;
  alternateScene: string; alternateSentence: string;
};
const emptyExercise: Custom = {
  scene: "", sentence: "", cue: "", answer: "", hint: "", alternateScene: "", alternateSentence: "",
};

async function api<T>(query = "", data?: object): Promise<T> {
  const response = await fetch("/api/tutor" + query, data ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  } : { cache: "no-store" });
  const result = await response.json().catch(() => ({ error: "Studio Français could not load. Try again." }));
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
      ? result.error
      : "Something went wrong. Try again.";
    throw new Error(message);
  }
  return result as T;
}

function Heading({ onBack, children, label }: { onBack: () => void; children: ReactNode; label: string }) {
  return <div className="section-heading">
    <button className="text-button back" type="button" onClick={onBack}>Back to {label.toLowerCase()}</button>
    <h1>{children}</h1>
  </div>;
}

function ErrorNote({ message }: { message: string }) {
  return message ? <p role="alert" className="notice error">{message}</p> : null;
}

export function Tutor() {
  const [home, setHome] = useState<HomeView | null>(null);
  const [pane, setPane] = useState<Pane>("home");
  const [run, setRun] = useState<RunView>();
  const [selected, setSelected] = useState<Topic>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    api<HomeView>().then(value => { if (active) setHome(value); })
      .catch(reason => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);

  const topics = home?.topics ?? [starterTopic];
  const topic = topics[0];
  const student = home?.role === "student";

  function navigate(next: Pane) {
    setError("");
    setPane(next);
    window.scrollTo(0, 0);
    if (next !== "practice") main.current?.focus();
  }

  async function openRun(topicOrSession: string, resume = false) {
    setBusy(true);
    setError("");
    try {
      const next = resume
        ? await api<RunView>("?session=" + encodeURIComponent(topicOrSession))
        : await api<RunView>("", { action: "start", topic: topicOrSession });
      setRun(next);
      navigate("practice");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function preview(value: Topic) {
    setSelected(value);
    navigate("preview");
  }

  async function returnHome() {
    navigate("home");
    if (home) {
      try { setHome(await api<HomeView>()); }
      catch (reason) { setError((reason as Error).message); }
    }
  }

  function added(value: Topic) {
    setHome(current => current ? { ...current, topics: [value, ...current.topics] } : current);
    preview(value);
  }

  return <>
    <header className="site-header">
      <div className="shell header-inner">
        <button className="brand" type="button" onClick={returnHome} aria-label="Studio Français home">
          <span className="brand-mark"><AudioLines size={23} /></span>
          <span className="wordmark">Studio <span>FRANÇAIS</span></span>
        </button>
        {!!home && <nav aria-label="Main navigation">
          <button className={pane === "home" || pane === "practice" ? "active" : ""} onClick={returnHome} aria-current={pane === "home" ? "page" : undefined}>{student ? "Practice" : "Home"}</button>
          <button className={pane !== "home" && pane !== "practice" && pane !== "speak" ? "active" : ""} onClick={() => navigate("topics")} aria-current={pane === "topics" ? "page" : undefined}>Class topics</button>
          <button className={pane === "speak" ? "active" : ""} onClick={() => navigate("speak")} aria-current={pane === "speak" ? "page" : undefined}>Speak</button>
        </nav>}
        <div className="account">
          {!!home && <><span className="role"><LockKeyhole size={14} /> {student ? "Student" : "Parent"}</span><form method="POST" action="/api/access/sign-out"><button type="submit" aria-label="Sign out" title="Sign out" className="icon-button"><LogOut size={18} /></button></form></>}
        </div>
      </div>
    </header>
    <main ref={main} tabIndex={-1} className="shell main-shell">
      {pane === "home" && <>
        <section className="hero" aria-labelledby="home-title">
          <div className="hero-copy">
            <p className="overline hero-overline"><Headphones size={17} /> Grade 7 Core French</p>
            <h1 id="home-title" lang="fr">Studio<br /><em>Français</em></h1>
            <p className="hero-description">Listen, practise, and get ready to talk about yourself in French.</p>
            {student ? <button className="button primary" disabled={busy} onClick={() => openRun(home?.study?.resume?.id ?? topic.id, Boolean(home?.study?.resume))}>
                {busy ? "Opening practice…" : home?.study?.resume ? "Resume practice" : "Start practice"}
              </button>
              : home ? <button className="button primary" onClick={() => navigate("add")}><ListPlus size={19} /> Add a topic</button>
              : <p role="status" className="loading">{error ? "Studio Français could not load." : "Loading your tutor…"}</p>}
          </div>
        </section>
        <ErrorNote message={error} />
        <div className="home-grid">
          <section className="panel current-topic">
            <div className="panel-icon"><BookOpen size={21} /></div>
            <div className="current-copy">
              <p className="overline">Current class topic</p>
              <h2 lang="fr">{topic.title}</h2>
              <p>{topic.notes}</p>
              <button type="button" className="text-button" onClick={() => preview(topic)}>Preview topic</button>
            </div>
          </section>
          <section className="panel training-card">
            <div className="panel-icon"><AudioLines size={21} /></div>
            <div className="current-copy">
              <p className="overline">Speaking warm-up</p>
              <h2>Rehearse a conversation</h2>
              <p>Hear a model, then try your own lines about dance, music, or meeting a teammate.</p>
              <button type="button" className="text-button" onClick={() => navigate("speak")}>Start speaking practice</button>
            </div>
          </section>
        </div>
        <section className="class-milestones" aria-label="Unit 2 practice">
          <div className="milestone-title"><CalendarDays size={20} /> Unit 2 practice</div>
          <button type="button" onClick={() => preview(listeningTopic)}><span>Nov 27</span> Listening task</button>
          <button type="button" onClick={() => preview(quizTopic)}><span>Dec 8</span> Irregular verb quiz</button>
          <button type="button" onClick={() => preview(musicTopic)}>Dance &amp; music</button>
          {student && !!home.study?.review && <span className="review-count"><RotateCcw size={16} /> {home.study.review} to revisit next time</span>}
        </section>
        {home?.role === "coach" && <StudentInvitation joined={Boolean(home.studentJoined)} />}
      </>}
      {pane === "topics" && <>
        <Heading onBack={returnHome} label="Home">Class topics</Heading>
        <div className="subhead"><p>Topics added by either account show up here.</p><button className="button primary" onClick={() => navigate("add")}><ListPlus size={18} /> Add a topic</button></div>
        <div className="topic-list">
          {topics.map((value, index) => <button type="button" key={value.id} className="panel topic-row" onClick={() => preview(value)}>
            <span className="panel-icon"><BookOpen size={19} /></span>
            <span className="topic-row-copy"><strong>{value.title}</strong><span>{value.notes}</span></span>
            {index === 0 && <span className="tag">Current</span>}
          </button>)}
        </div>
      </>}
      {pane === "add" && <TopicForm onAdded={added} onBack={() => navigate("topics")} />}
      {pane === "preview" && selected && <>
        <Heading onBack={() => navigate(home ? "topics" : "home")} label={home ? "Class topics" : "Home"}>{selected.title}</Heading>
        <div className="panel preview">
          <p className="source-note">{selected.notes}</p>
          <div className="tags">
            {selected.focuses.map(focus => <span key={focus} className="tag">{focusLabels[focus]}</span>)}
            {selected.custom.length > 0 && <span className="tag">Custom prompts</span>}
          </div>
          <h2>Sample prompts</h2>
          <Samples topic={selected} />
          {student && <button className="button primary" disabled={busy} onClick={() => openRun(selected.id)}>{busy ? "Opening practice…" : "Start this drill"}</button>}
          <ErrorNote message={error} />
        </div>
      </>}
      {pane === "speak" && <Speaking onBack={returnHome} />}
      {pane === "practice" && run && <Practice key={run.id} run={run} onChange={setRun} onExit={returnHome} />}
      <footer className="site-footer"><span><AudioLines size={16} /> Studio Français</span><span>{student ? "Your practice is private to this account." : "Grade 7 French practice"}</span></footer>
    </main>
  </>;
}

function Samples({ topic }: { topic: Pick<Topic, "focuses" | "verbs" | "custom"> }) {
  const bank = exercisesFor(topic);
  const seen = new Set<string>();
  const unique = bank.filter(exercise => !seen.has(exercise.skill) && seen.add(exercise.skill));
  const byFocus = topic.focuses.flatMap(focus => unique.find(exercise => exercise.id.startsWith(focus + ":")) ?? []);
  const sample = [...new Set([...byFocus, ...unique])].slice(0, 4);
  return sample.length > 0 && <ul className="samples">
    {sample.map(value => <li key={value.id}>
      <span>{value.scene}</span>
      {value.audio ? <span className="audio-cue"><Headphones size={17} /> Listening prompt</span> : <>
        <strong lang="fr">{value.sentence}</strong><span className="cue">Cue <b>{value.cue}</b></span>
      </>}
    </li>)}
  </ul>;
}

function FrenchAudio({ src, label }: { src: string; label: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [slow, setSlow] = useState(false);
  function toggleTempo() {
    if (audio.current) audio.current.playbackRate = slow ? 1 : 0.8;
    setSlow(value => !value);
  }
  return <div className="audio-controls">
    <audio ref={audio} controls preload="metadata" src={src} aria-label={label} />
    <button className="button secondary audio-speed" type="button" aria-pressed={slow} onClick={toggleTempo}>Slow audio</button>
  </div>;
}

function Speaking({ onBack }: { onBack: () => void }) {
  const [current, setCurrent] = useState(0);
  const prompt = speakingPrompts[current];
  return <>
    <Heading onBack={onBack} label="home">Speaking practice</Heading>
    <div className="panel speaking">
      <p className="muted">Play the example, then say your own version out loud. You can use a fictional name or hobby.</p>
      <div className="focus-options" aria-label="Choose a speaking scenario">
        {speakingPrompts.map((value, index) => <button key={value.id} type="button" className={index === current ? "choice chosen" : "choice"} onClick={() => setCurrent(index)} aria-pressed={index === current}>{value.title}</button>)}
      </div>
      <div className="speaking-example" key={prompt.id}>
        <h2>{prompt.title}</h2>
        <p>{prompt.task}</p>
        <p className="sentence" lang="fr">{prompt.frame}</p>
        <FrenchAudio src={`/audio/speak-${prompt.id}.mp3`} label="French speaking example" />
        <details><summary>Read the example</summary><p lang="fr">{prompt.model}</p></details>
      </div>
    </div>
  </>;
}

function TopicForm({ onAdded, onBack }: { onAdded: (topic: Topic) => void; onBack: () => void }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [focuses, setFocuses] = useState<Focus[]>([]);
  const [verbs, setVerbs] = useState<string[]>([]);
  const [custom, setCustom] = useState<Custom[]>([]);
  const [stage, setStage] = useState<"input" | "review">("input");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const previewTitle = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (stage === "review") previewTitle.current?.focus(); }, [stage]);
  const bank = exercisesFor({ focuses, verbs, custom: [] });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (stage === "input") {
      const suggested = suggestTopic(title + " " + notes);
      setFocuses(suggested.focuses);
      setVerbs(suggested.verbs);
      setStage("review");
      window.scrollTo(0, 0);
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ topic: Topic }>("", { action: "add", title, notes, focuses, verbs, custom });
      onAdded(result.topic);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function updateExercise(index: number, field: keyof Custom, value: string) {
    setCustom(items => items.map((item, row) => row === index ? { ...item, [field]: value } : item));
  }

  return <>
    <Heading onBack={onBack} label="Class topics">Add a topic</Heading>
    <form className="panel topic-form" onSubmit={submit}>
      {stage === "input" ? <>
        <p>Paste the relevant lines from class or describe what to practise.</p>
        <label>Topic name<input required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Être in the present tense" /></label>
        <label>What’s on the lesson?<textarea required rows={5} maxLength={2400} value={notes} onChange={event => setNotes(event.target.value)} placeholder="e.g. Présent des verbes être, avoir, faire et aller." /></label>
        <button className="button primary" type="submit">Preview practice</button>
      </> : <>
        <h2 tabIndex={-1} ref={previewTitle}>{title}</h2>
        <p className="source-note">{notes}</p>
        <button className="text-button" type="button" onClick={() => { setStage("input"); setError(""); }}>Edit topic details</button>
        <fieldset>
          <legend>What should the tutor cover?</legend>
          {!focuses.length && <p className="muted">Choose a focus below or add a custom prompt for this topic.</p>}
          <div className="focus-options">{Object.entries(focusLabels).map(([id, label]) => {
            const key = id as Focus;
            return <label className={focuses.includes(key) ? "choice chosen" : "choice"} key={key}>
              <input type="checkbox" checked={focuses.includes(key)} onChange={(event) => setFocuses(current => event.target.checked ? [...current, key] : current.filter(value => value !== key))} />
              {label}
            </label>;
          })}</div>
        </fieldset>
        {!!verbs.length && <div><p className="muted">Verbs found in the topic. Select a verb to remove the preference.</p><div className="tags">
          {verbs.map(verb => <button type="button" className="tag removable" key={verb} onClick={() => setVerbs(current => current.filter(value => value !== verb))} aria-label={`Remove ${verb} from preferred verbs`}>{verb} ×</button>)}
        </div></div>}
        {!!bank.length && <div><h3>Sample prompts</h3><Samples topic={{ focuses, verbs, custom: [] }} /></div>}
        {custom.map((value, index) => <fieldset key={index} className="custom-fields">
          <legend>Custom prompt {index + 1}</legend>
          <div className="field-grid">
            <label>Situation in English<input required maxLength={180} value={value.scene} onChange={event => updateExercise(index, "scene", event.target.value)} placeholder="Say that we’re at the dance studio." /></label>
            <label>French sentence with ___<input required maxLength={180} value={value.sentence} onChange={event => updateExercise(index, "sentence", event.target.value)} placeholder="Nous ___ au studio." /></label>
            <label>Verb or cue<input required maxLength={40} value={value.cue} onChange={event => updateExercise(index, "cue", event.target.value)} placeholder="être" /></label>
            <label>Missing word or phrase<input required maxLength={60} value={value.answer} onChange={event => updateExercise(index, "answer", event.target.value)} placeholder="sommes" /></label>
          </div>
          <label>Hint<input required maxLength={240} value={value.hint} onChange={event => updateExercise(index, "hint", event.target.value)} placeholder="Think of the nous form of être." /></label>
          <div className="field-grid">
            <label>Alternate review situation<input maxLength={180} required={!!value.alternateSentence} value={value.alternateScene} onChange={event => updateExercise(index, "alternateScene", event.target.value)} placeholder="Optional" /></label>
            <label>Alternate French sentence with ___<input maxLength={180} required={!!value.alternateScene} value={value.alternateSentence} onChange={event => updateExercise(index, "alternateSentence", event.target.value)} placeholder="Optional, same missing form" /></label>
          </div>
          <button type="button" className="text-button" onClick={() => setCustom(items => items.filter((_, row) => row !== index))}>Remove prompt</button>
        </fieldset>)}
        <div className="button-row">
          <button type="submit" className="button primary" disabled={busy || !(bank.length || custom.length)}>{busy ? "Saving…" : "Save class topic"} <Check size={19} /></button>
          {custom.length < 8 && <button type="button" className="button secondary" onClick={() => setCustom(items => [...items, { ...emptyExercise }])}>Add a custom prompt</button>}
        </div>
      </>}
      <ErrorNote message={error} />
    </form>
  </>;
}

function Practice({ run, onChange, onExit }: { run: RunView; onChange: (run: RunView) => void; onExit: () => void }) {
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const answerInput = useRef<HTMLInputElement>(null);
  const advance = useRef<HTMLButtonElement>(null);
  const summary = useRef<HTMLHeadingElement>(null);
  const { exercise, feedback } = run;

  useEffect(() => {
    if (run.results) summary.current?.focus();
    else if (feedback?.phase === "done") advance.current?.focus();
    else answerInput.current?.focus();
  }, [run.position, feedback?.phase, run.results, busy]);

  async function respond(stuck: boolean) {
    if (busy || (!stuck && !answer.trim())) return;
    setError("");
    setBusy(true);
    try {
      onChange(await api<RunView>("", { action: "answer", session: run.id, position: run.position, revision: run.revision, answer, stuck }));
      setAnswer("");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    setBusy(true);
    setError("");
    try {
      onChange(await api<RunView>(`?session=${encodeURIComponent(run.id)}&position=${run.position + 1}`));
      setAnswer("");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (run.results) return <section className="panel results">
    <div className="panel-icon"><Check size={26} /></div>
    <h1 tabIndex={-1} ref={summary}>Drill complete</h1>
    <p>{run.title}</p>
    <div className="result-stats">
      <div><strong>{run.results.independent}/{run.total}</strong><span>On the first try</span></div>
      <div><strong>{run.results.review}</strong><span>To practice again</span></div>
    </div>
    <button type="button" className="button primary" onClick={onExit}>Back to practice</button>
  </section>;
  if (!exercise) return null;

  return <>
    <div className="section-heading practice-head">
      <button className="text-button back" type="button" onClick={onExit}>Back to practice</button>
      <span className="overline">{run.title}</span>
    </div>
    <section className="panel practice" aria-labelledby="question">
      <div className="practice-progress">
        <div><span className="overline">{exercise.review ? "Review warm-up" : exercise.audio ? "Listening practice" : "French practice"}</span><span className="count">Prompt {run.position + 1} of {run.total}</span></div>
        <progress value={run.position + Number(feedback?.phase === "done")} max={run.total} aria-label="Completed prompts" />
      </div>
      <h1 id="question">{exercise.scene}</h1>
      {exercise.audio ? <FrenchAudio key={exercise.id} src={exercise.audio} label="French listening clip" /> : <>
        <p className="sentence" lang="fr">{exercise.sentence}</p>
        <p className="cue">Cue <b>{exercise.cue}</b></p>
      </>}
      {feedback?.phase === "done" ? <>
        <div className={feedback.outcome === "revealed" ? "notice feedback" : "notice success"} role="status">
          {feedback.outcome === "revealed" ? <Lightbulb size={21} /> : <Check size={21} />}
          <div><strong>{feedback.outcome === "independent" ? "Correct on the first try" : feedback.outcome === "assisted" ? "You got it with the hint" : exercise.audio ? "Here’s the answer" : "Here’s the form"}</strong>
          {exercise.audio ? <>
            <p>{feedback.answer}</p>
            <details><summary>Read the French transcript</summary><p lang="fr">{feedback.transcript}</p></details>
          </> : <p lang="fr">{exercise.sentence.replace("___", feedback.answer ?? "")}</p>}
          {feedback.outcome !== "independent" && <p>{feedback.hint}</p>}</div>
        </div>
        <button type="button" ref={advance} className="button primary" onClick={next} disabled={busy}>{run.position + 1 === run.total ? "See results" : "Next prompt"}</button>
      </> : <form onSubmit={event => { event.preventDefault(); void respond(false); }}>
        {feedback?.phase === "hint" && <div className="notice feedback" role="status"><Lightbulb size={21} /><div><strong>Try this hint</strong><p>{feedback.hint}</p></div></div>}
        <label className="answer-label">{exercise.audio ? "Your answer" : "Missing word or form"}
          <input ref={answerInput} lang={exercise.audio ? "en" : "fr"} type="text" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} placeholder={exercise.audio ? "Type your answer in English" : "Type the missing French"} maxLength={90} value={answer} onChange={event => setAnswer(event.target.value)} disabled={busy} required />
        </label>
        {!exercise.audio && <div className="accents" aria-label="French characters">{["é", "è", "ê", "ë", "à", "â", "ç", "î", "ï", "ô", "ù", "û", "ü", "œ"].map(letter => <button type="button" key={letter} disabled={busy} onClick={() => {
          const input = answerInput.current;
          const start = input?.selectionStart ?? answer.length;
          const end = input?.selectionEnd ?? start;
          if (answer.length - (end - start) >= 90) return;
          setAnswer(answer.slice(0, start) + letter + answer.slice(end));
          requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + 1, start + 1); });
        }} aria-label={`Insert ${letter}`}>{letter}</button>)}</div>}
        <div className="button-row">
          <button type="submit" className="button primary" disabled={busy || !answer.trim()}>{busy ? "Checking…" : feedback ? "Check retry" : "Check answer"} <Check size={19} /></button>
          <button type="button" className="button secondary" disabled={busy} onClick={() => respond(true)}><Lightbulb size={18} /> {feedback ? "Show the answer" : "I’m stuck"}</button>
        </div>
      </form>}
      <ErrorNote message={error} />
    </section>
  </>;
}
