export type SourceType =
  | "exhibition"
  | "film"
  | "book"
  | "artist"
  | "website"
  | "article"
  | "music"
  | "conversation"
  | "place"
  | "other";

export type PearlId = string;

export type PearlEnvelope = {
  title: string;
  source: string;
  sourceType: SourceType;
  encounterDate: string;
  tags: string[];
  mood: string;
};

export type ProfessorMessage = {
  id: string;
  role: "user" | "professor";
  content: string;
  createdAt: string;
};

export type PearlConnection = {
  id: string;
  targetPearlId: PearlId;
  note: string;
  createdAt: string;
};

export type PearlAttachment = {
  id: string;
  label: string;
  url: string;
  note?: string;
};

export type Pearl = {
  id: PearlId;
  envelope: PearlEnvelope;
  experientialRecord: string;
  intellectualSynthesis: string;
  professorTranscript: ProfessorMessage[];
  connections: PearlConnection[];
  attachments: PearlAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type PearlDraft = Omit<Pearl, "id" | "createdAt" | "updatedAt">;

export type PearlFilters = {
  query?: string;
  sourceType?: SourceType | "all";
  tag?: string;
};

export type ThreadingRequest = {
  prompt: string;
};

export type ThreadingResult = {
  prompt: string;
  briefing: string;
  pearlIds: PearlId[];
};

export const sourceTypes: SourceType[] = [
  "exhibition",
  "film",
  "book",
  "artist",
  "website",
  "article",
  "music",
  "conversation",
  "place",
  "other",
];
