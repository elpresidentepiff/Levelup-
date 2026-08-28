import { describe, expect, it } from 'vitest';

import { worldOneMissions } from '../../../../packages/content/src/world-one';
import {
  applyMissionEvidence,
  createInitialProgress,
  hydrateProgress,
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
});
