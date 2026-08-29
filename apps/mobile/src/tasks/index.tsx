import type { ReactElement } from 'react';
import {
  playableTaskKinds,
  type PlayableTaskKind,
} from '../../../../packages/content/src/tasks';
import type { TaskKind } from '../../../../packages/lesson-schema/src';
import { OrderStepsTask } from './OrderStepsTask';
import { RunProgramTask } from './RunProgramTask';
import type { TaskRendererProps } from './contract';

export type { TaskAttempt, TaskRendererProps } from './contract';

/**
 * Task kind decides the renderer. Theme decides only how it looks.
 *
 * Adding a game fantasy must never mean adding a branch here - a rocket and a
 * pizza order are both order-steps, and both arrive at this registry as the
 * same entry. A new entry is warranted only when the child genuinely does
 * something new, which is the line this file exists to keep visible.
 */
export const taskRenderers: Record<PlayableTaskKind, (props: TaskRendererProps) => ReactElement> = {
  'run-program': RunProgramTask,
  'order-steps': OrderStepsTask,
};

export const rendererFor = (kind: TaskKind) =>
  (playableTaskKinds as readonly TaskKind[]).includes(kind)
    ? taskRenderers[kind as PlayableTaskKind]
    : undefined;
