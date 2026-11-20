export const focusLabels = {
  listening: "Listening · interests and hobbies",
  introductions: "Introducing yourself",
  vocabulary: "Vocabulary · hobbies and rehearsal",
  music: "Talking about music you like",
  hobbies: "Jouer à / jouer de / faire de",
  "double-verbs": "Two-verb phrases",
  etre: "Être · present tense",
  avoir: "Avoir · present tense",
  faire: "Faire · present tense",
  aller: "Aller · present tense",
  "regular-er": "Regular -er verbs · present tense",
  questions: "Asking questions",
  imperative: "Giving instructions",
  demonstratives: "Ce, cet, cette, ces",
  "near-future": "Near future · aller + infinitive",
} as const;

export type Focus = keyof typeof focusLabels;
type Audio = { file: string; transcript: string };
export type Exercise = {
  id: string; skill: string; label: string; scene: string; sentence: string; cue: string;
  answer: string; hint: string; accepted?: string[]; audio?: Audio; review?: boolean;
};
export type TopicContent = { focuses: Focus[]; verbs: string[]; custom: Exercise[] };
export type Topic = TopicContent & { id: string; title: string; notes: string };
export type Outcome = "independent" | "assisted" | "revealed";
export type ResponseState = { phase: "hint" } | { phase: "done"; outcome: Outcome };
export type PublicExercise = Omit<Exercise, "answer" | "hint" | "skill" | "accepted" | "audio"> & { audio?: string };
export type RunView = {
  id: string; title: string; total: number; position: number; exercise?: PublicExercise; revision: number;
  feedback?: { phase: "hint" | "done"; hint?: string; answer?: string; transcript?: string; outcome?: Outcome };
  results?: { independent: number; review: number };
};
export type HomeView = {
  role: "coach" | "student"; topics: Topic[]; studentJoined?: boolean;
  study?: { review: number; rounds: number; resume: { id: string; title: string } | null };
};

export const starterTopic: Topic = {
  id: "je-me-presente",
  title: "Je me présente",
  notes: "Meet the rehearsal team. Listen for hobbies, practise key French words, and use être and j’aime + infinitive.",
  focuses: ["listening", "introductions", "vocabulary", "hobbies", "double-verbs", "etre", "music"],
  verbs: [], custom: [],
};

export const listeningTopic: Topic = {
  id: "unit-2-listening",
  title: "À l’écoute · les loisirs",
  notes: "Listen to three short French introductions and identify what each person likes to do.",
  focuses: ["listening"], verbs: [], custom: [],
};

export const musicTopic: Topic = {
  id: "musique-que-jaime",
  title: "La musique que j’aime",
  notes: "Talk about the music you like and choose a song for rehearsal. Practise aimer, préférer, écouter, and danser in original examples featuring Taylor Swift, Gracie Abrams, and Olivia Rodrigo.",
  focuses: ["music"], verbs: [], custom: [],
};

export const quizTopic: Topic = {
  id: "irregular-verb-quiz",
  title: "Être, avoir, faire et aller",
  notes: "Review the four irregular present-tense verbs on the December 8 class quiz.",
  focuses: ["etre", "avoir", "faire", "aller"],
  verbs: ["être", "avoir", "faire", "aller"], custom: [],
};

type Variant = readonly [scene: string, sentence: string, answer?: string];
type Group = {
  focus: Focus; key: string; label: string; cue: string; answer: string; hint: string;
  variants: readonly Variant[];
};

