import { describe, expect, it } from 'vitest';

import {
  worldOneMissions,
  worldOneSkillOutcomes,
} from '../../../../packages/content/src/world-one';
import {
  applyMissionEvidence,
  createInitialProgress,
  masteryBandForOutcome,
} from '../../../../packages/mastery/src';

/**
 * The product claim is mastery. These tests defend that claim.
 *
 * docs/curriculum/WORLD_1.md states that completion is not mastery, and
 * docs/product/PRODUCT.md is to state that repeated play is not proof of it.
 * Nothing in the code enforced either, so this suite encodes the rule the
 * product already promises.
 *
 * These fail against the current implementation, and they are meant to. Any
 * implementation of the learning-integrity work must turn them green without
 * weakening the assertions - a mastery ledger that satisfies these is doing
 * the job; one that does not is decoration.
 */

const mission = (id: string) => {
  const found = worldOneMissions.find((item) => item.id === id);
  if (!found) throw new Error(`Missing mission ${id}`);
  return found;
};

/** A flawless run: no hints, first attempt. The best evidence a replay can offer. */
const perfect = { hintsUsed: 0, attempts: 1 };

describe('mastery cannot be farmed by repetition', () => {
  it('never reaches Mastered by replaying a single mission', () => {
    // wake-byte is the first mission: a 5x5 board, no walls, no gems, three
    // moves. It is the least demanding evidence available in the product.
    const easiest = mission('wake-byte');
    let progress = createInitialProgress();

    // Far more replays than a child would need to discover the exploit.
    for (let i = 0; i < 40; i += 1) {
      progress = applyMissionEvidence(progress, easiest, perfect);
    }

    const sequence = progress.mastery.sequence;
    expect(progress.completedMissionIds).toEqual(['wake-byte']);
    expect(
      masteryBandForOutcome(sequence, worldOneSkillOutcomes.sequence),
    ).not.toBe('Mastered');
  });

  it('gives repeat plays of the same mission sharply diminishing value', () => {
    const easiest = mission('wake-byte');
    let progress = createInitialProgress();

    progress = applyMissionEvidence(progress, easiest, perfect);
    const afterFirst = progress.mastery.sequence.score;

    progress = applyMissionEvidence(progress, easiest, perfect);
    const afterSecond = progress.mastery.sequence.score;

    progress = applyMissionEvidence(progress, easiest, perfect);
    const afterThird = progress.mastery.sequence.score;

    const secondGain = afterSecond - afterFirst;
    const thirdGain = afterThird - afterSecond;

    // Repetition of an already-solved task is practice, not new evidence.
    // Each further replay must be worth strictly less than the one before it,
    // converging on nothing.
    expect(secondGain).toBeLessThan(afterFirst);
    expect(thirdGain).toBeLessThan(secondGain);
  });

  it('requires evidence from more than one mission before Mastered', () => {
    const easiest = mission('wake-byte');
    let progress = createInitialProgress();

    for (let i = 0; i < 40; i += 1) {
      progress = applyMissionEvidence(progress, easiest, perfect);
    }

    // One mission solved, however many times, is one piece of evidence.
    const distinctMissions = progress.completedMissionIds.length;
    const claimsMastery =
      masteryBandForOutcome(
        progress.mastery.sequence,
        worldOneSkillOutcomes.sequence,
      ) === 'Mastered';

    expect(claimsMastery && distinctMissions < 2).toBe(false);
  });

  it('does not let hint-supported repetition outweigh independent work', () => {
    const easiest = mission('wake-byte');

    let supported = createInitialProgress();
    // Solved only ever with the full hint ladder, many times over.
    for (let i = 0; i < 20; i += 1) {
      supported = applyMissionEvidence(supported, easiest, { hintsUsed: 3, attempts: 4 });
    }

    let independent = createInitialProgress();
    // Solved once, alone, first time.
    independent = applyMissionEvidence(independent, easiest, perfect);

    // Twenty guided repetitions must not read as more mastery than one
    // unaided success. Volume is not independence.
    expect(supported.mastery.sequence.score).toBeLessThanOrEqual(
      independent.mastery.sequence.score,
    );
  });
});
