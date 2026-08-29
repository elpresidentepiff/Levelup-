import { describe, expect, it } from 'vitest';

import { skillGraph } from '../../../../packages/content/src/skill-graph';
import { worldOneMissions } from '../../../../packages/content/src/world-one';
import {
  classifyMisconception,
  evaluateMission,
} from '../../../../packages/learning-engine/src';
import type {
  Direction,
  SkillId,
} from '../../../../packages/lesson-schema/src';
import {
  createInitialProgress,
  createMissionEvidenceEvents,
  evaluateMultidimensionalMastery,
  hydrateProgress,
  recordEvidenceEvents,
} from '../../../../packages/mastery/src';

const mission = (id: string) => {
  const found = worldOneMissions.find((item) => item.id === id);
  if (!found) throw new Error(`Missing mission ${id}`);
  return found;
};

const solutions: Record<string, Direction[]> = {
  'wake-byte': ['right', 'right', 'up'],
  'treasure-run': ['right', 'right', 'right', 'right', 'up', 'up'],
  'predict-byte': ['right', 'right', 'up'],
  'broken-bridge': ['right', 'up', 'right', 'right'],
  'many-ways': ['right', 'right', 'right', 'right', 'up', 'up', 'up', 'up'],
  'shortest-route': ['up', 'right', 'right', 'right', 'right', 'down'],
  'tell-byte': ['right', 'right', 'right', 'up', 'up', 'up'],
  'secret-bug': ['right', 'right', 'up', 'up', 'right', 'right'],
  'build-your-maze': ['up', 'up', 'up', 'up', 'right', 'right', 'right', 'right'],
  // Both routes below are the true optimum for their board, confirmed by the
  // same breadth-first search that vets the boss variants - not by eye.
  'long-way-round': ['down', 'right', 'right', 'right', 'up', 'right'],
  'out-of-order': ['right', 'right', 'up', 'up'],
  'castle-boss': ['right', 'right', 'right', 'right', 'up', 'up', 'up', 'up'],
};

describe('Learning Engine V2 evidence', () => {
  it('keeps every World 1 evidence definition valid and its optimal route solvable', () => {
    for (const item of worldOneMissions) {
      expect(item.optimalProgramLength).toBeGreaterThan(0);
      expect(solutions[item.id]).toHaveLength(item.optimalProgramLength);
      expect(evaluateMission(item, solutions[item.id]).passed).toBe(true);
      expect(item.evidence.length).toBeGreaterThan(0);

      const evidenceKeys = new Set<string>();
      for (const definition of item.evidence) {
        expect(item.skills).toContain(definition.skillId);
        const key = `${definition.skillId}:${definition.dimension}:${definition.context}`;
        expect(evidenceKeys.has(key)).toBe(false);
        evidenceKeys.add(key);
      }
    }
  });

  it('builds complete, schema-controlled evidence events', () => {
    const item = mission('predict-byte');
    const events = createMissionEvidenceEvents(item, {
      eventIdPrefix: 'predict-byte:attempt-1',
      successByDimension: { predict: false },
      attemptNumber: 1,
      hintsUsed: 0,
      timeToSolutionMs: 4200,
      predictionBeforeRun: 'b',
      predictionCorrect: false,
      programLength: 3,
      debugActions: 0,
      misconception: 'prediction_mismatch',
      timestamp: '2026-08-28T22:00:00.000Z',
    });

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.skillId)).toEqual(['prediction', 'sequence']);
    expect(events.every((event) => event.schemaVersion === 1)).toBe(true);
    expect(events.every((event) => event.success === false)).toBe(true);
    expect(events.every((event) => event.independent)).toBe(true);
    expect(events.every((event) => event.optimalProgramLength === 3)).toBe(true);
    expect(events.every((event) => event.misconception === 'prediction_mismatch')).toBe(true);
  });

  it('derives multidimensional evidence with independence affecting the score', () => {
    const item = mission('wake-byte');
    const common = {
      successByDimension: { apply: true },
      attemptNumber: 1,
      timeToSolutionMs: 3000,
      programLength: 3,
      debugActions: 0,
      timestamp: '2026-08-28T22:00:00.000Z',
    } as const;
    const independentEvents = createMissionEvidenceEvents(item, {
      ...common,
      eventIdPrefix: 'independent',
      hintsUsed: 0,
    });
    const supportedEvents = createMissionEvidenceEvents(item, {
      ...common,
      eventIdPrefix: 'supported',
      hintsUsed: 3,
    });

    const independent = recordEvidenceEvents(
      createInitialProgress(),
      independentEvents,
    );
    const supported = recordEvidenceEvents(
      createInitialProgress(),
      supportedEvents,
    );

    expect(independent.mastery.sequence.dimensions.apply.score).toBe(1);
    expect(supported.mastery.sequence.dimensions.apply.score).toBe(0.4);
    expect(independent.mastery.sequence.independence).toBe(1);
    expect(supported.mastery.sequence.independence).toBe(0);
    expect(independent.mastery.sequence.dimensions.apply.contexts).toEqual([
      'grid-basic-route',
    ]);
  });

  it('records failures, ignores duplicate event IDs, and rebuilds from storage', () => {
    const item = mission('wake-byte');
    const success = createMissionEvidenceEvents(item, {
      eventIdPrefix: 'attempt-1',
      successByDimension: { apply: true },
      attemptNumber: 1,
      hintsUsed: 0,
      timeToSolutionMs: 3000,
      programLength: 3,
      debugActions: 0,
      timestamp: '2026-08-28T22:00:00.000Z',
    });
    const failure = createMissionEvidenceEvents(item, {
      eventIdPrefix: 'attempt-2',
      successByDimension: { apply: false },
      attemptNumber: 2,
      hintsUsed: 0,
      timeToSolutionMs: 1800,
      programLength: 2,
      debugActions: 1,
      misconception: 'stops_one_step_short',
      timestamp: '2026-08-28T22:01:00.000Z',
    });
    let progress = recordEvidenceEvents(createInitialProgress(), success);
    progress = recordEvidenceEvents(progress, [...success, ...failure]);

    expect(progress.evidenceEvents).toHaveLength(2);
    expect(progress.mastery.sequence.dimensions.apply.score).toBe(0.5);
    expect(progress.mastery.sequence.dimensions.apply.evidenceCount).toBe(2);

    const stored = JSON.parse(JSON.stringify(progress));
    stored.evidenceEvents.push({ id: 'malformed' });
    const hydrated = hydrateProgress(stored);
    expect(hydrated.evidenceEvents).toHaveLength(2);
    expect(hydrated.mastery.sequence.dimensions.apply.score).toBe(0.5);
  });
});

