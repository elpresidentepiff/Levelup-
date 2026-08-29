import type { ThemeSkin } from '../../../../packages/content/src/themes';
import type {
  AgeMode,
  Direction,
  EvidenceDimension,
  EvidenceEvent,
  MissionDefinition,
} from '../../../../packages/lesson-schema/src';

/**
 * The seam between a learning task and the game it is dressed as.
 *
 * Everything a renderer is allowed to say back to the learning shell is in
 * TaskAttempt. Note what is absent: no theme, no sprite, no board, no
 * vocabulary. A renderer reports whether the child succeeded and on which
 * dimensions, and the shell turns that into evidence without ever knowing
 * whether it was watching a maze or a launch checklist.
 *
 * That asymmetry is deliberate and load-bearing. If a renderer could influence
 * how evidence is scored, two themes of one task would stop being comparable,
 * and the context count - the one breadth measure replay cannot inflate -
 * would go back to meaning nothing.
 */
export type TaskAttempt = {
  passed: boolean;
  /**
   * Which dimensions this attempt speaks to. The shell adds `explain`
   * separately, after the question that follows a successful attempt.
   */
  successByDimension: Partial<Record<EvidenceDimension, boolean>>;
  /** Length of whatever the child assembled, for the efficiency signal. */
  programLength: number;
  /** Edits made before running: the effort signal for debugging. */
  debugActions: number;
  misconception?: EvidenceEvent['misconception'];
  /** Shown to the child when the attempt did not pass. */
  failureMessage?: string;
  /** Present only when the mission asked for a prediction first. */
  predictionCorrect?: boolean;
  /** What to hand to saved builds. Empty for tasks with no program. */
  program?: Direction[];
};

export type TaskRendererProps = {
  mission: MissionDefinition;
  skin: ThemeSkin;
  ageMode: AgeMode;
  /** True once the mission is passed or an attempt is mid-flight. */
  locked: boolean;
  /** Reported so a renderer can disable input while the shell animates. */
  busy: boolean;
  onAttemptStart: () => void;
  onAttempt: (attempt: TaskAttempt) => void;
  wide: boolean;
  width: number;
};
