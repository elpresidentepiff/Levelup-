import type {
  DimensionMastery,
  EvidenceDimension,
  EvidenceEvent,
  LearnerProgress,
  MasteryEntry,
  MissionMasteryEvidence,
  MissionDefinition,
  SavedBuild,
  SkillDefinition,
  SkillId,
  WorldSkillOutcome,
} from '../../lesson-schema/src';

export const skillLabels: Record<SkillId, string> = {
  sequence: 'Sequencing',
  prediction: 'Prediction',
  debugging: 'Debugging',
  efficiency: 'Efficient thinking',
  explanation: 'Explaining ideas',
  creative_application: 'Creative application',
};

export const evidenceDimensions: EvidenceDimension[] = [
  'recognise',
  'predict',
  'apply',
  'debug',
  'explain',
  'transfer',
];

const emptyDimension = (): DimensionMastery => ({
  score: 0,
  evidenceCount: 0,
  independentSuccesses: 0,
  contexts: [],
});

const emptyDimensions = (): Record<EvidenceDimension, DimensionMastery> => ({
  recognise: emptyDimension(),
  predict: emptyDimension(),
  apply: emptyDimension(),
  debug: emptyDimension(),
  explain: emptyDimension(),
  transfer: emptyDimension(),
});

const emptyEntry = (): MasteryEntry => ({
  score: 0,
  evidenceCount: 0,
  independentSuccesses: 0,
  hintSuccesses: 0,
  missionEvidence: {},
  dimensions: emptyDimensions(),
  independence: 0,
  retention: 0,
  confidence: 0,
  retrievalCount: 0,
  retrievalSuccesses: 0,
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
  evidenceEvents: [],
});

type CompletionEvidence = {
  hintsUsed: number;
  attempts: number;
};

export type MissionEvidenceInput = {
  eventIdPrefix: string;
  successByDimension: Partial<Record<EvidenceDimension, boolean>>;
  attemptNumber: number;
  hintsUsed: number;
  timeToSolutionMs: number;
  predictionBeforeRun?: string;
  predictionCorrect?: boolean;
  programLength: number;
  debugActions: number;
  explanationResult?: EvidenceEvent['explanationResult'];
  misconception?: EvidenceEvent['misconception'];
  retrieval?: boolean;
  timestamp: string;
};

export const createMissionEvidenceEvents = (
  mission: MissionDefinition,
  input: MissionEvidenceInput,
): EvidenceEvent[] =>
  mission.evidence.flatMap((definition, index) => {
    const success = input.successByDimension[definition.dimension];
    if (success === undefined) return [];

    return [{
      id: `${input.eventIdPrefix}:${definition.skillId}:${definition.dimension}:${index}`,
      schemaVersion: 1,
      missionId: mission.id,
      skillId: definition.skillId,
      evidenceType: definition.dimension,
      context: definition.context,
      success,
      independent: input.hintsUsed === 0,
      attemptNumber: input.attemptNumber,
      hintsUsed: input.hintsUsed,
      timeToSolutionMs: input.timeToSolutionMs,
      predictionBeforeRun: input.predictionBeforeRun,
      predictionCorrect: input.predictionCorrect,
      programLength: input.programLength,
      optimalProgramLength: mission.optimalProgramLength,
      debugActions: input.debugActions,
      explanationResult: input.explanationResult ?? 'not_required',
      transferContext:
        definition.dimension === 'transfer' ? definition.context : undefined,
      misconception: input.misconception,
      retrieval: input.retrieval ?? false,
      timestamp: input.timestamp,
    }];
  });

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
      ...previous,
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

const maximumStoredEvidenceEvents = 2000;

const evidenceValue = (event: EvidenceEvent) => {
  if (!event.success) return 0;
  if (event.independent) return 1;
  return Math.max(0.35, 0.7 - event.hintsUsed * 0.1);
};

const roundedRatio = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 100) / 100;

const latestTimestamp = (events: EvidenceEvent[]) =>
  events.reduce<string | undefined>(
    (latest, event) => !latest || event.timestamp > latest ? event.timestamp : latest,
    undefined,
  );