describe('misconception classification', () => {
  it('classifies deterministic failure patterns instead of storing only failed', () => {
    const collisionMission = mission('broken-bridge');
    const collision = evaluateMission(collisionMission, ['right', 'right']);
    expect(
      classifyMisconception(collisionMission, collision, { attemptNumber: 1 }),
    ).toBe('collision_not_anticipated');

    const predictionMission = mission('predict-byte');
    const prediction = evaluateMission(predictionMission, solutions['predict-byte']);
    expect(
      classifyMisconception(predictionMission, prediction, {
        predictionCorrect: false,
        attemptNumber: 1,
      }),
    ).toBe('prediction_mismatch');

    const efficiencyMission = mission('shortest-route');
    const inefficient = evaluateMission(efficiencyMission, [
      ...solutions['shortest-route'],
      'left',
      'right',
    ]);
    expect(
      classifyMisconception(efficiencyMission, inefficient, { attemptNumber: 1 }),
    ).toBe('unnecessary_commands');

    const treasureMission = mission('treasure-run');
    const missedCollectibles = evaluateMission(treasureMission, [
      'up',
      'up',
      'right',
      'right',
      'right',
      'right',
    ]);
    expect(
      classifyMisconception(treasureMission, missedCollectibles, {
        attemptNumber: 1,
      }),
    ).toBe('goal_only_ignores_collectibles');

    const oneStepShort = evaluateMission(mission('wake-byte'), ['right', 'right']);
    expect(
      classifyMisconception(mission('wake-byte'), oneStepShort, {
        attemptNumber: 1,
      }),
    ).toBe('stops_one_step_short');
  });
});

describe('skill graph', () => {
  it('is complete, acyclic, and uses valid multidimensional requirements', () => {
    const skillIds = Object.keys(skillGraph) as SkillId[];
    expect(skillIds).toHaveLength(6);

    for (const skill of skillIds) {
      const definition = skillGraph[skill];
      expect(definition.id).toBe(skill);
      expect(definition.prerequisites).not.toContain(skill);
      expect(definition.reviewIntervalsDays).toEqual([7, 21]);
      for (const prerequisite of definition.prerequisites) {
        expect(skillGraph[prerequisite]).toBeDefined();
      }
      for (const [dimension, requirement] of Object.entries(
        definition.masteryRequirements,
      )) {
        expect(definition.dimensions).toContain(dimension);
        expect(requirement.minimumScore).toBeGreaterThan(0);
        expect(requirement.minimumScore).toBeLessThanOrEqual(1);
        expect(requirement.minimumContexts).toBeGreaterThanOrEqual(2);
        expect(requirement.minimumIndependentSuccesses).toBeGreaterThanOrEqual(2);
      }
    }

    const visiting = new Set<SkillId>();
    const visited = new Set<SkillId>();
    const visit = (skill: SkillId) => {
      expect(visiting.has(skill)).toBe(false);
      if (visited.has(skill)) return;
      visiting.add(skill);
      for (const prerequisite of skillGraph[skill].prerequisites) visit(prerequisite);
      visiting.delete(skill);
      visited.add(skill);
    };
    for (const skill of skillIds) visit(skill);
    expect(visited.size).toBe(skillIds.length);
  });

  it('requires every configured dimension rather than a single aggregate score', () => {
    const entry = createInitialProgress().mastery.sequence;
    const definition = skillGraph.sequence;

    for (const [dimension, requirement] of Object.entries(
      definition.masteryRequirements,
    )) {
      entry.dimensions[dimension as keyof typeof entry.dimensions] = {
        score: requirement.minimumScore,
        evidenceCount: requirement.minimumIndependentSuccesses,
        independentSuccesses: requirement.minimumIndependentSuccesses,
        contexts: Array.from(
          { length: requirement.minimumContexts },
          (_, index) => `${dimension}-context-${index + 1}`,
        ),
      };
    }

    expect(evaluateMultidimensionalMastery(entry, definition).mastered).toBe(true);

    entry.dimensions.transfer.contexts = ['only-one-context'];
    const notTransferred = evaluateMultidimensionalMastery(entry, definition);
    expect(notTransferred.mastered).toBe(false);
    expect(
      notTransferred.requirements.find(
        (requirement) => requirement.dimension === 'transfer',
      )?.met,
    ).toBe(false);
  });
});
