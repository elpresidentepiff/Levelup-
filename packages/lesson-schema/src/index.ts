export type Direction = 'up' | 'right' | 'down' | 'left';

export type Point = {
  x: number;
  y: number;
};

export type MissionMode =
  | 'construct'
  | 'predict'
  | 'debug'
  | 'explain'
  | 'create'
  | 'boss';

export type SkillId =
  | 'sequence'
  | 'prediction'
  | 'debugging'
  | 'efficiency'
  | 'explanation'
  | 'creative_application';

export type BoardDefinition = {
  columns: number;
  rows: number;
  start: Point;
  goal: Point;
  walls: Point[];
  gems: Point[];
};

export type PredictionOption = {
  id: string;
  label: string;
  point: Point;
};

export type ExplanationOption = {
  id: string;
  label: string;
  correct?: boolean;
};

export type MissionDefinition = {
  id: string;
  number: number;
  title: string;
  eyebrow: string;
  objective: string;
  shortObjective: string;
  celebration: string;
  mode: MissionMode;
  board: BoardDefinition;
  skills: SkillId[];
  allowedCommands: Direction[];
  initialProgram?: Direction[];
  maxCommands?: number;
  hints: string[];
  predictionOptions?: PredictionOption[];
  explanationPrompt?: string;
  explanationOptions?: ExplanationOption[];
};

export type AgeMode = 'explorer' | 'builder' | 'creator';

export type LearnerProfile = {
  nickname: string;
  ageMode: AgeMode;
  interest: 'game' | 'robot' | 'app' | 'animation' | 'world' | 'ai';
};

export type MasteryEntry = {
  score: number;
  evidenceCount: number;
  independentSuccesses: number;
  hintSuccesses: number;
  lastPractised?: string;
};

export type SavedBuild = {
  id: string;
  title: string;
  program: Direction[];
  createdAt: string;
};

export type LearnerProgress = {
  completedMissionIds: string[];
  starsByMission: Record<string, number>;
  mastery: Record<SkillId, MasteryEntry>;
  savedBuilds: SavedBuild[];
};

