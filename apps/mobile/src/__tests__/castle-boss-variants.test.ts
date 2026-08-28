import { describe, expect, it } from 'vitest';

import {
  castleBossVariants,
  selectCastleBossVariant,
} from '../../../../packages/content/src/world-one';
import { evaluateMission } from '../../../../packages/learning-engine/src';
import type { BoardDefinition, Direction, MissionDefinition } from '../../../../packages/lesson-schema/src';

/**
 * Boss variants are proved solvable, never assumed.
 *
 * The other missions carry hand-authored solutions in the test file. That does
 * not scale to variants and it does not catch an impossible board: of four
 * hand-designed candidates for this change, two were unsolvable and one needed
 * twelve moves against a ten-move budget. A search finds the true optimum, so
 * an unwinnable castle cannot reach a child.
 */

const MOVES: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** Breadth-first over (position, gems collected) — returns a shortest route. */
const shortestRoute = (board: BoardDefinition, limit: number): Direction[] | null => {
  const key = (x: number, y: number) => `${x}:${y}`;
  const walls = new Set(board.walls.map((w) => key(w.x, w.y)));
  const gems = board.gems.map((g) => key(g.x, g.y));
  const complete = (1 << gems.length) - 1;
  const collect = (x: number, y: number, mask: number) => {
    const index = gems.indexOf(key(x, y));
    return index === -1 ? mask : mask | (1 << index);
  };

  const startMask = collect(board.start.x, board.start.y, 0);
  const seen = new Set([`${board.start.x}:${board.start.y}:${startMask}`]);
  let frontier: Array<{ x: number; y: number; mask: number; path: Direction[] }> = [
    { x: board.start.x, y: board.start.y, mask: startMask, path: [] },
  ];

  while (frontier.length) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      if (node.x === board.goal.x && node.y === board.goal.y && node.mask === complete) {
        return node.path;
      }
      if (node.path.length >= limit) continue;
      for (const direction of Object.keys(MOVES) as Direction[]) {
        const x = node.x + MOVES[direction].dx;
        const y = node.y + MOVES[direction].dy;
        if (x < 0 || y < 0 || x >= board.columns || y >= board.rows) continue;
        if (walls.has(key(x, y))) continue;
        const mask = collect(x, y, node.mask);
        const id = `${x}:${y}:${mask}`;
        if (seen.has(id)) continue;
        seen.add(id);
        next.push({ x, y, mask, path: [...node.path, direction] });
      }
    }
    frontier = next;
  }
  return null;
};

describe('castle boss variants', () => {
  it('ships at least three boards', () => {
    expect(castleBossVariants.length).toBeGreaterThanOrEqual(3);
  });

  it('is solvable within its own command budget, and the declared optimum is true', () => {
    for (const variant of castleBossVariants) {
      const budget = variant.maxCommands ?? 12;
      const route = shortestRoute(variant.board, budget);

      expect(route, `${variant.id} has no solution within ${budget} commands`).not.toBeNull();
      const solution = route as Direction[];

      // The declared optimum must match the real one, or the efficiency
      // feedback a child receives is wrong.
      expect(solution.length, `${variant.id} optimal length`).toBe(variant.optimalProgramLength);

      // A child needs room to be imperfect, not only room to be optimal.
      expect(budget).toBeGreaterThan(solution.length);

      // And the engine must actually accept that route.
      expect(evaluateMission(variant, [...solution]).passed, `${variant.id} engine pass`).toBe(true);
    }
  });

  it('gives each variant genuinely different route logic, not a reskin', () => {
    const turnCounts = castleBossVariants.map((variant) => {
      const route = shortestRoute(variant.board, variant.maxCommands ?? 12) as Direction[];
      return route.reduce(
        (turns, step, index) => (index > 0 && step !== route[index - 1] ? turns + 1 : turns),
        0,
      );
    });
    // Identical turn counts across every board would mean the same puzzle three
    // times over, which is recall dressed as transfer.
    expect(new Set(turnCounts).size).toBeGreaterThan(1);
  });

  it('never reveals a solution through hints', () => {
    for (const variant of castleBossVariants) {
      expect(variant.hints, `${variant.id} must not carry hints`).toHaveLength(0);
    }
  });

  it('records transfer evidence with a board-specific context', () => {
    const contexts = new Set<string>();
    for (const variant of castleBossVariants) {
      const transfer = variant.evidence.filter((item) => item.dimension === 'transfer');
      expect(transfer.length, `${variant.id} transfer evidence`).toBeGreaterThan(0);
      transfer.forEach((item) => contexts.add(item.context));
    }
    // One distinct context per board, so the ledger records which castle was
    // beaten rather than a generic "boss" tag.
    expect(contexts.size).toBe(castleBossVariants.length);
  });

  it('selects deterministically and covers every variant across learners', () => {
    const first = selectCastleBossVariant('sofia-2019');
    expect(selectCastleBossVariant('sofia-2019').id).toBe(first.id);

    const seen = new Set<string>();
    for (let i = 0; i < 300; i += 1) seen.add(selectCastleBossVariant(`learner-${i}`).id);
    expect(seen.size).toBe(castleBossVariants.length);
  });
});

export type { MissionDefinition };