const deriveDimensions = (
  skillEvents: EvidenceEvent[],
): Record<EvidenceDimension, DimensionMastery> =>
  Object.fromEntries(
    evidenceDimensions.map((dimension) => {
      const events = skillEvents.filter((event) => event.evidenceType === dimension);
      return [dimension, {
        score: roundedRatio(
          events.reduce((sum, event) => sum + evidenceValue(event), 0),
          events.length,
        ),
        evidenceCount: events.length,
        independentSuccesses: events.filter(
          (event) => event.success && event.independent,
        ).length,
        contexts: [...new Set(events.map((event) => event.context))],
        lastPractised: latestTimestamp(events),
      } satisfies DimensionMastery];
    }),
  ) as Record<EvidenceDimension, DimensionMastery>;

const deriveEntryEvidence = (
  entry: MasteryEntry,
  skillEvents: EvidenceEvent[],
): MasteryEntry => {
  const dimensions = deriveDimensions(skillEvents);
  const successes = skillEvents.filter((event) => event.success);
  const retrievalEvents = skillEvents.filter((event) => event.retrieval);
  const practisedDimensions = evidenceDimensions
    .map((dimension) => dimensions[dimension])
    .filter((dimension) => dimension.evidenceCount > 0);
  const confidence = practisedDimensions.length === 0
    ? 0
    : Math.round(
        (
          practisedDimensions.reduce((sum, dimension) => {
            const evidenceCoverage = Math.min(1, dimension.evidenceCount / 3);
            const contextCoverage = Math.min(1, dimension.contexts.length / 2);
            return sum + dimension.score * evidenceCoverage * contextCoverage;
          }, 0) / practisedDimensions.length
        ) * 100,
      ) / 100;

  return {
    ...entry,
    dimensions,
    independence: roundedRatio(
      successes.filter((event) => event.independent).length,
      successes.length,
    ),
    retention: roundedRatio(
      retrievalEvents.filter((event) => event.success).length,
      retrievalEvents.length,
    ),
    confidence,
    retrievalCount: retrievalEvents.length,
    retrievalSuccesses: retrievalEvents.filter((event) => event.success).length,
    lastPractised: latestTimestamp(skillEvents) ?? entry.lastPractised,
  };
};

const deriveProgressEvidence = (progress: LearnerProgress): LearnerProgress => ({
  ...progress,
  mastery: {
    sequence: deriveEntryEvidence(
      progress.mastery.sequence,
      progress.evidenceEvents.filter((event) => event.skillId === 'sequence'),
    ),
    prediction: deriveEntryEvidence(
      progress.mastery.prediction,
      progress.evidenceEvents.filter((event) => event.skillId === 'prediction'),
    ),
    debugging: deriveEntryEvidence(
      progress.mastery.debugging,
      progress.evidenceEvents.filter((event) => event.skillId === 'debugging'),
    ),
    efficiency: deriveEntryEvidence(
      progress.mastery.efficiency,
      progress.evidenceEvents.filter((event) => event.skillId === 'efficiency'),
    ),
    explanation: deriveEntryEvidence(
      progress.mastery.explanation,
      progress.evidenceEvents.filter((event) => event.skillId === 'explanation'),
    ),
    creative_application: deriveEntryEvidence(
      progress.mastery.creative_application,
      progress.evidenceEvents.filter(
        (event) => event.skillId === 'creative_application',
      ),
    ),
  },
});