const groups: Group[] = [
  {focus:"music", key:"likes", label:"Aimer · je", cue:"aimer", answer:"aime", hint:"Use the ending -e with j’. Keep écouter as the second verb.", variants:[
    ["Say you like listening to Taylor Swift.", "J’___ écouter Taylor Swift."], ["Say you like listening to Olivia Rodrigo.", "J’___ écouter Olivia Rodrigo."]]},
  {focus:"music", key:"listen", label:"Aimer + infinitive", cue:"to listen to", answer:"écouter", hint:"After j’aime, use the infinitive. To listen to is écouter.", variants:[
    ["Say you like listening to Gracie Abrams.", "J’aime ___ Gracie Abrams."], ["Say you like listening to Taylor Swift after school.", "Après l’école, j’aime ___ Taylor Swift."]]},
  {focus:"music", key:"prefer", label:"Préférer · je", cue:"préférer", answer:"préfère", hint:"Use the je ending -e. The accents in the stem are é then è.", variants:[
    ["Say you prefer to listen to Gracie Abrams.", "Je ___ écouter Gracie Abrams."], ["Say you prefer to dance during rehearsal.", "Je ___ danser pendant la répétition."]]},
  {focus:"music", key:"dance", label:"Vouloir + infinitive", cue:"to dance", answer:"danser", hint:"After je veux, keep the verb in the infinitive. To dance is danser.", variants:[
    ["Say you want to dance to a song by Olivia Rodrigo.", "Je veux ___ sur une chanson d’Olivia Rodrigo."], ["Say you want to dance to a song by Taylor Swift.", "Je veux ___ sur une chanson de Taylor Swift."]]},
  {focus:"music", key:"song", label:"Song · chanson", cue:"song", answer:"chanson", hint:"The word for a song starts like chanter, to sing.", variants:[
    ["Say you’re choosing a song by Olivia Rodrigo.", "Je choisis une ___ d’Olivia Rodrigo."], ["Say you’re listening to a song by Gracie Abrams.", "J’écoute une ___ de Gracie Abrams."]]},
  {focus:"vocabulary", key:"rehearsal", label:"Rehearsal · répétition", cue:"rehearsal", answer:"répétition", hint:"The word starts with ré-. Remember both acute accents.", variants:[
    ["Say there’s a rehearsal at the studio.", "Il y a une ___ au studio."], ["Say rehearsal is after school.", "La ___ est après l’école."]]},
  {focus:"vocabulary", key:"team", label:"Team · équipe", cue:"team", answer:"équipe", hint:"The word starts with é- and ends in -ipe.", variants:[
    ["Say that this is your team.", "C’est mon ___."], ["Say that the team rehearses tonight.", "L’___ répète ce soir."]]},
  {focus:"vocabulary", key:"show", label:"Show · spectacle", cue:"show", answer:"spectacle", hint:"Use the word that starts with spect-.", variants:[
    ["Say the show is Saturday.", "Le ___ est samedi."], ["Say that you’re preparing a show.", "On prépare un ___."]]},
  {focus:"vocabulary", key:"stage", label:"Stage · scène", cue:"stage", answer:"scène", hint:"Stage is scène in French. The first e has a grave accent.", variants:[
    ["Say you’re on stage.", "Je suis sur la ___."], ["Say you can see the stage.", "Je vois la ___."]]},
  {focus:"introductions", key:"name", label:"Introducing yourself", cue:"s’appeler", answer:"m’appelle", hint:"To introduce yourself, use je with m’appelle. Keep the apostrophe.", variants:[
    ["Introduce yourself as Camille.", "Je ___ Camille."], ["Introduce yourself as Alex to a pen pal.", "Bonjour ! Je ___ Alex."]]},
  {focus:"introductions", key:"opinion", label:"Expressing a preference", cue:"préférer", answer:"préfère", hint:"For je, use préfère. The second accented e is è.", variants:[
    ["Say that you prefer drawing.", "Je ___ le dessin."], ["Tell a friend that you prefer music.", "Je ___ la musique."]]},
  {focus:"introductions", key:"from", label:"Saying where you're from", cue:"habiter", answer:"habite", hint:"Habiter is a regular -er verb. After j’, add -e to the stem.", variants:[
    ["Say that you live in Toronto.", "J’___ à Toronto."], ["Introduce your fictional pen-pal character.", "J’___ à Montréal."]]},
  {focus:"hobbies", key:"jouer-sport", label:"Jouer à · sport or game", cue:"jouer à", answer:"au", hint:"For a sport or game, use jouer à. Combine à + le into au.", variants:[
    ["Say that you play soccer.", "Je joue ___ soccer."], ["Say that you play basketball.", "Je joue ___ basketball."]]},
  {focus:"hobbies", key:"jouer-instrument", label:"Jouer de · instrument", cue:"jouer de", answer:"du", hint:"For an instrument, use jouer de. Combine de + le into du.", variants:[
    ["Say that you play piano.", "Je joue ___ piano."], ["Say that you play a drum.", "Je joue ___ tambour."]]},
  {focus:"hobbies", key:"faire-activity", label:"Faire de · activity", cue:"faire de", answer:"du", hint:"Name an activity with faire de. For a masculine sport, combine de + le into du.", variants:[
    ["Say that you go cycling.", "Je fais ___ vélo."], ["Say that you go skating.", "Je fais ___ patinage."]]},
  {focus:"hobbies", key:"faire-feminine", label:"Faire de · feminine activity", cue:"faire de", answer:"de la", hint:"For a feminine activity, use de la.", variants:[
    ["Say that you dance.", "Je fais ___ danse."], ["Say that you go swimming.", "Je fais ___ natation."]]},
  {focus:"hobbies", key:"jouer-plural", label:"Jouer à · plural game", cue:"jouer à", answer:"aux", hint:"Combine à + les into aux before a plural noun.", variants:[
    ["Say that you play video games.", "Je joue ___ jeux vidéo."], ["Say that you play cards.", "Je joue ___ cartes."]]},
  {focus:"double-verbs", key:"aimer-infinitive", label:"Aimer + infinitive", cue:"to listen", answer:"écouter", hint:"After j’aime, use the infinitive. To listen is écouter.", variants:[
    ["Say that you like listening to music.", "J’aime ___ de la musique."], ["Say that you like listening to podcasts.", "J’aime ___ des balados."]]},
  {focus:"double-verbs", key:"preferer-infinitive", label:"Préférer + infinitive", cue:"to play", answer:"jouer", hint:"After je préfère, use the infinitive of jouer.", variants:[
    ["Say that you prefer playing soccer.", "Je préfère ___ au soccer."], ["Say that you prefer playing guitar.", "Je préfère ___ de la guitare."]]},
  {focus:"double-verbs", key:"vouloir-infinitive", label:"Vouloir + infinitive", cue:"to do", answer:"faire", hint:"Je veux is already conjugated. Faire stays in the infinitive.", variants:[
    ["Say that you want to go cycling.", "Je veux ___ du vélo."], ["Say that you want to dance.", "Je veux ___ de la danse."]]},
  {focus:"regular-er", key:"aimer-je", label:"Aimer · je", cue:"aimer", answer:"aime", hint:"Remove -er and add -e for je. Je shortens to j’ before a vowel.", variants:[
    ["Tell a pen pal you like music.", "J’___ la musique."], ["Say that you like singing.", "J’___ chanter."]]},
  {focus:"regular-er", key:"jouer-tu", label:"Jouer · tu", cue:"jouer", answer:"joues", hint:"With tu, regular -er verbs end in -es.", variants:[
    ["Tell a classmate they play tennis.", "Tu ___ au tennis."], ["Ask a friend if they play basketball.", "Tu ___ au basketball ?"]]},
  {focus:"regular-er", key:"parler-nous", label:"Parler · nous", cue:"parler", answer:"parlons", hint:"With nous, remove -er and add -ons.", variants:[
    ["Say that you speak French in class.", "Nous ___ français en classe."], ["Say that you are speaking about hobbies.", "Nous ___ de nos loisirs."]]},
  {focus:"questions", key:"est-ce-que", label:"Est-ce que", cue:"Yes-or-no question", answer:"est-ce que", hint:"Place est-ce que before the subject when the next word starts with a consonant.", variants:[
    ["Ask if your new friend likes to draw.", "___ tu aimes dessiner ?"], ["Ask if your new friend plays soccer.", "___ tu joues au soccer ?"]]},
  {focus:"questions", key:"qu-est-ce-que", label:"Qu’est-ce que", cue:"What…?", answer:"qu’est-ce que", hint:"Use qu’est-ce que at the start of a question asking ‘what.’", variants:[
    ["Ask what a friend likes to do.", "___ tu aimes faire ?"], ["Ask what a friend does on Saturdays.", "___ tu fais le samedi ?"]]},
  {focus:"questions", key:"ou", label:"Où", cue:"Where…?", answer:"où", hint:"Où means ‘where.’ The accent distinguishes it from ou (‘or’).", variants:[
    ["Ask a friend where they live.", "___ est-ce que tu habites ?"], ["Ask a friend where they play soccer.", "___ est-ce que tu joues au soccer ?"]]},
  {focus:"imperative", key:"melanger", label:"-er command · tu", cue:"mélanger", answer:"mélange", hint:"Use the tu present stem with -e and leave out the subject.", variants:[
    ["Tell one person to mix the ingredients.", "___ les ingrédients."], ["Tell one person to mix the flour and the sugar.", "___ la farine et le sucre."]]},
  {focus:"imperative", key:"ajouter", label:"-er command · vous", cue:"ajouter", answer:"ajoutez", hint:"Use the -ez ending to give a command to a group or a person addressed as vous.", variants:[
    ["Tell a group to add the tomatoes.", "___ les tomates."], ["Tell a group to add a little salt.", "___ un peu de sel."]]},
  {focus:"demonstratives", key:"feminine", label:"Cette · feminine singular", cue:"this", answer:"cette", hint:"Use cette before a feminine singular noun.", variants:[
    ["Refer to this salad.", "___ salade est fraîche."], ["Refer to this soup.", "___ soupe est chaude."]]},
  {focus:"demonstratives", key:"vowel", label:"Cet · masculine before a vowel", cue:"this", answer:"cet", hint:"Use cet before a masculine singular noun starting with a vowel sound.", variants:[
    ["Refer to this pineapple.", "___ ananas est mûr."], ["Refer to this ingredient.", "___ ingrédient est important."]]},
  {focus:"demonstratives", key:"plural", label:"Ces · plural", cue:"these", answer:"ces", hint:"Use ces for a plural noun of any gender.", variants:[
    ["Refer to these apples.", "___ pommes sont rouges."], ["Refer to these carrots.", "___ carottes sont croquantes."]]},
  {focus:"near-future", key:"aller-je", label:"Near future · je vais", cue:"aller + visiter", answer:"vais", hint:"Use vais for je, then leave visiter in the infinitive.", variants:[
    ["Say you’re going to visit the museum.", "Je ___ visiter le musée."], ["Say you’re going to visit the library.", "Je ___ visiter la bibliothèque."]]},
  {focus:"near-future", key:"allons", label:"Near future · nous allons", cue:"aller + prendre", answer:"allons", hint:"Use allons for nous, then leave prendre in the infinitive.", variants:[
    ["Say you’re going to take the bus together.", "Nous ___ prendre le bus."], ["Say you’re going to take the subway together.", "Nous ___ prendre le métro."]]},
];

