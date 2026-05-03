import type { Pearl } from "./types";

export const seedPearls: Pearl[] = [
  {
    id: "duchamp-moma-readymades",
    envelope: {
      title: "Marcel Duchamp Exhibit",
      source: "Museum of Modern Art, New York",
      author: "",
      date: "2026-03-14",
      location: "Museum of Modern Art, New York",
      thumbnailUrl: "",
      sourceType: "exhibition",
      encounterDate: "2026-03-14",
      tags: ["authorship", "objects", "modernism", "institution"],
      mood:
        "Restless and unusually receptive, still thinking about the difference between wit and seriousness.",
    },
    experientialRecord:
      "The encounter felt less like looking at objects and more like watching a room reorganize around an argument. The quieter works mattered because they made the famous gestures feel less like jokes and more like pressure points.",
    intellectualSynthesis:
      "The readymade is useful here as a way to think about authorship as designation. The artist does not disappear; the artist moves from maker to chooser, and the institution becomes part of the medium.",
    professorTranscript: [
      {
        id: "duchamp-professor-1",
        role: "user",
        content:
          "How should I think about the readymade without reducing it to a clever prank?",
        createdAt: "2026-03-14T20:20:00.000Z",
      },
      {
        id: "duchamp-professor-2",
        role: "professor",
        content:
          "Treat it as a relocation of artistic labor. The decision, context, and institutional frame become the work's active materials.",
        createdAt: "2026-03-14T20:21:00.000Z",
      },
    ],
    connections: [],
    attachments: [],
    createdAt: "2026-03-14T20:10:00.000Z",
    updatedAt: "2026-03-14T20:35:00.000Z",
  },
  makePearl({
    id: "transdimensional-brain-chip",
    title: "Transdimensional Brain Chip",
    source: "Speculative neural interface research note",
    sourceType: "article",
    encounterDate: "2026-03-04",
    tags: ["brain", "memory", "interface", "speculation"],
    mood: "Half scientific curiosity, half body-horror fascination.",
    experientialRecord:
      "The idea felt like a tiny foreign object lodged between imagination and anatomy: technological, occult, and uncomfortably intimate.",
    intellectualSynthesis:
      "Memory becomes strange when treated as addressable matter. The chip is interesting less as hardware than as a metaphor for access, invasion, and persistence.",
  }),
  makePearl({
    id: "dune",
    title: "Dune",
    source: "Novel and film encounters",
    sourceType: "book",
    encounterDate: "2026-02-22",
    tags: ["ecology", "myth", "empire", "desert"],
    mood: "Drawn to scale: sand, prophecy, inheritance, and systems too large to see at once.",
    experientialRecord:
      "It moved like weather rather than plot. The desert, voices, rituals, and political machinery all felt part of the same pressure system.",
    intellectualSynthesis:
      "Dune is useful as a model for ecology as destiny: environment, religion, extraction, and myth making each other inevitable.",
  }),
  makePearl({
    id: "blade-runner-2049",
    title: "Blade Runner 2049",
    source: "Home screening",
    sourceType: "film",
    encounterDate: "2026-02-18",
    tags: ["memory", "synthetic", "architecture", "loneliness"],
    mood: "Quiet, receptive, unusually aware of rooms and scale.",
    experientialRecord:
      "The film felt like walking through monumental loneliness. Color, fog, and architecture did more emotional work than exposition.",
    intellectualSynthesis:
      "Its strongest idea is that artificial memory still produces real longing. Evidence may be manufactured, but the ache it creates is not.",
  }),
  makePearl({
    id: "nausicaa-valley-of-the-wind",
    title: "Nausicaa and the Valley of the Wind",
    source: "Film",
    sourceType: "film",
    encounterDate: "2026-02-12",
    tags: ["ecology", "toxicity", "animation", "care"],
    mood: "Moved by softness as a form of intelligence.",
    experientialRecord:
      "The toxic jungle felt alive rather than hostile. The whole encounter carried a tenderness toward systems that humans misunderstand.",
    intellectualSynthesis:
      "Nausicaa frames care as investigative practice: to love a world is to study its hidden logic before trying to control it.",
  }),
  makePearl({
    id: "cyborg-manifesto",
    title: "Cyborg Manifesto",
    source: "Donna Haraway essay",
    sourceType: "article",
    encounterDate: "2026-02-07",
    tags: ["cyborg", "identity", "feminism", "boundary"],
    mood: "Reading for permission to blur categories without apologizing for it.",
    experientialRecord:
      "Dense, electric, and slippery. It felt less like an argument to summarize and more like a permission structure.",
    intellectualSynthesis:
      "The cyborg matters as a refusal of clean origin stories: organism and machine, nature and culture, self and tool are already entangled.",
  }),
  makePearl({
    id: "joi-ito-writings",
    title: "Joi Ito's Writings and Blogs",
    source: "Personal blogs and essays",
    sourceType: "website",
    encounterDate: "2026-01-31",
    tags: ["internet", "systems", "learning", "networks"],
    mood: "Interested in the older web as a living thinking surface.",
    experientialRecord:
      "The writing felt conversational and networked, like finding traces of thought before platforms flattened the texture of online life.",
    intellectualSynthesis:
      "Blogs preserve thinking as it forms. Their value is not only the post, but the visible scaffolding of links, updates, and unfinished positions.",
  }),
  makePearl({
    id: "participatory-design-traffic",
    title: "Participatory Design Essay",
    source: "You are not stuck in traffic, you are traffic",
    sourceType: "article",
    encounterDate: "2026-01-27",
    tags: ["participation", "systems", "design", "agency"],
    mood: "Alert to the uncomfortable fact that observers are often participants.",
    experientialRecord:
      "The phrase landed like a trapdoor. It collapsed the distance between user, system, problem, and responsibility.",
    intellectualSynthesis:
      "Participatory design is most powerful when it dissolves the fantasy of outside intervention. The designer is inside the system too.",
  }),
  makePearl({
    id: "youtube-y51vusotze4",
    title: "YouTube: y51VUsotZe4",
    source: "https://youtu.be/y51VUsotZe4?si=6_hC3uLeZlPBg2y-",
    sourceType: "website",
    encounterDate: "2026-01-23",
    tags: ["video", "reference", "internet", "atmosphere"],
    mood: "Saved for its tone before fully knowing what to do with it.",
    experientialRecord:
      "The video stayed with me as a texture: pacing, voice, compression artifacts, and the feeling of being handed a fragment.",
    intellectualSynthesis:
      "Some references matter because they carry atmosphere more than argument. They become reusable emotional lighting.",
  }),
  makePearl({
    id: "youtube-9go8sxr-fom",
    title: "YouTube: 9go8sXR-fOM",
    source: "https://youtu.be/9go8sXR-fOM?si=6-LcU2n9550Rd_JcHi",
    sourceType: "website",
    encounterDate: "2026-01-20",
    tags: ["video", "reference", "internet", "signal"],
    mood: "Curious, slightly disoriented, tracking why it felt worth saving.",
    experientialRecord:
      "It felt like a shard from a larger world. The important part was not completion but the unresolved charge around it.",
    intellectualSynthesis:
      "Fragments can act as high-density creative prompts. They do not explain themselves; they ask to be placed near other fragments.",
  }),
  makePearl({
    id: "vernacular-architecture-design",
    title: "Vernacular Architecture and Design",
    source: "Collected references",
    sourceType: "place",
    encounterDate: "2026-01-17",
    tags: ["architecture", "vernacular", "design", "adaptation"],
    mood: "Looking for design intelligence outside authorship and polish.",
    experientialRecord:
      "The examples felt accumulated rather than designed: local constraints, repairs, materials, habits, and weather turning into form.",
    intellectualSynthesis:
      "Vernacular design is evidence of intelligence distributed through use. It replaces signature with adaptation.",
  }),
  makePearl({
    id: "brain-memory-physicality-tweet",
    title: "Tweet About Brain and Memory",
    source: "Tweet about the physicality of the brain and memory",
    sourceType: "article",
    encounterDate: "2026-01-14",
    tags: ["brain", "memory", "body", "materiality"],
    mood: "Struck by memory as something wet, local, and physical.",
    experientialRecord:
      "The thought made memory feel less cloudlike and more anatomical. Remembering became a bodily event, not a file retrieval.",
    intellectualSynthesis:
      "The physicality of memory is useful against metaphors of pure information. Archives also need bodies, surfaces, and decay.",
  }),
  makePearl({
    id: "like-a-velvet-glove-cast-in-iron",
    title: "Like a Velvet Glove Cast in Iron",
    source: "Daniel Clowes comic",
    sourceType: "book",
    encounterDate: "2026-01-11",
    tags: ["comics", "surreal", "body", "unease"],
    mood: "Enjoying the discomfort of not being oriented.",
    experientialRecord:
      "The comic felt sticky and nocturnal, full of scenes that made sense emotionally before they made sense narratively.",
    intellectualSynthesis:
      "Its surrealism works because it treats dream logic as social reality. The grotesque is not a break from the world but its exposed underside.",
  }),
  makePearl({
    id: "the-jaunt-stephen-king",
    title: "The Jaunt",
    source: "Stephen King short story",
    sourceType: "book",
    encounterDate: "2026-01-08",
    tags: ["horror", "time", "consciousness", "technology"],
    mood: "Hooked by a simple premise becoming metaphysical dread.",
    experientialRecord:
      "The story turned a technological convenience into an abyss. Its horror arrived through scale: duration without embodiment.",
    intellectualSynthesis:
      "The Jaunt is a reminder that subjective time can be more terrifying than space. Consciousness is the real environment.",
  }),
  makePearl({
    id: "the-last-question-asimov",
    title: "The Last Question",
    source: "Isaac Asimov short story",
    sourceType: "book",
    encounterDate: "2026-01-05",
    tags: ["cosmology", "ai", "entropy", "recursion"],
    mood: "Pleasantly overwhelmed by cosmic compression.",
    experientialRecord:
      "It felt like watching a question survive civilizations, machines, and heat death. The repetition became ritual.",
    intellectualSynthesis:
      "The story's power is structural: a single question becomes an engine for scale, carrying human anxiety into cosmic recursion.",
  }),
  {
    id: "blade-runner-rain",
    envelope: {
      title: "Blade Runner, Rain, and Manufactured Memory",
      source: "Home screening",
      author: "Ridley Scott",
      date: "2026-01-09",
      location: "Home screening",
      thumbnailUrl: "",
      sourceType: "film",
      encounterDate: "2026-01-09",
      tags: ["memory", "cinema", "atmosphere", "identity"],
      mood:
        "Tired enough that the film's slowness felt generous instead of demanding.",
    },
    experientialRecord:
      "The city felt more remembered than designed. I noticed the sound of rain before I noticed plot, and the whole film seemed to be held together by weather and surfaces.",
    intellectualSynthesis:
      "The film makes memory feel architectural. Identity is not stored inside a person so much as distributed across images, rooms, evidence, and recurring textures.",
    professorTranscript: [],
    connections: [],
    attachments: [],
    createdAt: "2026-01-09T22:00:00.000Z",
    updatedAt: "2026-01-09T22:00:00.000Z",
  },
];

function makePearl({
  id,
  title,
  source,
  sourceType,
  encounterDate,
  tags,
  mood,
  experientialRecord,
  intellectualSynthesis,
}: {
  id: string;
  title: string;
  source: string;
  sourceType: Pearl["envelope"]["sourceType"];
  encounterDate: string;
  tags: string[];
  mood: string;
  experientialRecord: string;
  intellectualSynthesis: string;
}): Pearl {
  const createdAt = `${encounterDate}T19:00:00.000Z`;

  return {
    id,
    envelope: {
      title,
      source,
      author: "",
      date: encounterDate,
      location: source,
      thumbnailUrl: "",
      sourceType,
      encounterDate,
      tags,
      mood,
    },
    experientialRecord,
    intellectualSynthesis,
    professorTranscript: [],
    connections: [],
    attachments: [],
    createdAt,
    updatedAt: createdAt,
  };
}
