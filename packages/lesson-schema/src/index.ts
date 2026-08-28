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

export type EvidenceDimension =
  | 'recognise'
  | 'predict'
  | 'apply'
  | 'debug'
  | 'explain'
  | 'transfer';

export type MisconceptionCode =
  | 'direction_confusion'
  | 'order_reversal'
  | 'goal_only_ignores_collectibles'
  | 'collision_not_anticipated'
  | 'stops_one_step_short'
  | 'unnecessary_commands'
  | 'random_trial_and_error'
  | 'prediction_mismatch'
  | 'bug_not_resolved'
  | 'goal_not_reached';

export type MissionEvidenceDefinition = {
  skillId: SkillId;
  dimension: EvidenceDimension;
  context: string;
};

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
  optimalProgramLength: number;
  evidence: MissionEvidenceDefinition[];
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

export type MissionMasteryEvidence = {
  successCount: number;
  independentSuccesses: number;
  supportedSuccesses: number;
  bestEvidenceScore: number;
  scoreAwarded: number;
  lastPractised: string;
};

export type DimensionMastery = {
  score: number;
  evidenceCount: number;
  independentSuccesses: number;
  contexts: string[];
  lastPractised?: string;
};

export type EvidenceEvent = {
  id: string;
  schemaVersion: 1;
  missionId: string;
  skillId: SkillId;
  evidenceType: EvidenceDimension;
  context: string;
  success: boolean;
  independent: boolean;
  attemptNumber: number;
  hintsUsed: number;
  timeToSolutionMs: number;
  predictionBeforeRun?: string;
  predictionCorrect?: boolean;
  programLength: number;
  optimalProgramLength: number;
  debugActions: number;
  explanationResult: 'correct' | 'incorrect' | 'not_required';
  transferContext?: string;
  misconception?: MisconceptionCode;
  retrieval: boolean;
  timestamp: string;
};

export type MasteryEntry = {
  score: number;
  evidenceCount: number;
  independentSuccesses: number;
  hintSuccesses: number;
  missionEvidence: Record<string, MissionMasteryEvidence>;
  dimensions: Record<EvidenceDimension, DimensionMastery>;
  independence: number;
  retention: number;
  confidence: number;
  retrievalCount: number;
  retrievalSuccesses: number;
  nextReviewAt?: string;
  lastPractised?: string;
};

export type SkillMasteryCriteria = {
  minimumScore: number;
  minimumDistinctMissions: number;
  minimumIndependentMissions: number;
  requiredMissionIds?: string[];
};

export type DimensionMasteryRequirement = {
  minimumScore: number;
  minimumContexts: number;
  minimumIndependentSuccesses: number;
};

export type SkillDefinition = {
  id: SkillId;
  prerequisites: SkillId[];
  dimensions: EvidenceDimension[];
  masteryRequirements: Partial<
    Record<EvidenceDimension, DimensionMasteryRequirement>
  >;
  reviewIntervalsDays: number[];
};

export type WorldSkillOutcome =
  | {
      skillId: SkillId;
      target: 'introduced';
    }
  | {
      skillId: SkillId;
      target: 'mastery';
      criteria: SkillMasteryCriteria;
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
  evidenceEvents: EvidenceEvent[];
};