const irregular = {
  etre: { verb: "être", forms: ["suis", "es", "est", "sommes", "êtes", "sont"], examples: [
    ["au studio de danse", "sur la scène"], ["au studio", "au club de lecture"], ["au gymnase", "dans l’équipe"],
    ["dans la même équipe", "prêts pour le spectacle"], ["au studio de danse", "en répétition"], ["sur la scène", "à la bibliothèque"],
  ] },
  avoir: { verb: "avoir", forms: ["ai", "as", "a", "avons", "avez", "ont"], examples: [
    ["une répétition", "une idée"], ["un nouveau livre", "une question"], ["un costume", "un casque"],
    ["un projet de classe", "des amis au club"], ["une répétition ce soir", "un concert demain"], ["des devoirs", "des crayons"],
  ] },
  faire: { verb: "faire", forms: ["fais", "fais", "fait", "faisons", "faites", "font"], examples: [
    ["du vélo", "du patinage"], ["du théâtre", "de la natation"], ["de la danse", "du yoga"],
    ["du dessin", "de la musique"], ["du ski", "du sport"], ["de la photo", "du camping"],
  ] },
  aller: { verb: "aller", forms: ["vais", "vas", "va", "allons", "allez", "vont"], examples: [
    ["à la répétition", "à la bibliothèque"], ["au club de jeux", "au parc"], ["à la piscine", "au gymnase"],
    ["au cinéma", "à la patinoire"], ["au musée", "à l’école"], ["au concert", "au studio"],
  ] },
} as const;
const people = ["je", "tu", "elle", "nous", "vous", "ils"] as const;
const verbHints: Record<keyof typeof irregular, readonly string[]> = {
  etre: ["The je form starts with s and ends in -uis.", "Es and est sound alike. The tu form has two letters.", "The elle form sounds like es and adds a silent -t.", "Think of nous sommes. This is a whole new stem.", "The vous form starts with ê and ends in -tes.", "The ils form sounds like the French word son and ends in -t."],
  avoir: ["After j’, think of the sound in j’ai faim. The form has two letters.", "The tu form starts with a and ends in -s.", "After elle, the form is a single vowel, without an accent.", "Use the stem av- and the ending -ons.", "Use the stem av- and the ending -ez.", "The ils form starts with o and ends in -nt."],
  faire: ["The je form starts with fai- and ends in -s.", "The tu and je forms match. Think fai- plus -s.", "The elle form starts with fai- and ends in -t.", "Use fais- and add -ons.", "The vous form uses an irregular ending, -tes.", "The ils form starts with fo- and ends in -nt."],
  aller: ["The je form starts with v- and ends in -ais.", "The tu form sounds like va and has a silent -s.", "The elle form has only two letters.", "The nous form uses all- and the ending -ons.", "The vous form uses all- and the ending -ez.", "The ils form starts with vo- and ends in -nt."],
};
for (const [key, spec] of Object.entries(irregular)) {
  people.forEach((person, index) => {
    const subject = spec.verb === "avoir" && person === "je" ? "J’" : person[0].toUpperCase() + person.slice(1) + " ";
    groups.push({
      focus: key as Focus, key: person, label: `${spec.verb} · ${person}`, cue: spec.verb,
      answer: spec.forms[index], hint: verbHints[key as keyof typeof irregular][index],
      variants: spec.examples[index].map(phrase => [`Complete the line with the present-tense form of ${spec.verb}.`, subject + "___ " + phrase + "."]),
    });
  });
}

