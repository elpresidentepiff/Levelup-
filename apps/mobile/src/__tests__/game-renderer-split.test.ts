import { describe, expect, it } from 'vitest';

import {
  contextPrefixForTask,
  playableTaskKinds,
  type PlayableTaskKind,
} from '../../../../packages/content/src/tasks';
import { themeSkins } from '../../../../packages/content/src/themes';
import {
  castleBossVariants,
  worldOneMissions,
} from '../../../../packages/content/src/world-one';
import { createMissionEvidenceEvents } from '../../../../packages/mastery/src';
import type { GameTheme } from '../../../../packages/lesson-schema/src';

/**
 * The learning task and the game it is dressed as must stay separable.
 *
 * World 1 used to be one board with twelve layouts, and every context it
 * recorded began with `grid-`. That is a product weakness and an integrity
 * one: contexts are the breadth measure, the single quantity replay cannot
 * inflate, and fifteen contexts drawn from one modality are not fifteen
 * situations. A child had shown their thinking in one world, fifteen ways.
 *
 * Splitting the renderer out fixes that only if two rules hold, and both are
 * easy to break by accident:
 *
 *   1. Evidence must never see the theme, or two skins of one task stop being
 *      comparable and the ledger starts recording art direction.
 *   2. A theme must never be able to mint a context, or breadth becomes
 *      farmable by the cheapest method available - change the art, claim a new
 *      situation. That would be the original farming bug wearing a costume.
 */

const missionsAndVariants = [...worldOneMissions, ...castleBossVariants];

describe('learning task is separable from game renderer', () => {
  it('produces identical evidence when only the theme changes', () => {
    // The decisive test. If a renderer or a skin can reach the evidence path,
    // this diverges - and every claim about comparing a maze to a checklist
    // stops being true.
    const common = {
      eventIdPrefix: 'theme-blind',
      successByDimension: { apply: true, debug: true, predict: true, transfer: true },
      attemptNumber: 1,
      hintsUsed: 0,
      timeToSolutionMs: 4000,
      programLength: 4,
      debugActions: 0,
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    for (const mission of missionsAndVariants) {
      const asBuilt = createMissionEvidenceEvents(mission, common);
      for (const theme of Object.keys(themeSkins) as GameTheme[]) {
        const restyled = createMissionEvidenceEvents({ ...mission, theme }, common);
        expect(restyled, `${mission.variantId ?? mission.id} re-skinned as ${theme}`).toEqual(
          asBuilt,
        );
      }
    }
  });

  it('does not let a theme mint a new context', () => {
    // Context names are pinned to what the child does, not to what it looks
    // like. Re-skinning a maze as a factory leaves it a maze, and the name has
    // to keep saying so or the breadth count becomes a lie.
    for (const mission of missionsAndVariants) {
      const prefix = contextPrefixForTask[mission.task.kind as PlayableTaskKind];
      for (const item of mission.evidence) {
        expect(
          item.context.startsWith(prefix),
          `${mission.variantId ?? mission.id} records "${item.context}" for a ${mission.task.kind} task`,
        ).toBe(true);
      }
    }
  });

  it('gives every mission a renderer that can actually play it', () => {
    for (const mission of missionsAndVariants) {
      expect(
        (playableTaskKinds as readonly string[]).includes(mission.task.kind),
        `${mission.id} declares an unplayable task`,
      ).toBe(true);
    }
  });

  it('offers more than one kind of game, so the world is not one board again', () => {
    // The regression that matters. World 1 passing every other test while
    // being a single interaction is exactly the state this work exists to
    // leave behind, and nothing else in the suite would notice it returning.
    const kinds = new Set(worldOneMissions.map((mission) => mission.task.kind));
    expect(kinds.size, `World 1 offers only: ${[...kinds].join(', ')}`).toBeGreaterThan(1);
  });

  it('gives every theme a complete skin', () => {
    for (const [id, skin] of Object.entries(themeSkins)) {
      expect(skin.id, `${id} skin id`).toBe(id);
      for (const field of ['label', 'actor', 'goal', 'token', 'instruction', 'program', 'runVerb'] as const) {
        expect(skin[field]?.length, `${id}.${field}`).toBeGreaterThan(0);
      }
    }
  });
});
