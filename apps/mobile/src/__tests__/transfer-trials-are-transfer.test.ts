import { describe, expect, it } from 'vitest';

import { castleBossVariants } from '../../../../packages/content/src/world-one';

/**
 * A transfer trial must not be a grid wearing a costume.
 *
 * This is the half of the bar that is invisible once the art is on top. The
 * stated rule — "replaying one transfer task cannot manufacture mastery" —
 * guards against volume. It does not guard against the trial being the same
 * puzzle it claims to transfer away from.
 *
 * The question every trial must answer is:
 *
 *     Could a child who has only ever memorised grid routes pass this?
 *
 * If yes, it is not transfer. It is the maze with a rocket drawn on it, and it
 * will record transfer evidence for a capability the child has not shown. That
 * is worse than having no transfer task at all, because the ledger then lies
 * with confidence.
 *
 * These fail until the trials exist, and they are meant to. An implementation
 * may change how the trials are loaded — the accessor below — but must not
 * weaken what is asserted about them.
 */

type Trial = {
  id: string;
  skillId: string;
  dimension: string;
  context: string;
  /** The vocabulary a learner answers in. Must not be grid movement. */
  answerVocabulary: string[];
  /** Distinct correct answers, so a single memorised response cannot pass all. */
  solution: unknown;
};

const GRID_VOCABULARY = new Set(['up', 'down', 'left', 'right']);

const loadTrials = async (): Promise<Trial[]> => {
  try {
    const mod = await import('../../../../packages/content/src/transfer-trials');
    return (mod as { transferTrials: Trial[] }).transferTrials;
  } catch {
    throw new Error(
      'Transfer trials are not implemented yet. This file is the specification ' +
        'they must satisfy: non-grid answer vocabulary, distinct contexts, and ' +
        'coverage of the dimensions World 1 cannot evidence on its own.',
    );
  }
};

describe('transfer trials are genuinely transfer', () => {
  it('ships at least three', async () => {
    const trials = await loadTrials();
    expect(trials.length).toBeGreaterThanOrEqual(3);
  });

  it('cannot be passed with grid movement', async () => {
    const trials = await loadTrials();
    for (const trial of trials) {
      // The decisive assertion. If a trial is answered in up/down/left/right,
      // a child who memorised Castle Boss can pass it without transferring
      // anything, and the evidence it records is false.
      const usesGrid = trial.answerVocabulary.some((token) =>
        GRID_VOCABULARY.has(String(token).toLowerCase()),
      );
      expect(usesGrid, `${trial.id} answers in grid directions`).toBe(false);

      // A vocabulary of one is not a task, it is a button.
      expect(trial.answerVocabulary.length, `${trial.id} vocabulary`).toBeGreaterThan(1);
    }
  });

  it('does not reuse a grid context, so the ledger can tell them apart', async () => {
    const trials = await loadTrials();
    const bossContexts = new Set(
      castleBossVariants.flatMap((variant) =>
        variant.evidence.filter((e) => e.dimension === 'transfer').map((e) => e.context),
      ),
    );

    const contexts = trials.map((trial) => trial.context);
    for (const context of contexts) {
      expect(bossContexts.has(context), `${context} reuses a grid boss context`).toBe(false);
      expect(context.includes('grid'), `${context} is labelled as grid`).toBe(false);
    }
    // One context each: three trials recording the same context is one trial
    // played three times.
    expect(new Set(contexts).size).toBe(trials.length);
  });

  it('records transfer evidence, not apply evidence', async () => {
    const trials = await loadTrials();
    for (const trial of trials) {
      expect(trial.dimension, `${trial.id} dimension`).toBe('transfer');
    }
  });

  it('covers more than one skill, so mastery cannot rest on a single trial', async () => {
    const trials = await loadTrials();
    expect(new Set(trials.map((trial) => trial.skillId)).size).toBeGreaterThan(1);
  });

  it('asks a different question in each trial', async () => {
    const trials = await loadTrials();
    // Identical solutions across trials would mean one answer passes all three,
    // which is memorisation with extra steps.
    const solutions = trials.map((trial) => JSON.stringify(trial.solution));
    expect(new Set(solutions).size).toBe(trials.length);
  });
});