export const listeningGroups = [
  { key:"hear-sport", label:"Listen for the sport", hint:"Listen for je joue au. The sport or game follows it.", clips:[
    { file:"soccer", transcript:"Salut ! Je m’appelle Lina. Le mercredi, je joue au soccer avec mes amis.", scene:"What sport does Lina play? Answer in English.", answer:"soccer", accepted:["football", "football (soccer)"] },
    { file:"tennis", transcript:"Bonjour ! Je m’appelle Malik. Après l’école, je joue au tennis.", scene:"What sport does Malik play? Answer in English.", answer:"tennis", accepted:[] },
    { file:"basketball", transcript:"Salut ! Moi, c’est Zoé. Avant la répétition de danse, je joue au basketball.", scene:"What sport does Zoé play? Answer in English.", answer:"basketball", accepted:["basket ball"] },
  ] },
  { key:"hear-instrument", label:"Listen for the instrument", hint:"Listen for je joue du or je joue de la. The instrument comes right after it.", clips:[
    { file:"piano", transcript:"Bonjour, je m’appelle Jules. J’aime la danse et la musique. Je joue du piano avec ma sœur.", scene:"What instrument does Jules play? Answer in English.", answer:"piano", accepted:[] },
    { file:"guitar", transcript:"Salut, moi, c’est Aya. Je joue de la guitare après l’école.", scene:"What instrument does Aya play? Answer in English.", answer:"guitar", accepted:[] },
    { file:"violin", transcript:"Bonjour ! Je m’appelle Sam. Au club de musique, je joue du violon.", scene:"What instrument does Sam play? Answer in English.", answer:"violin", accepted:["fiddle"] },
  ] },
  { key:"hear-activity", label:"Listen for the activity", hint:"Listen for je fais. The next words tell you the activity.", clips:[
    { file:"dance", transcript:"Salut ! Je m’appelle Léa. Le vendredi, je fais de la danse avec mon équipe.", scene:"What activity does Léa do on Fridays? Answer in English.", answer:"dance", accepted:["dancing"] },
    { file:"swim", transcript:"Bonjour ! Moi, c’est Niko. Le mardi, je fais de la natation.", scene:"What activity does Niko do on Tuesdays? Answer in English.", answer:"swimming", accepted:["swim", "swims"] },
    { file:"cycling", transcript:"Salut, je m’appelle Cam. Le dimanche, je fais du vélo avec ma famille.", scene:"What activity does Cam do on Sundays? Answer in English.", answer:"cycling", accepted:["biking", "bike riding", "riding a bike", "bicycling"] },
  ] },
] as const;

