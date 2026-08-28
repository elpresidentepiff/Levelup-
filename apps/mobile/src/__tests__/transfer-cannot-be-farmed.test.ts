import { describe, expect, it } from 'vitest';

import { skillGraph } from '../../../../packages/content/src/skill-graph';
import {
  castleBossVariants,
  worldOneMissions,
} from '../../../../packages/content/src/world-one';
import { transferTrials } from '../../../../packages/content/src/transfer-trials';
import {
  createInitialProgress,
  evaluateMultidimensionalMastery,
  recordEvidenceEvents,
} from '../../../../packages/mastery/src';
import type { EvidenceEvent, LearnerProgress } from '../../../../packages/lesson-schema/src';

/**
 * Replaying one transfer trial cannot manufacture transfer mastery.
 *
 * TransferTrialScreen already refuses to write evidence for anything but a
 * first-attempt success. That is a rule in a screen, and a screen can be
 * rewritten by anyone in an afternoon. The model has to hold the same line, or
 * the guarantee lives exactly one refactor from disappearing — which is how the
 * original farming bug worked: the intent was documented, nothing enforced it.
 *
 * Transfer is the strongest claim this product makes about a child. It is the
 * claim most worth defending and the easiest to fake.
 */

const transferEvent = (
  trialIndex: number,
  sequence: number,
): EvidenceEvent => {
  const trial = transferTrials[trialIndex];
  return {
    id: `evt-${trial.id}-${sequence}`,
    schemaVersion: 1,
    missionId: trial.id,
    skillId: trial.skillId,
    evidenceType: 'transfer',
    context: trial.context,
    success: true,
    independent: true,
    attemptNumber: 1,
    hintsUsed: 0,
    timeToSolutionMs: 4000,
    programLength: 0,
    optimalProgramLength: 0,
    debugActions: 0,
    explanationResult: 'not_required',
    transferContext: trial.context,
    retrieval: false,
    timestamp: new Date(Date.now() + sequence * 1000).toISOString(),
  };
};

const transferOf = (progress: LearnerProgress, skill: 'sequence' | 'prediction' | 'debugging') =>
  progress.mastery[skill].dimensions.transfer;

describe('transfer evidence cannot be farmed', () => {
  it('counts one trial as one context, however many times it is replayed', () => {
    let progress = createInitialProgress();
    // Fifty perfect, independent, first-attempt runs of the rocket - every
    // event as strong as the model allows.
    for (let i = 0; i < 50; i += 1) {
      progress = recordEvidenceEvents(progress, [transferEvent(0, i)]);
    }

    const transfer = transferOf(progress, transferTrials[0].skillId as 'sequence');
    // Fifty successes at one task is one thing done fifty times, not fifty
    // pieces of evidence about transfer.
    expect(transfer.contexts.length).toBe(1);
  });

  it('does not let one repeated trial satisfy the transfer requirement', () => {
    let progress = createInitialProgress();
    for (let i = 0; i < 50; i += 1) {
      progress = recordEvidenceEvents(progress, [transferEvent(0, i)]);
    }

    const skill = transferTrials[0].skillId as 'sequence';
    const result = evaluateMultidimensionalMastery(progress.mastery[skill], skillGraph[skill]);
    const transferRequirement = result.requirements.find((item) => item.dimension === 'transfer');

    expect(transferRequirement, 'transfer requirement must exist').toBeDefined();
    expect(transferRequirement?.met, 'one repeated trial must not satisfy transfer').toBe(false);
  });

  it('leaves every V2 dimension reachable from World 1 content', () => {
    // The mirror of the farming test, across every dimension rather than just
    // transfer. A bar nothing can clear is not a high bar, it is a broken one,
    // and it fails silently: a capability nobody can reach looks exactly like a
    // child who has not reached it yet.
    //
    // This is the gate on making the V2 evaluator authoritative. Until it
    // passes, switching the visible labels would tell a child who did
    // everything correctly that they had mastered nothing.
    const contexts: Record<string, Record<string, Set<string>>> = {};
    const note = (skillId: string, dimension: string, context: string) => {
      ((contexts[skillId] ??= {})[dimension] ??= new Set()).add(context);
    };

    for (const mission of [...worldOneMissions, ...castleBossVariants]) {
      for (const item of mission.evidence) note(item.skillId, item.dimension, item.context);
    }
    for (const trial of transferTrials) note(trial.skillId, trial.dimension, trial.context);

    const shortfalls: string[] = [];
    for (const [skillId, definition] of Object.entries(skillGraph)) {
      for (const [dimension, requirement] of Object.entries(definition.masteryRequirements)) {
        const available = contexts[skillId]?.[dimension]?.size ?? 0;
        if (available < requirement.minimumContexts) {
          shortfalls.push(
            `${skillId}.${dimension}: needs ${requirement.minimumContexts} contexts, content provides ${available}`,
          );
        }
      }
    }

    expect(shortfalls, `\n  ${shortfalls.join('\n  ')}\n`).toEqual([]);
  });

  it('ignores a duplicate event id, so a resubmitted answer counts once', () => {
    let progress = createInitialProgress();
    const event = transferEvent(0, 1);
    progress = recordEvidenceEvents(progress, [event]);
    const after = recordEvidenceEvents(progress, [event, event, event]);

    expect(after.evidenceEvents.length).toBe(progress.evidenceEvents.length);
  });
});
