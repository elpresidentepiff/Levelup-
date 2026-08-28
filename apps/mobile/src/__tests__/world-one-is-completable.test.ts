import { describe, expect, it } from 'vitest';

import { skillGraph } from '../../../../packages/content/src/skill-graph';
import {
  castleBossVariants,
  worldOneMissions,
} from '../../../../packages/content/src/world-one';
import { transferTrials } from '../../../../packages/content/src/transfer-trials';
import {
  createInitialProgress,
  createMissionEvidenceEvents,
  evaluateMultidimensionalMastery,
  recordEvidenceEvents,
} from '../../../../packages/mastery/src';
import type {
  EvidenceDimension,
  EvidenceEvent,
  LearnerProgress,
  MissionDefinition,
  SkillId,
} from '../../../../packages/lesson-schema/src';

/**
 * The other half of the anti-farming bar.
 *
 * Every other integrity test asks whether mastery can be faked. This one asks
 * the opposite question, which is just as capable of being answered wrongly and
 * far quieter when it is: can a child who does everything right actually earn
 * it?
 *
 * A capability nobody can reach is indistinguishable, on screen, from a child
 * who has not reached it yet. Byte would say "Not yet" forever and nothing in
 * the system would report a fault.
 *
 * The reachability gate next door counts declared contexts. That is necessary
 * and not sufficient - it was itself wrong for a while, counting three castle
 * variants a child can never all play. This test plays the world instead,
 * through the same evidence path the app uses.
 */

const perfectRun = (mission: MissionDefinition, prefix: string, at: number) => {
  const successByDimension: Partial<Record<EvidenceDimension, boolean>> = {};
  for (const definition of mission.evidence) {
    // MissionScreen collects explain separately, after the route is judged.
    if (definition.dimension === 'explain') continue;
    successByDimension[definition.dimension] = true;
  }
  const common = {
    attemptNumber: 1,
    hintsUsed: 0,
    timeToSolutionMs: 4000,
    programLength: mission.optimalProgramLength,
    debugActions: 0,
    timestamp: new Date(at).toISOString(),
  };

  const events = createMissionEvidenceEvents(mission, {
    ...common,
    eventIdPrefix: `${prefix}:run`,
    successByDimension,
  });
  if (!mission.explanationOptions?.length) return events;

  return [
    ...events,
    ...createMissionEvidenceEvents(mission, {
      ...common,
      eventIdPrefix: `${prefix}:explain`,
      successByDimension: { explain: true },
      explanationResult: 'correct',
    }),
  ];
};

const perfectTrial = (
  trial: (typeof transferTrials)[number],
  prefix: string,
  at: number,
): EvidenceEvent => ({
  id: `${prefix}:${trial.id}`,
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
  timestamp: new Date(at).toISOString(),
});

/** One faultless pass over the whole world, playing a single castle. */
const playthrough = (
  progress: LearnerProgress,
  variant: MissionDefinition,
  round: number,
) => {
  let current = progress;
  let clock = Date.UTC(2026, 0, 1) + round * 86_400_000;

  for (const mission of worldOneMissions) {
    // A child is handed one castle, never all three.
    const played = mission.id === variant.id ? variant : mission;
    clock += 60_000;
    current = recordEvidenceEvents(
      current,
      perfectRun(played, `r${round}:${played.variantId ?? played.id}`, clock),
    );
  }
  for (const trial of transferTrials) {
    clock += 60_000;
    current = recordEvidenceEvents(current, [perfectTrial(trial, `r${round}`, clock)]);
  }
  return current;
};

const unmet = (progress: LearnerProgress) =>
  Object.entries(skillGraph).flatMap(([skillId, definition]) =>
    evaluateMultidimensionalMastery(progress.mastery[skillId as SkillId], definition)
      .requirements.filter((requirement) => !requirement.met)
      .map((requirement) => ({ skillId, ...requirement })),
  );