export const speakingPrompts = [
  { id: "meet", title: "Meet a teammate", task: "Say hello, give a name, and share one thing you like to do.",
    frame: "Salut ! Je m’appelle ___. J’aime ___.", model: "Salut ! Je m’appelle Camille. J’aime danser." },
  { id: "ask", title: "Interview a teammate", task: "Ask what your teammate likes doing and share one activity you do.",
    frame: "Qu’est-ce que tu aimes faire ? Moi, je fais ___.", model: "Qu’est-ce que tu aimes faire ? Moi, je fais de la danse." },
  { id: "music", title: "Choose rehearsal music", task: "Say which artist you like to listen to and ask your teammate what they like.",
    frame: "J’aime écouter ___. Et toi, qu’est-ce que tu aimes écouter ?", model: "J’aime écouter Taylor Swift. Et toi, qu’est-ce que tu aimes écouter ?" },
  { id: "penpal", title: "Rehearse a line for a pen pal", task: "Say where you are today and name an activity you do with a friend.",
    frame: "Je suis ___. Avec mon ami ou mon amie, je ___.", model: "Je suis au studio. Avec mon amie, je joue de la guitare." },
] as const;

const listening = listeningGroups.flatMap(group => group.clips.map(clip => ({
  id: `listening:${group.key}:${clip.file}`, skill: `listening:${group.key}`, label: group.label,
  scene: clip.scene, sentence: "", cue: "", answer: clip.answer, accepted: [...clip.accepted], hint: group.hint,
  audio: { file: `/audio/${clip.file}.mp3`, transcript: clip.transcript },
} satisfies Exercise)));

