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
  interaction: 'order' | 'choose-next' | 'find-fault' | 'choose-shorter' | 'choose-reason';
  /** The stimulus shown before the question, when there is one. */
  given?: string[];
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
  {
    id: 'domino-last',
    title: 'Which domino falls last?',
    eyebrow: 'Prediction, no board',
    prompt:
      'The dominoes are pushed from the red end. Red knocks blue, blue knocks green, green knocks yellow. Which one falls last?',
    because:
      'Each domino only moves once the one before it has. Running the chain forward in your head is the same move as tracing a plan before you start it.',
    skillId: 'prediction',
    dimension: 'transfer',
    context: 'domino-chain',
    given: ['red', 'blue', 'green', 'yellow'],
    answerVocabulary: ['red', 'blue', 'green', 'yellow'],
    interaction: 'choose-next',
    solution: 'yellow',
  },
  {
    id: 'counting-rule',
    title: 'One number breaks the rule',
    eyebrow: 'Debugging, no Byte',
    prompt:
      'Every number should be two more than the one before it. One number breaks the rule. Which one?',
    because:
      'You find it by checking each step against the rule, not by looking at the end. The last number being wrong does not mean the last number is the mistake.',
    skillId: 'debugging',
    dimension: 'transfer',
    context: 'number-rule-fault',
    given: ['2', '4', '6', '9', '11'],
    answerVocabulary: ['2', '4', '6', '9', '11'],
    interaction: 'find-fault',
    solution: '9',
  },
  {
    id: 'sandwich-steps',
    title: 'Two ways to make lunch',
    eyebrow: 'Fewer steps, no grid',
    prompt:
      'Both plans make the same sandwich. Which plan does it in fewer steps?',
    because:
      'Getting everything out once is shorter than fetching each thing separately. Doing the same job in fewer steps is worth noticing everywhere, not just on a board.',
    skillId: 'efficiency',
    dimension: 'transfer',
    context: 'sandwich-plan',
    given: [
      'Plan A: get bread, get butter, get jam, spread butter, spread jam, close',
      'Plan B: get bread, spread butter, put butter away, get jam, spread jam, put jam away, close',
    ],
    answerVocabulary: ['plan-a', 'plan-b'],
    interaction: 'choose-shorter',
    solution: 'plan-a',
  },
  {
    id: 'tidy-route',
    title: 'Tidying the room',
    eyebrow: 'Fewer steps, no grid',
    prompt:
      'Both plans put every toy away. Which plan carries things fewer times?',
    because:
      'Collecting everything for one shelf before walking over beats one trip per toy. Grouping work that belongs together is the same idea as tightening a plan.',
    skillId: 'efficiency',
    dimension: 'transfer',
    context: 'tidy-plan',
    given: [
      'Plan A: carry one toy to the shelf, come back, carry the next, come back, and so on',
      'Plan B: gather every toy for the shelf, carry them together, then do the next shelf',
    ],
    answerVocabulary: ['plan-a', 'plan-b'],
    interaction: 'choose-shorter',
    solution: 'plan-b',
  },
  {
    id: 'why-it-worked',
    title: 'Why did it work?',
    eyebrow: 'Explaining, no grid',
    prompt:
      'A friend watered the seed every day and it grew. Which sentence explains it best?',
    because:
      'A good explanation names the cause, not just the order things happened in. "It grew after I watered it" says when; "it grew because water reached the roots" says why.',
    skillId: 'explanation',
    dimension: 'transfer',
    context: 'seed-explanation',
    answerVocabulary: [
      'it-grew-because-water-reached-the-roots',
      'it-grew-after-i-watered-it',
      'it-grew-because-i-waited',
    ],
    interaction: 'choose-reason',
    solution: 'it-grew-because-water-reached-the-roots',
  },
  {
    id: 'teach-a-friend',
    title: 'Telling someone else',
    eyebrow: 'Explaining, no grid',
    prompt:
      'You are telling a friend how to feed the cat, and you cannot show them. Which instruction is clearest?',
    because:
      'The clearest instruction says how much and where, because the person following it cannot see what you can. Explaining well means leaving nothing out that the other person needs.',
    skillId: 'explanation',
    dimension: 'transfer',
    context: 'instruction-clarity',
    answerVocabulary: [
      'put-one-scoop-in-the-blue-bowl-by-the-door',
      'feed-the-cat',
      'give-her-the-usual',
    ],
    interaction: 'choose-reason',
    solution: 'put-one-scoop-in-the-blue-bowl-by-the-door',
  },
  {
    id: 'new-machine',
    title: 'A different machine',
    eyebrow: 'Same idea, new job',
    prompt:
      'Byte follows a list of steps. Your friend has a music box that follows a list too. What do you already know that helps you use it?',
    because:
      'The machine changed and the idea did not. A list of steps, followed in order, does the same job whatever is reading it.',
    skillId: 'creative_application',
    dimension: 'transfer',
    // The castle is the only place creative application is evidenced, and a
    // child plays exactly one castle. Without a second context outside the
    // grid, the capability could never be earned however well a child played.
    context: 'new-machine-plan',
    answerVocabulary: [
      'write-the-steps-in-order',
      'press-buttons-until-it-works',
      'copy-someone-elses-song',
    ],
    interaction: 'choose-reason',
    solution: 'write-the-steps-in-order',
  },
];

/** The step order a learner is shown for the recipe, already broken. */
export const recipeAsGiven = ['crack-eggs', 'pour-eggs', 'heat-pan', 'add-butter', 'serve'];

/** The notes a learner is shown before the missing one. */
export const melodyAsGiven = ['low', 'mid', 'high', 'low', 'mid'];
