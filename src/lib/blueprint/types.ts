export type BlueprintAxis =
  | "Identity"
  | "Thinking"
  | "Decision"
  | "Action"
  | "Relationship"
  | "Communication"
  | "Leadership"
  | "Conflict"
  | "Growth"
  | "Wealth"
  | "Health"
  | "Life Flow";

export type BlueprintFeature = {
  id: string;
  axis: BlueprintAxis;
  title: string;
  summary: string;
  score: number;
  confidence: number;
  evidence: string[];
  writerHint: string;
};

export type BlueprintCore = {
  blueprintId: string;
  source: "pigbar-manse";
  axes: Array<{
    axis: BlueprintAxis;
    question: string;
    summary: string;
    confidence: number;
    evidence: string[];
  }>;
  features: BlueprintFeature[];
};

export type BlueprintParagraph = {
  id: string;
  text: string;
  featureIds: string[];
};

export type BlueprintChapter = {
  id: string;
  chapterNo: number;
  title: string;
  question: string;
  opening: string;
  paragraphs: BlueprintParagraph[];
  closing: string;
};

export type FamilyCollectionVolume = {
  volumeNo: number;
  blueprintNo: string;
  title: string;
  author: string;
  status: "published" | "planned";
};

export type FamilyCollection = {
  id: string;
  name: string;
  label: string;
  description: string;
  volumes: FamilyCollectionVolume[];
};

export type BlueprintBook = {
  metadata: {
    blueprintId: string;
    blueprintNo: string;
    title: string;
    subtitle: string;
    author: string;
    publisher: string;
    edition: string;
    publicationDate: string;
    sourceName: string;
  };
  familyCollection: FamilyCollection;
  dedication: string;
  authorNote: string;
  prologue: {
    title: string;
    paragraphs: BlueprintParagraph[];
  };
  core: BlueprintCore;
  chapters: BlueprintChapter[];
  myNotesPrompt: string;
};