const bank: Exercise[] = [
  ...listening,
  ...groups.flatMap(group => group.variants.map(([scene, sentence, answer], index) => {
    const skill = `${group.focus}:${group.key}`;
    return { id: `${skill}:${index}`, skill, label: group.label, scene, sentence, cue: group.cue, answer: answer ?? group.answer, hint: group.hint };
  })),
];

const fold = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function suggestTopic(notes: string): { focuses: Focus[]; verbs: string[] } {
  const plain = fold(notes);
  const words = new Set(plain.match(/[a-z]+/g) ?? []);
  const focuses = new Set<Focus>();
  if (/listening|comprehension orale|ecout/.test(plain)) focuses.add("listening");
  if (/je me presente|introduct|pen\s?pal|se presenter|entretien|entrevue|interview/.test(plain)) focuses.add("introductions");
  if (/vocab|word list|mots/.test(plain)) focuses.add("vocabulary");
  if (/music|musique|chansons?|taylor swift|gracie abrams|olivia rodrigo/.test(plain)) focuses.add("music");
  if (/hobb|loisir|interet|sport|instrument|jouer [ad]|faire de|contractions?/.test(plain)) focuses.add("hobbies");
  if (/double.ver|two.ver|deux verbes|verb.*infinitif/.test(plain)) focuses.add("double-verbs");
  if (/futur proche|near.future/.test(plain)) focuses.add("near-future");
  if (/regular[^a-z]|reguliers?|\b-er\b/.test(plain) && !/irregular|irregulier/.test(plain)) focuses.add("regular-er");
  if (/question|est.ce que|inversion/.test(plain)) focuses.add("questions");
  if (/imperati|instructions?|commands?/.test(plain)) focuses.add("imperative");
  if (/demonstrati/.test(plain)) focuses.add("demonstratives");
  const picked = Object.entries(irregular).filter(([key]) => words.has(key));
  const shouldAddVerbs = !focuses.has("near-future") && (!focuses.has("hobbies") || /verb|present|irregular|irregulier/.test(plain));
  if (shouldAddVerbs) {
    for (const [key] of picked) focuses.add(key as Focus);
    if (!picked.length && /irregular|irregulier/.test(plain)) {
      for (const key of Object.keys(irregular)) focuses.add(key as Focus);
    }
  }
  return { focuses: [...focuses], verbs: picked.map(([, value]) => value.verb) };
}

