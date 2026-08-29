import { describe, expect, it } from 'vitest';

import { evaluateMission, missionBoard, runProgram } from '../../../../packages/learning-engine/src';
import { worldOneMissions } from '../../../../packages/content/src/world-one';
import { applyMissionEvidence, createInitialProgress } from '../../../../packages/mastery/src';

const mission = (id: string) => {
  const found = worldOneMissions.find((item) => item.id === id);
  if (!found) throw new Error(`Missing mission ${id}`);
  return found;
};

describe('deterministic learning engine', () => {
  it('ships a valid route for every World 1 mission', () => {
    const solutions = {
      'wake-byte': ['right', 'right', 'up'],
      'treasure-run': ['right', 'right', 'right', 'right', 'up', 'up'],
      'predict-byte': ['right', 'right', 'up'],
      'broken-bridge': ['right', 'up', 'right', 'right'],
      'many-ways': ['right', 'right', 'right', 'right', 'up', 'up', 'up', 'up'],
      'shortest-route': ['up', 'right', 'right', 'right', 'right', 'down'],
      'tell-byte': ['right', 'right', 'right', 'up', 'up', 'up'],
      'secret-bug': ['right', 'right', 'up', 'up', 'right', 'right'],
      'build-your-maze': ['up', 'up', 'up', 'up', 'right', 'right', 'right', 'right'],
      'long-way-round': ['down', 'right', 'right', 'right', 'up', 'right'],
      'castle-boss': ['right', 'right', 'right', 'right', 'up', 'up', 'up', 'up'],
    } as const;

    for (const item of worldOneMissions) {
      if (item.task.kind !== 'run-program') continue;
      expect(evaluateMission(item, [...solutions[item.id as keyof typeof solutions]]).passed).toBe(true);
    }
  });

  it('completes Wake Byte with the intended sequence', () => {
    const result = evaluateMission(mission('wake-byte'), ['right', 'right', 'up']);
    expect(result.passed).toBe(true);
    expect(result.execution.finalPosition).toEqual({ x: 2, y: 2 });
  });

  it('stops safely when a route hits a wall', () => {
    const result = runProgram(missionBoard(mission('broken-bridge')), ['right', 'right']);
    expect(result.status).toBe('collision');
    expect(result.finalPosition).toEqual({ x: 1, y: 3 });
  });

  it('requires every gem before a mission passes', () => {
    const treasure = mission('treasure-run');
    const complete = evaluateMission(treasure, ['right', 'right', 'right', 'right', 'up', 'up']);
    const incomplete = evaluateMission(treasure, ['up', 'up', 'right', 'right', 'right', 'right']);
    expect(complete.passed).toBe(true);
    expect(incomplete.passed).toBe(false);
  });

  it('enforces the shortest-route command limit', () => {
    const shortest = mission('shortest-route');
    const concise = evaluateMission(shortest, ['up', 'right', 'right', 'right', 'right', 'down']);
    const wasteful = evaluateMission(shortest, ['up', 'right', 'right', 'right', 'right', 'down', 'left', 'right']);
    expect(concise.passed).toBe(true);
    expect(wasteful.passed).toBe(false);
    expect(wasteful.checks.withinCommandLimit).toBe(false);
  });

  it('records stronger evidence for an independent first attempt', () => {
    const base = createInitialProgress();
    const independent = applyMissionEvidence(base, mission('wake-byte'), { hintsUsed: 0, attempts: 1 });
    const scaffolded = applyMissionEvidence(base, mission('wake-byte'), { hintsUsed: 2, attempts: 3 });
    expect(independent.mastery.sequence.score).toBeGreaterThan(scaffolded.mastery.sequence.score);
    expect(independent.starsByMission['wake-byte']).toBe(3);
    expect(scaffolded.starsByMission['wake-byte']).toBe(1);
  });
});
