import { z } from "zod";
import { getRole, sameOrigin, studentIsSetUp } from "@/lib/access";
import { changeRecord, readRecord } from "@/lib/records";
import {
  exercisesFor, focusLabels, isCorrect, listeningTopic, musicTopic, planPractice, publicExercise, quizTopic, starterTopic,
  type Exercise, type HomeView, type ResponseState, type RunView, type Topic, type TopicContent,
} from "@/lib/lesson";

export const dynamic = "force-dynamic";

type Mark = { state: ResponseState; revision: number };
type Session = { id: string; title: string; exercises: Exercise[]; marks: Mark[] };
type Review = { exercise: Exercise; due: boolean; changedAt: number };
type Practice = { sessions: Session[]; review: Record<string, Review>; rounds: number };
const emptyPractice = (): Practice => ({ sessions: [], review: {}, rounds: 0 });
const emptyTopics = (): Topic[] => [];
const practiceKey = "student-practice";
const topicKey = "topics";

const focusIds = Object.keys(focusLabels) as [keyof typeof focusLabels, ...(keyof typeof focusLabels)[]];
const text = (length: number) => z.string().trim().min(1).max(length);
const customSchema = z.object({
  scene: text(180),
  sentence: text(180).refine(value => value.split("___").length === 2, "Use one blank (___) in the French sentence."),
  cue: text(40),
  answer: text(60),
  hint: text(240),
  alternateScene: z.string().trim().max(180),
  alternateSentence: z.string().trim().max(180).refine(value => !value || value.split("___").length === 2, "Use one blank (___) in the alternate sentence."),
}).refine(value => Boolean(value.alternateScene) === Boolean(value.alternateSentence), "Add both parts of the alternate prompt.");

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add"),
    title: text(100),
    notes: text(2400),
    focuses: z.array(z.enum(focusIds)).max(focusIds.length),
    verbs: z.array(text(30)).max(45),
    custom: z.array(customSchema).max(8),
  }),
  z.object({ action: z.literal("start"), topic: text(80) }),
  z.object({
    action: z.literal("answer"),
    session: z.string().uuid(),
    position: z.number().int().min(0).max(7),
    revision: z.number().int().min(0).max(1),
    answer: z.string().trim().max(90),
    stuck: z.boolean(),
  }),
]);

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}

async function loadTopics(): Promise<Topic[]> {
  return [...await readRecord(topicKey, emptyTopics), starterTopic, listeningTopic, quizTopic, musicTopic];
}

function renderRun(session: Session, requested?: number): RunView {
  const { id, title, exercises, marks } = session;
  const completed = marks.filter(mark => mark.state.phase === "done").length;
  const position = requested !== undefined && Number.isInteger(requested) && requested >= 0 && requested <= completed ? requested : completed;
  const exercise = exercises[position];
  const view = { id, title, total: exercises.length, position, revision: 0 };
  if (!exercise) {
    const independent = marks.filter(mark => mark.state.phase === "done" && mark.state.outcome === "independent").length;
    return { ...view, results: { independent, review: completed - independent } };
  }
  const mark = marks[position];
  const state = mark?.state;
  return {
    ...view, exercise: publicExercise(exercise), revision: mark?.revision ?? 0,
    feedback: state?.phase === "hint" ? { phase: "hint", hint: exercise.hint }
      : state?.phase === "done" ? { phase: "done", outcome: state.outcome, answer: exercise.answer, transcript: exercise.audio?.transcript, hint: exercise.hint } : undefined,
  };
}

function studentOnly() {
  return reply({ error: "Practice is available in the student account." }, 403);
}

export async function GET(request: Request) {
  const role = await getRole();
  if (!role) return reply({ error: "Sign in to continue." }, 401);
  const search = new URL(request.url).searchParams;
  const id = search.get("session");
  if (role === "coach") {
    if (id) return studentOnly();
    const [topics, studentJoined] = await Promise.all([loadTopics(), studentIsSetUp()]);
    return reply({ role, topics, studentJoined } satisfies HomeView);
  }
  const practice = await readRecord(practiceKey, emptyPractice);
  if (id) {
    const session = practice.sessions.find(item => item.id === id);
    const position = search.get("position");
    return session ? reply(renderRun(session, position === null ? undefined : Number(position))) : reply({ error: "Practice session not found." }, 404);
  }
  const topics = await loadTopics();
  const recent = practice.sessions[0];
  const resume = recent && !renderRun(recent).results ? { id: recent.id, title: recent.title } : null;
  const review = Object.values(practice.review).filter(item => item.due).length;
  return reply({ role, topics, study: { review, rounds: practice.rounds, resume } } satisfies HomeView);
}

