import type {
  LearnerProgress,
  MasteryEntry,
  MissionMasteryEvidence,
  MissionDefinition,
  SavedBuild,
  SkillId,
} from '../../lesson-schema/src';

export const skillLabels: Record<SkillId, string> = {
  sequence: 'Sequencing',
  prediction: 'Prediction',
  debugging: 'Debugging',
  efficiency: 'Efficient thinking',
  explanation: 'Explaining ideas',
  creative_application: 'Creative application',
};

const emptyEntry = (): MasteryEntry => ({
  score: 0,
  evidenceCount: 0,
  independentSuccesses: 0,
  hintSuccesses: 0,
  missionEvidence: {},
});

export const createInitialProgress = (): LearnerProgress => ({
  completedMissionIds: [],
  starsByMission: {},
  mastery: {
    sequence: emptyEntry(),
    prediction: emptyEntry(),
    debugging: emptyEntry(),
    efficiency: emptyEntry(),
    explanation: emptyEntry(),
    creative_application: emptyEntry(),
  },
  savedBuilds: [],
});

type CompletionEvidence = {
  hintsUsed: number;
  attempts: number;
};

const firstTryIndependentScore = 18;
const legacyUnverifiedScoreCap = 34;

const evidenceStrength = ({ hintsUsed, attempts }: CompletionEvidence) => {
  if (hintsUsed === 0 && attempts === 1) return firstTryIndependentScore;
  if (hintsUsed === 0) return 14;
  if (hintsUsed === 1) return 10;
  return 6;
};

const replayPracticeGain = (priorSuccessCount: number) => {
  if (priorSuccessCount === 1) return 3;
  if (priorSuccessCount === 2) return 1;
  return 0;
};

const emptyMissionEvidence = (now: string): MissionMasteryEvidence => ({
  successCount: 0,
  independentSuccesses: 0,
  supportedSuccesses: 0,
  bestEvidenceScore: 0,
  scoreAwarded: 0,
  lastPractised: now,
});

const updatedMissionEvidence = (
  previous: MissionMasteryEvidence | undefined,
  evidence: CompletionEvidence,
  now: string,
) => {
  const current = previous ?? emptyMissionEvidence(now);
  const strength = evidenceStrength(evidence);
  const qualityImprovement = Math.max(0, strength - current.bestEvidenceScore);
  const practiceGain =
    qualityImprovement === 0 ? replayPracticeGain(current.successCount) : 0;
  const scoreGain = qualityImprovement + practiceGain;
  const independent = evidence.hintsUsed === 0;

  return {
    scoreGain,
    evidence: {
      successCount: current.successCount + 1,
      independentSuccesses:
        current.independentSuccesses + (independent ? 1 : 0),
      supportedSuccesses:
        current.supportedSuccesses + (independent ? 0 : 1),
      bestEvidenceScore: Math.max(current.bestEvidenceScore, strength),
      scoreAwarded: current.scoreAwarded + scoreGain,
      lastPractised: now,
    },
  };
};

export const starsForEvidence = ({ hintsUsed, attempts }: CompletionEvidence) => {
  if (hintsUsed === 0 && attempts === 1) return 3;
  if (hintsUsed <= 1 && attempts <= 2) return 2;
  return 1;
};

