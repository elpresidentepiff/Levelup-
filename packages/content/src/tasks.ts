import type { TaskKind } from '../../lesson-schema/src';

/**
 * The task kinds World 1 can actually play.
 *
 * The renderer registry is typed against this list, so a kind cannot be
 * playable without a renderer and a renderer cannot exist for a kind no
 * mission may declare. Content and app stay in step through the type checker
 * rather than through anyone remembering.
 */
export const playableTaskKinds = ['run-program', 'order-steps'] as const;

export type PlayableTaskKind = (typeof playableTaskKinds)[number];

const assertKinds: readonly TaskKind[] = playableTaskKinds;
void assertKinds;

/**
 * How a context name must begin, given what the child actually does.
 *
 * Contexts are the breadth measure - the one quantity replay cannot inflate.
 * If a context could be renamed by re-skinning, breadth would become farmable
 * again by the cheapest possible means: change the art, claim a new situation.
 * Pinning the prefix to the task rather than the theme is what stops that. A
 * factory-skinned maze is still a maze, and must still say so.
 */
export const contextPrefixForTask: Record<PlayableTaskKind, string> = {
  'run-program': 'grid-',
  'order-steps': 'kitchen-',
};