export const recordEvidenceEvents = (
  progress: LearnerProgress,
  events: EvidenceEvent[],
): LearnerProgress => {
  const seenIds = new Set(progress.evidenceEvents.map((event) => event.id));
  const uniqueEvents = events.filter((event) => {
    if (seenIds.has(event.id)) return false;
    seenIds.add(event.id);
    return true;
  });
  if (uniqueEvents.length === 0) return progress;

  return deriveProgressEvidence({
    ...progress,
    evidenceEvents: [...progress.evidenceEvents, ...uniqueEvents].slice(
      -maximumStoredEvidenceEvents,
    ),
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finiteNonNegative = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;

const clampedUnit = (value: unknown) =>
  Math.max(0, Math.min(1, finiteNonNegative(value)));

const hydrateDimension = (value: unknown): DimensionMastery => {
  if (!isRecord(value)) return emptyDimension();
  return {
    score: clampedUnit(value.score),
    evidenceCount: finiteNonNegative(value.evidenceCount),
    independentSuccesses: finiteNonNegative(value.independentSuccesses),
    contexts: Array.isArray(value.contexts)
      ? value.contexts.filter(
          (context): context is string => typeof context === 'string',
        )
      : [],
    lastPractised:
      typeof value.lastPractised === 'string' ? value.lastPractised : undefined,
  };
};

const hydrateDimensions = (
  value: unknown,
): Record<EvidenceDimension, DimensionMastery> => {
  const stored = isRecord(value) ? value : {};
  return {
    recognise: hydrateDimension(stored.recognise),
    predict: hydrateDimension(stored.predict),
    apply: hydrateDimension(stored.apply),
    debug: hydrateDimension(stored.debug),
    explain: hydrateDimension(stored.explain),
    transfer: hydrateDimension(stored.transfer),
  };
};

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
    dimensions: hydrateDimensions(value.dimensions),
    independence: clampedUnit(value.independence),
    retention: clampedUnit(value.retention),
    confidence: clampedUnit(value.confidence),
    retrievalCount: finiteNonNegative(value.retrievalCount),
    retrievalSuccesses: finiteNonNegative(value.retrievalSuccesses),
    nextReviewAt:
      typeof value.nextReviewAt === 'string' ? value.nextReviewAt : undefined,
    lastPractised:
      typeof value.lastPractised === 'string' ? value.lastPractised : undefined,
  };
};

const hydrateSavedBuilds = (value: unknown): SavedBuild[] =>
  Array.isArray(value) ? (value as SavedBuild[]) : [];

const skillIds: SkillId[] = [
  'sequence',
  'prediction',
  'debugging',
  'efficiency',
  'explanation',
  'creative_application',
];

const misconceptionCodes: NonNullable<EvidenceEvent['misconception']>[] = [
  'direction_confusion',
  'order_reversal',
  'goal_only_ignores_collectibles',
  'collision_not_anticipated',
  'stops_one_step_short',
  'unnecessary_commands',
  'random_trial_and_error',
  'prediction_mismatch',
  'bug_not_resolved',
  'goal_not_reached',
];

const hydrateEvidenceEvents = (value: unknown): EvidenceEvent[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate) => {
    if (!isRecord(candidate)) return [];
    if (
      candidate.schemaVersion !== 1 ||
      typeof candidate.id !== 'string' ||
      typeof candidate.missionId !== 'string' ||
      typeof candidate.skillId !== 'string' ||
      !skillIds.includes(candidate.skillId as SkillId) ||
      typeof candidate.evidenceType !== 'string' ||
      !evidenceDimensions.includes(candidate.evidenceType as EvidenceDimension) ||
      typeof candidate.context !== 'string' ||
      typeof candidate.success !== 'boolean' ||
      typeof candidate.independent !== 'boolean' ||
      typeof candidate.timestamp !== 'string'
    ) {
      return [];
    }

    const explanationResult =
      candidate.explanationResult === 'correct' ||
      candidate.explanationResult === 'incorrect'
        ? candidate.explanationResult
        : 'not_required';
    const misconception =
      typeof candidate.misconception === 'string' &&
      misconceptionCodes.includes(
        candidate.misconception as NonNullable<EvidenceEvent['misconception']>,
      )
        ? candidate.misconception as EvidenceEvent['misconception']
        : undefined;
    const event: EvidenceEvent = {
      id: candidate.id,
      schemaVersion: 1,
      missionId: candidate.missionId,
      skillId: candidate.skillId as SkillId,
      evidenceType: candidate.evidenceType as EvidenceDimension,
      context: candidate.context,
      success: candidate.success,
      independent: candidate.independent,
      attemptNumber: finiteNonNegative(candidate.attemptNumber, 1),
      hintsUsed: finiteNonNegative(candidate.hintsUsed),
      timeToSolutionMs: finiteNonNegative(candidate.timeToSolutionMs),
      predictionBeforeRun:
        typeof candidate.predictionBeforeRun === 'string'
          ? candidate.predictionBeforeRun
          : undefined,
      predictionCorrect:
        typeof candidate.predictionCorrect === 'boolean'
          ? candidate.predictionCorrect
          : undefined,
      programLength: finiteNonNegative(candidate.programLength),
      optimalProgramLength: finiteNonNegative(candidate.optimalProgramLength),
      debugActions: finiteNonNegative(candidate.debugActions),
      explanationResult,
      transferContext:
        typeof candidate.transferContext === 'string'
          ? candidate.transferContext
          : undefined,
      misconception,
      retrieval: candidate.retrieval === true,
      timestamp: candidate.timestamp,
    };
    return [event];
  }).slice(-maximumStoredEvidenceEvents);
};

