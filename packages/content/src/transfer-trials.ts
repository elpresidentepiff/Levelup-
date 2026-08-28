import type { SkillId } from '../../lesson-schema/src';

/**
 * Non-grid transfer trials.
 *
 * Castle Boss proves a child can apply sequencing, prediction and debugging on
 * a grid. It cannot prove they hold the idea apart from the grid, because every
 * answer is still up/down/left/right — a child who memorised routes can pass it
 * without transferring anything.
 *
 * Each trial below asks the same thinking in a world with no board, no Byte and
 * no movement. The answer vocabulary is deliberately drawn from the trial's own
 * domain: if a task can be answered in grid directions, it is the maze with new
 * art, and the transfer evidence it records would be false.
 *
 * Three different questions, not one question three times:
 *   - rocket   put unordered steps into a working order
 *   - melody   run a pattern forward and say what comes next
 *   - recipe   find the one step that breaks the outcome
 */

export type TransferTrial = {
  id: string;
  title: string;
  eyebrow: string;
  /** What the child is asked, in their language. */
  prompt: string;
  /** Why the answer is right, shown only after they commit. */
  because: string;
  skillId: SkillId;
  dimension: 'transfer';
  /** Recorded on the evidence event so the ledger knows which world this was. */
  context: string;
  /** The tokens a learner answers in. Never grid movement. */
  answerVocabulary: string[];
  /** How the answer is given, so the screen knows what to render. */
  interaction: 'order' | 'choose-next' | 'find-fault';
  solution: unknown;
};

export const transferTrials: TransferTrial[] = [
  {
    id: 'rocket-launch',
    title: 'Launch the rocket',
    eyebrow: 'Order without a map',
    prompt:
      'The launch steps are jumbled. Put them in an order that gets the rocket off the ground safely.',
    because:
      'Some steps only work after another one. The hatch has to close before ignition, and the clamps only release once the engine is lit.',
    skillId: 'sequence',
    dimension: 'transfer',
    context: 'rocket-launch-order',
    // Domain steps, not directions. Ordering these needs the idea of sequence,
    // not a remembered route.
    answerVocabulary: ['check-hull', 'load-fuel', 'close-hatch', 'ignite', 'release-clamps'],
    interaction: 'order',
    solution: ['check-hull', 'load-fuel', 'close-hatch', 'ignite', 'release-clamps'],
  },
  {
    id: 'melody-next',
    title: 'What comes next?',
    eyebrow: 'Prediction without a board',
    prompt:
      'Listen to the pattern: low, mid, high, low, mid — which note comes next?',
    because:
      'The pattern repeats in threes. After low and mid, high finishes the group, the same way a repeated set of instructions runs the same way every time.',
    skillId: 'prediction',
    dimension: 'transfer',
    context: 'melody-pattern',
    answerVocabulary: ['low', 'mid', 'high', 'rest'],
    interaction: 'choose-next',
    solution: 'high',
  },
  {
    id: 'recipe-repair',
    title: 'The eggs went wrong',
    eyebrow: 'Debugging without Byte',
    prompt:
      'These steps were followed exactly and the eggs still came out wrong. Which step happened too early?',
    because:
      'Pouring the eggs before the pan is hot is the broken step. Everything after it was fine — the fault was earlier than where the problem showed up.',
    skillId: 'debugging',
    dimension: 'transfer',
    context: 'recipe-fault',
    answerVocabulary: ['crack-eggs', 'pour-eggs', 'heat-pan', 'add-butter', 'serve'],
    interaction: 'find-fault',
    // "In the wrong place" had two defensible answers - pour-eggs could move
    // later, or heat-pan could move earlier - and a debugging task with two
    // right answers teaches a child that their correct reasoning was wrong.
    // "Too early" has exactly one.
    // The recipe as presented runs: crack, pour, heat, butter, serve.
    solution: 'pour-eggs',
  },
];

/** The step order a learner is shown for the recipe, already broken. */
export const recipeAsGiven = ['crack-eggs', 'pour-eggs', 'heat-pan', 'add-butter', 'serve'];

/** The notes a learner is shown before the missing one. */
export const melodyAsGiven = ['low', 'mid', 'high', 'low', 'mid'];
