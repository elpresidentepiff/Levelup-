import type {
  LearnerProgress,
  MasteryEntry,
  MissionDefinition,
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
  const evidenceGain = alreadyCompleted ? 4 : independent ? 18 : 10;
  const now = new Date().toISOString();
  const mastery = { ...progress.mastery };

  for (const skill of mission.skills) {
    const previous = mastery[skill];
    mastery[skill] = {
      score: Math.min(100, previous.score + evidenceGain),
      evidenceCount: previous.evidenceCount + 1,
      independentSuccesses:
        previous.independentSuccesses + (independent ? 1 : 0),
      hintSuccesses: previous.hintSuccesses + (independent ? 0 : 1),
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

export const masteryBand = (score: number) => {
  if (score >= 70) return 'Mastered';
  if (score >= 35) return 'Getting good';
  if (score > 0) return 'Learning';
  return 'Not started';
};