type AnswerData = Extract<z.infer<typeof requestSchema>, { action: "answer" }>;
type Result = { status: number; body: RunView | { error: string } };

function recordAnswer(practice: Practice, data: AnswerData): { value?: Practice; result: Result } {
  const session = practice.sessions.find(item => item.id === data.session);
  if (!session) return { result: { status: 404, body: { error: "Practice session not found." } } };
  const view = renderRun(session, data.position);
  const exercise = session.exercises[data.position];
  if (view.position !== data.position || !exercise || view.feedback?.phase === "done" || view.revision !== data.revision) {
    return { result: { status: 200, body: view } };
  }
  const hadHint = view.feedback?.phase === "hint";
  const correct = !data.stuck && isCorrect(data.answer, exercise);
  const state: ResponseState = correct
    ? { phase: "done", outcome: hadHint ? "assisted" : "independent" }
    : hadHint ? { phase: "done", outcome: "revealed" } : { phase: "hint" };
  const marks = [...session.marks];
  marks[data.position] = { state, revision: view.revision + 1 };
  const updated = { ...session, marks };
  const complete = marks.length === session.exercises.length && state.phase === "done";
  const due = state.phase !== "done" || state.outcome !== "independent";
  return {
    value: {
      ...practice,
      sessions: practice.sessions.map(item => item.id === updated.id ? updated : item),
      review: { ...practice.review, [exercise.skill]: { exercise, due, changedAt: Date.now() } },
      rounds: practice.rounds + Number(complete),
    },
    result: { status: 200, body: renderRun(updated, data.position) },
  };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Open Studio Français to continue." }, 403);
  const role = await getRole();
  if (!role) return reply({ error: "Sign in to continue." }, 401);
  if (Number(request.headers.get("content-length")) > 25000) return reply({ error: "This topic is too large." }, 413);
  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 25000) return reply({ error: "This topic is too large." }, 413);
    input = JSON.parse(body);
  } catch {
    return reply({ error: "Could not read that request." }, 400);
  }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return reply({ error: parsed.error.issues[0]?.message ?? "Check the details and try again." }, 400);
  const data = parsed.data;

  if (data.action === "add") {
    const id = crypto.randomUUID();
    const custom = data.custom.flatMap((exercise, index) => {
      const skill = `custom:${id}:${index}`;
      const { alternateSentence, alternateScene, ...main } = exercise;
      const first = { ...main, skill, id: `${skill}:0`, label: main.cue };
      return alternateSentence
        ? [first, { ...first, id: `${skill}:1`, scene: alternateScene, sentence: alternateSentence }]
        : [first];
    });
    const content: TopicContent = { focuses: [...new Set(data.focuses)], verbs: [...new Set(data.verbs)], custom };
    if (!exercisesFor(content).length) return reply({ error: "Choose a practice focus or add an exercise." }, 400);
    const topic = { id, title: data.title, notes: data.notes, ...content };
    const saved = await changeRecord<Topic[], boolean>(topicKey, emptyTopics, topics => {
      if (topics.length >= 100) return { result: false };
      return { value: [topic, ...topics], result: true };
    });
    return saved ? reply({ topic }, 201) : reply({ error: "The tutor has reached its limit of 100 shared topics." }, 409);
  }

  if (role !== "student") return studentOnly();
  if (data.action === "start") {
    const topics = await loadTopics();
    const topic = topics.find(value => value.id === data.topic);
    if (!topic) return reply({ error: "Class topic not found." }, 404);
    const id = crypto.randomUUID();
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const view = await changeRecord<Practice, RunView | null>(practiceKey, emptyPractice, practice => {
      const history = Object.values(practice.review).sort((a, b) => a.changedAt - b.changedAt);
      const previous = new Map(history.map(item => [item.exercise.skill, item.exercise]));
      const due = history.filter(item => item.due).map(item => item.exercise);
      const exercises = planPractice(topic, due, previous, seed, topics.flatMap(value => value.custom));
      if (!exercises.length) return { result: null };
      const session: Session = { id, title: topic.title, exercises, marks: [] };
      return { value: { ...practice, sessions: [session, ...practice.sessions].slice(0, 24) }, result: renderRun(session) };
    });
    return view ? reply(view, 201) : reply({ error: "Add an exercise to this topic first." }, 400);
  }

  if (!data.stuck && !data.answer) return reply({ error: "Enter an answer first." }, 400);
  const result = await changeRecord(practiceKey, emptyPractice, practice => recordAnswer(practice, data));
  return reply(result.body, result.status);
}