export const hydrateProgress = (value: unknown): LearnerProgress => {
  const initial = createInitialProgress();
  if (!isRecord(value)) return initial;
  const storedMastery = isRecord(value.mastery) ? value.mastery : {};

  const evidenceEvents = hydrateEvidenceEvents(value.evidenceEvents);
  const progress: LearnerProgress = {
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
    evidenceEvents,
  };
  return evidenceEvents.length > 0 ? deriveProgressEvidence(progress) : progress;
};

export type MasteryBand =
  | 'Not started'
  | 'Introduced'
  | 'Learning'
  | 'Getting good'
  | 'Mastered';

export type DimensionRequirementResult = {
  dimension: EvidenceDimension;
  met: boolean;
  score: number;
  contexts: number;
  independentSuccesses: number;
};

export const evaluateMultidimensionalMastery = (
  entry: MasteryEntry,
  definition: SkillDefinition,
) => {
  const requirements = Object.entries(definition.masteryRequirements).map(
    ([dimension, requirement]) => {
      const evidenceDimension = dimension as EvidenceDimension;
      const evidence = entry.dimensions[evidenceDimension];
      return {
        dimension: evidenceDimension,
        met:
          evidence.score >= requirement.minimumScore &&
          evidence.contexts.length >= requirement.minimumContexts &&
          evidence.independentSuccesses >=
            requirement.minimumIndependentSuccesses,
        score: evidence.score,
        contexts: evidence.contexts.length,
        independentSuccesses: evidence.independentSuccesses,
      } satisfies DimensionRequirementResult;
    },
  );

  return {
    mastered:
      requirements.length > 0 &&
      requirements.every((requirement) => requirement.met),
    requirements,
    independence: entry.independence,
    retention: entry.retention,
    confidence: entry.confidence,
  };
};

const qualifyingMissionEvidence = (entry: MasteryEntry) =>
  Object.entries(entry.missionEvidence).filter(
    ([, evidence]) => evidence.scoreAwarded > 0,
  );

export const masteryProgress = (
  entry: MasteryEntry,
  outcome: WorldSkillOutcome,
) => {
  if (entry.score <= 0) return 0;
  if (outcome.target === 'introduced') {
    return Math.min(100, Math.round((entry.score / firstTryIndependentScore) * 100));
  }

  const evidence = qualifyingMissionEvidence(entry);
  const independentMissionIds = new Set(
    evidence
      .filter(([, item]) => item.independentSuccesses > 0)
      .map(([missionId]) => missionId),
  );
  const requiredMissionIds = outcome.criteria.requiredMissionIds ?? [];
  const requiredIndependentCount = requiredMissionIds.filter((missionId) =>
    independentMissionIds.has(missionId),
  ).length;
  const ratios = [
    entry.score / outcome.criteria.minimumScore,
    evidence.length / outcome.criteria.minimumDistinctMissions,
    independentMissionIds.size / outcome.criteria.minimumIndependentMissions,
    requiredMissionIds.length === 0
      ? 1
      : requiredIndependentCount / requiredMissionIds.length,
  ];

  return Math.max(0, Math.min(100, Math.round(Math.min(...ratios) * 100)));
};

