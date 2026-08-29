import { describe, expect, it } from 'vitest';

import {
  worldOneMissions,
  worldOneSkillOutcomes,
} from '../../../../packages/content/src/world-one';
import {
  applyMissionEvidence,
  createInitialProgress,
  hydrateProgress,
  masteryBandForOutcome,
} from '../../../../packages/mastery/src';

const wakeByte = worldOneMissions.find((mission) => mission.id === 'wake-byte');

if (!wakeByte) throw new Error('Missing wake-byte mission');

describe('mission-specific mastery evidence', () => {
  it('bounds the total contribution from repeated evidence on one mission', () => {
    let progress = createInitialProgress();
    const scores: number[] = [];

    for (let attempt = 0; attempt < 40; attempt += 1) {
      progress = applyMissionEvidence(progress, wakeByte, {
        hintsUsed: 0,
        attempts: 1,
      });
      scores.push(progress.mastery.sequence.score);
    }

    expect(scores.slice(0, 4)).toEqual([18, 21, 22, 22]);
    expect(scores.at(-1)).toBe(22);
    expect(progress.mastery.sequence.missionEvidence['wake-byte'].scoreAwarded).toBe(22);
    expect(
      masteryBandForOutcome(
        progress.mastery.sequence,
        worldOneSkillOutcomes.sequence,
      ),
    ).not.toBe('Mastered');
  });

  it('recognises improved independence without letting supported repetition dominate', () => {
    let supported = createInitialProgress();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      supported = applyMissionEvidence(supported, wakeByte, {
        hintsUsed: 3,
        attempts: 4,
      });
    }

    expect(supported.mastery.sequence.score).toBe(10);

    const improved = applyMissionEvidence(supported, wakeByte, {
      hintsUsed: 0,
      attempts: 1,
    });

    expect(improved.mastery.sequence.score).toBe(22);
    expect(
      improved.mastery.sequence.missionEvidence['wake-byte'].bestEvidenceScore,
    ).toBe(18);
  });

  it('does not preserve an unverifiable Mastered score from legacy aggregate data', () => {
    const initial = createInitialProgress();
    const legacy = {
      ...initial,
      mastery: {
        ...initial.mastery,
        sequence: {
          score: 100,
          evidenceCount: 40,
          independentSuccesses: 40,
          hintSuccesses: 0,
        },
      },
    };

    const hydrated = hydrateProgress(legacy);

    expect(hydrated.mastery.sequence.score).toBe(34);
    expect(hydrated.mastery.sequence.missionEvidence).toEqual({});
  });

  it('keeps every World 1 mastery target reachable through genuine independent play', () => {
    expect(
      Object.fromEntries(
        Object.entries(worldOneSkillOutcomes).map(([skill, outcome]) => [
          skill,
          outcome.target,
        ]),
      ),
    ).toEqual({
      sequence: 'mastery',
      prediction: 'mastery',
      debugging: 'mastery',
      efficiency: 'introduced',
      explanation: 'introduced',
      creative_application: 'mastery',
    });

    let progress = createInitialProgress();

    for (const mission of worldOneMissions) {
      progress = applyMissionEvidence(progress, mission, {
        hintsUsed: 0,
        attempts: 1,
      });
    }

    for (const [skill, outcome] of Object.entries(worldOneSkillOutcomes)) {
      const entry = progress.mastery[skill as keyof typeof progress.mastery];
      const band = masteryBandForOutcome(entry, outcome);
      expect(band).toBe(outcome.target === 'mastery' ? 'Mastered' : 'Introduced');
    }
  });
});