describe('World 1 can actually be completed', () => {
  it.each(castleBossVariants.map((variant) => [variant.variantId, variant] as const))(
    'masters every skill in two faultless playthroughs of the %s castle',
    (_label, variant) => {
      let progress = createInitialProgress();
      progress = playthrough(progress, variant, 0);
      progress = playthrough(progress, variant, 1);

      expect(
        unmet(progress).map((item) => `${item.skillId}.${item.dimension}`),
        'a child who never makes a mistake must be able to finish the world',
      ).toEqual([]);
    },
  );

  it.each(castleBossVariants.map((variant) => [variant.variantId, variant] as const))(
    'never leaves a %s-castle capability short on breadth rather than repetition',
    (_label, variant) => {
      // After one perfect pass, anything still outstanding must be waiting on
      // repetition, which a child can supply. A context shortfall cannot be
      // supplied by any amount of play, because contexts are a set: it means
      // the content itself is missing, and no child will ever clear it.
      const progress = playthrough(createInitialProgress(), variant, 0);

      const missingBreadth = unmet(progress)
        .filter((item) => {
          const requirement =
            skillGraph[item.skillId as SkillId].masteryRequirements[item.dimension];
          return requirement !== undefined && item.contexts < requirement.minimumContexts;
        })
        .map((item) => `${item.skillId}.${item.dimension}: ${item.contexts} contexts`);

      expect(missingBreadth, '\n  ' + missingBreadth.join('\n  ') + '\n').toEqual([]);
    },
  );

  it('gives every mission that declares explain evidence a way to produce it', () => {
    // MissionScreen shows the explanation step when a mission carries options,
    // and emits explain evidence only when one is answered correctly. So a
    // mission that declares explain evidence without options declares evidence
    // no child can ever generate - the failure this whole file exists to catch,
    // in its cheapest form. The two must move together, in both directions.
    for (const mission of [...worldOneMissions, ...castleBossVariants]) {
      const declaresExplain = mission.evidence.some((item) => item.dimension === 'explain');
      const asksForExplanation = Boolean(mission.explanationOptions?.length);
      const label = mission.variantId ?? mission.id;

      expect(declaresExplain, `${label} asks for an explanation it records nothing for`).toBe(
        asksForExplanation,
      );

      if (!asksForExplanation) continue;
      expect(mission.explanationPrompt, `${label} has options but no question`).toBeTruthy();
      // Exactly one correct option: none makes the mission uncompletable, and
      // more than one makes a child's correct reasoning a coin toss.
      expect(
        mission.explanationOptions?.filter((option) => option.correct === true).length,
        `${label} must have exactly one correct explanation`,
      ).toBe(1);
    }
  });

  it('does not hand out an explain dimension to a child who never explains', () => {
    // Withholding only the explanation proves the dimension is load-bearing in
    // the model. This is about the requirement, not the screen - the contract
    // between content and screen is the test above.
    let progress = createInitialProgress();
    let clock = Date.UTC(2026, 0, 1);
    for (let round = 0; round < 20; round += 1) {
      for (const mission of worldOneMissions) {
        const successByDimension: Partial<Record<EvidenceDimension, boolean>> = {};
        for (const definition of mission.evidence) {
          if (definition.dimension === 'explain') continue;
          successByDimension[definition.dimension] = true;
        }
        clock += 60_000;
        progress = recordEvidenceEvents(
          progress,
          createMissionEvidenceEvents(mission, {
            eventIdPrefix: `noexplain:${round}:${mission.id}`,
            successByDimension,
            attemptNumber: 1,
            hintsUsed: 0,
            timeToSolutionMs: 4000,
            programLength: mission.optimalProgramLength,
            debugActions: 0,
            timestamp: new Date(clock).toISOString(),
          }),
        );
      }
    }

    const explanation = evaluateMultidimensionalMastery(
      progress.mastery.explanation,
      skillGraph.explanation,
    );
    expect(explanation.mastered, 'explaining nothing must not master explanation').toBe(false);
  });
});