export const masteryBandForOutcome = (
  entry: MasteryEntry,
  outcome: WorldSkillOutcome,
): MasteryBand => {
  if (entry.score <= 0) return 'Not started';
  if (outcome.target === 'introduced') return 'Introduced';

  const progress = masteryProgress(entry, outcome);
  if (progress >= 100) return 'Mastered';
  if (progress >= 50) return 'Getting good';
  return 'Learning';
};

export type MissionAccessStatus =
  | 'ready'
  | 'practice_recommended'
  | 'locked';

export type MissionAccessReason =
  | 'first_mission'
  | 'already_completed'
  | 'previous_mission_incomplete'
  | 'previous_mission_completed_independently'
  | 'previous_mission_completed_with_support';

export type MissionProgressionState = {
  missionId: string;
  completed: boolean;
  stars: number;
  access: MissionAccessStatus;
  playable: boolean;
  reason: MissionAccessReason;
};

const uniqueMissionsById = (missions: MissionDefinition[]) => {
  const seen = new Set<string>();
  return missions.filter((mission) => {
    if (seen.has(mission.id)) return false;
    seen.add(mission.id);
    return true;
  });
};

const hasIndependentMissionEvidence = (
  progress: LearnerProgress,
  mission: MissionDefinition,
) =>
  mission.skills.some(
    (skillId) =>
      (progress.mastery[skillId].missionEvidence[mission.id]
        ?.independentSuccesses ?? 0) > 0,
  ) || progress.starsByMission[mission.id] === 3;

/**
 * Content access is deliberately more permissive than capability progression.
 * Completing the previous mission always lets a child continue. Supported
 * completion recommends practice, but never turns help into a punishment.
 */
export const missionProgressionForWorld = (
  progress: LearnerProgress,
  missions: MissionDefinition[],
): MissionProgressionState[] => {
  const orderedMissions = uniqueMissionsById(missions);
  const completedMissionIds = new Set(progress.completedMissionIds);

  return orderedMissions.map((mission, index) => {
    const completed = completedMissionIds.has(mission.id);
    const stars = progress.starsByMission[mission.id] ?? 0;

    if (completed) {
      return {
        missionId: mission.id,
        completed,
        stars,
        access: 'ready',
        playable: true,
        reason: 'already_completed',
      };
    }

    if (index === 0) {
      return {
        missionId: mission.id,
        completed,
        stars,
        access: 'ready',
        playable: true,
        reason: 'first_mission',
      };
    }

    const previousMission = orderedMissions[index - 1];
    if (!completedMissionIds.has(previousMission.id)) {
      return {
        missionId: mission.id,
        completed,
        stars,
        access: 'locked',
        playable: false,
        reason: 'previous_mission_incomplete',
      };
    }

    const independent = hasIndependentMissionEvidence(progress, previousMission);
    return {
      missionId: mission.id,
      completed,
      stars,
      access: independent ? 'ready' : 'practice_recommended',
      playable: true,
      reason: independent
        ? 'previous_mission_completed_independently'
        : 'previous_mission_completed_with_support',
    };
  });
};

export type WorldCapabilityReadiness = {
  status: 'in_progress' | 'practice_needed' | 'ready';
  contentComplete: boolean;
  unmetMasteryTargets: SkillId[];
};

/**
 * Capability readiness is a separate, stricter decision. Only outcomes that
 * World 1 promises to master can gate the next world; introduced-only skills
 * remain honest introductions rather than impossible blockers.
 */
export const worldCapabilityReadiness = (
  progress: LearnerProgress,
  missions: MissionDefinition[],
  outcomes: Record<SkillId, WorldSkillOutcome>,
): WorldCapabilityReadiness => {
  const contentComplete = uniqueMissionsById(missions).every((mission) =>
    progress.completedMissionIds.includes(mission.id),
  );
  const unmetMasteryTargets = Object.values(outcomes).flatMap((outcome) =>
    outcome.target === 'mastery' &&
    masteryBandForOutcome(progress.mastery[outcome.skillId], outcome) !== 'Mastered'
      ? [outcome.skillId]
      : [],
  );

  return {
    status: !contentComplete
      ? 'in_progress'
      : unmetMasteryTargets.length > 0
        ? 'practice_needed'
        : 'ready',
    contentComplete,
    unmetMasteryTargets,
  };
};