export function exercisesFor(topic: TopicContent): Exercise[] {
  return [...topic.focuses.flatMap(focus => bank.filter(exercise => exercise.id.startsWith(focus + ":"))), ...topic.custom];
}

const starterOrder = ["listening:hear-activity", "introductions:name", "vocabulary:rehearsal", "listening:hear-instrument",
  "etre:je", "music:listen", "listening:hear-sport", "hobbies:faire-feminine"];

function groupBySkill(exercises: Exercise[]) {
  const groups = new Map<string, Exercise[]>();
  for (const exercise of exercises) {
    const group = groups.get(exercise.skill);
    if (group) group.push(exercise);
    else groups.set(exercise.skill, [exercise]);
  }
  return groups;
}

export function planPractice(topic: Topic, due: Exercise[], previous: Map<string, Exercise>, seed: number, customBank: Exercise[] = []): Exercise[] {
  const pool = groupBySkill([...bank, ...customBank]);
  const pick = (related: Exercise[], prior?: Exercise) => {
    const fresh = related.filter(option => option.id !== prior?.id);
    const variants = fresh.length ? fresh : related;
    return variants[seed % variants.length];
  };
  const review = due.slice(0, 2).map(exercise => ({
    ...(pool.has(exercise.skill) ? pick(pool.get(exercise.skill)!, exercise) : exercise), review: true,
  }));
  const practice = groupBySkill(exercisesFor(topic));
  const groups = [...topic.focuses.map(focus => [...practice.keys()].filter(key => key.startsWith(focus + ":"))),
    [...practice.keys()].filter(key => key.startsWith("custom:"))];
  const interleaved = Array.from({ length: Math.max(0, ...groups.map(group => group.length)) }, (_, index) =>
    groups.flatMap(group => group[index] ?? []),
  ).flat();
  const isFirstStarter = topic.id === starterTopic.id && !previous.size;
  const order = isFirstStarter ? starterOrder : interleaved;
  const fresh = order.filter(skill => !review.some(item => item.skill === skill))
    .map(skill => isFirstStarter ? practice.get(skill)![0] : pick(practice.get(skill)!, previous.get(skill)));
  return [...review, ...fresh].slice(0, 8);
}

export function isCorrect(answer: string, exercise: Exercise) {
  const normalize = (value: string) => value.normalize("NFC").trim().toLowerCase().replace(/[’‘ʼ]/g, "'").replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
  const actual = normalize(answer);
  return [exercise.answer, ...(exercise.accepted ?? [])].some(expected => normalize(expected) === actual);
}

export function publicExercise(exercise: Exercise): PublicExercise {
  const { id, label, scene, sentence, cue, review, audio } = exercise;
  return { id, label, scene, sentence, cue, review, audio: audio?.file };
}