export const applyMissionEvidence = (
  progress: LearnerProgress,
  mission: MissionDefinition,
  evidence: CompletionEvidence,
): LearnerProgress => {
  const independent = evidence.hintsUsed === 0;
  const alreadyCompleted = progress.completedMissionIds.includes(mission.id);
  const now = new Date().toISOString();
  const mastery = { ...progress.mastery };

  for (const skill of mission.skills) {
    const previous = mastery[skill];
    const missionEvidence = previous.missionEvidence ?? {};
    const update = updatedMissionEvidence(
      missionEvidence[mission.id],
      evidence,
      now,
    );
    mastery[skill] = {
      score: Math.min(100, previous.score + update.scoreGain),
      evidenceCount: previous.evidenceCount + 1,
      independentSuccesses:
        previous.independentSuccesses + (independent ? 1 : 0),
      hintSuccesses: previous.hintSuccesses + (independent ? 0 : 1),
      missionEvidence: {
        ...missionEvidence,
        [mission.id]: update.evidence,
      },
      lastPractised: now,
    };
  }

  const stars = starsForEvidence(evidence);
  return {
    ...progress,
    completedMissionIds: alreadyCompleted
      ? progress.completedMissionIds
      : [...progress.completedMissionIds, mission.id],
    starsByMission: {
      ...progress.starsByMission,
      [mission.id]: Math.max(progress.starsByMission[mission.id] ?? 0, stars),
    },
    mastery,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finiteNonNegative = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;

const hydrateMissionEvidence = (value: unknown) => {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([missionId, candidate]) => {
      if (!isRecord(candidate)) return [];
      const lastPractised =
        typeof candidate.lastPractised === 'string'
          ? candidate.lastPractised
          : new Date(0).toISOString();
      const hydrated: MissionMasteryEvidence = {
        successCount: finiteNonNegative(candidate.successCount),
        independentSuccesses: finiteNonNegative(candidate.independentSuccesses),
        supportedSuccesses: finiteNonNegative(candidate.supportedSuccesses),
        bestEvidenceScore: finiteNonNegative(candidate.bestEvidenceScore),
        scoreAwarded: finiteNonNegative(candidate.scoreAwarded),
        lastPractised,
      };
      return [[missionId, hydrated]];
    }),
  );
};

const hydrateMasteryEntry = (value: unknown): MasteryEntry => {
  if (!isRecord(value)) return emptyEntry();

  const missionEvidence = hydrateMissionEvidence(value.missionEvidence);
  const missionScores = Object.values(missionEvidence).map((entry) => entry.scoreAwarded);
  const storedScore = finiteNonNegative(value.score);
  const score =
    missionScores.length > 0
      ? Math.min(100, missionScores.reduce((sum, item) => sum + item, 0))
      : Math.min(legacyUnverifiedScoreCap, storedScore);

  return {
    score,
    evidenceCount: finiteNonNegative(value.evidenceCount),
    independentSuccesses: finiteNonNegative(value.independentSuccesses),
    hintSuccesses: finiteNonNegative(value.hintSuccesses),
    missionEvidence,
    lastPractised:
      typeof value.lastPractised === 'string' ? value.lastPractised : undefined,
  };
};

const hydrateSavedBuilds = (value: unknown): SavedBuild[] =>
  Array.isArray(value) ? (value as SavedBuild[]) : [];

export const hydrateProgress = (value: unknown): LearnerProgress => {
  const initial = createInitialProgress();
  if (!isRecord(value)) return initial;
  const storedMastery = isRecord(value.mastery) ? value.mastery : {};

  return {
    completedMissionIds: Array.isArray(value.completedMissionIds)
      ? value.completedMissionIds.filter(
          (missionId): missionId is string => typeof missionId === 'string',
        )
      : [],
    starsByMission: isRecord(value.starsByMission)
      ? Object.fromEntries(
          Object.entries(value.starsByMission).flatMap(([missionId, stars]) =>
            typeof stars === 'number' && Number.isFinite(stars)
              ? [[missionId, Math.max(0, Math.min(3, stars))]]
              : [],
          ),
        )
      : {},
    mastery: {
      sequence: hydrateMasteryEntry(storedMastery.sequence),
      prediction: hydrateMasteryEntry(storedMastery.prediction),
      debugging: hydrateMasteryEntry(storedMastery.debugging),
      efficiency: hydrateMasteryEntry(storedMastery.efficiency),
      explanation: hydrateMasteryEntry(storedMastery.explanation),
      creative_application: hydrateMasteryEntry(storedMastery.creative_application),
    },
    savedBuilds: hydrateSavedBuilds(value.savedBuilds),
  };
};

export const masteryBand = (score: number) => {
  if (score >= 70) return 'Mastered';
  if (score >= 35) return 'Getting good';
  if (score > 0) return 'Learning';
  return 'Not started';
};
