import type {
  SkillDefinition,
  SkillId,
} from '../../lesson-schema/src';

export const skillGraph: Record<SkillId, SkillDefinition> = {
  sequence: {
    id: 'sequence',
    prerequisites: [],
    dimensions: ['recognise', 'predict', 'apply', 'debug', 'explain', 'transfer'],
    masteryRequirements: {
      apply: { minimumScore: 0.85, minimumContexts: 2, minimumIndependentSuccesses: 3 },
      predict: { minimumScore: 0.75, minimumContexts: 2, minimumIndependentSuccesses: 2 },
      debug: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
      transfer: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
    },
    reviewIntervalsDays: [7, 21],
  },
  prediction: {
    id: 'prediction',
    prerequisites: ['sequence'],
    dimensions: ['recognise', 'predict', 'apply', 'transfer'],
    masteryRequirements: {
      predict: { minimumScore: 0.75, minimumContexts: 2, minimumIndependentSuccesses: 3 },
      transfer: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
    },
    reviewIntervalsDays: [7, 21],
  },
  debugging: {
    id: 'debugging',
    prerequisites: ['sequence', 'prediction'],
    dimensions: ['recognise', 'predict', 'debug', 'explain', 'transfer'],
    masteryRequirements: {
      debug: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 3 },
      explain: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
      transfer: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
    },
    reviewIntervalsDays: [7, 21],
  },
  efficiency: {
    id: 'efficiency',
    prerequisites: ['sequence'],
    dimensions: ['recognise', 'apply', 'explain', 'transfer'],
    masteryRequirements: {
      apply: { minimumScore: 0.8, minimumContexts: 2, minimumIndependentSuccesses: 3 },
      explain: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
      transfer: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
    },
    reviewIntervalsDays: [7, 21],
  },
  explanation: {
    id: 'explanation',
    prerequisites: ['sequence'],
    dimensions: ['explain', 'transfer'],
    masteryRequirements: {
      explain: { minimumScore: 0.75, minimumContexts: 2, minimumIndependentSuccesses: 3 },
      transfer: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
    },
    reviewIntervalsDays: [7, 21],
  },
  creative_application: {
    id: 'creative_application',
    prerequisites: ['sequence'],
    dimensions: ['apply', 'explain', 'transfer'],
    masteryRequirements: {
      apply: { minimumScore: 0.8, minimumContexts: 2, minimumIndependentSuccesses: 3 },
      transfer: { minimumScore: 0.7, minimumContexts: 2, minimumIndependentSuccesses: 2 },
    },
    reviewIntervalsDays: [7, 21],
  },
};
