import type {
  RunProgramTask,
  MissionDefinition,
  SkillId,
  WorldSkillOutcome,
} from '../../lesson-schema/src';

const allDirections = ['up', 'right', 'down', 'left'] as const;

export const worldOneMissions: MissionDefinition[] = [
  {
    id: 'wake-byte',
    number: 1,
    title: 'Wake Byte',
    eyebrow: 'First instructions',
    objective: 'Build a route that wakes Byte and reaches the glowing portal.',
    shortObjective: 'Help Byte reach the glow.',
    celebration: 'You made a machine follow your instructions!',
    mode: 'construct',
    theme: 'maze',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 3 },
        goal: { x: 2, y: 2 },
        walls: [],
        gems: [],
      },
      allowedCommands: [...allDirections],
      maxCommands: 5,
    },
    skills: ['sequence'],
    optimalProgramLength: 3,
    evidence: [
      { skillId: 'sequence', dimension: 'apply', context: 'grid-basic-route' },
    ],
    hints: [
      'Start by looking at which direction the glow is from Byte.',
      'Byte needs to move sideways before moving up.',
      'Try two Right tiles, then one Up tile.',
    ],
  },
  {
    id: 'treasure-run',
    number: 2,
    title: 'Treasure Run',
    eyebrow: 'Order matters',
    objective: 'Collect both energy gems, then finish at the portal.',
    shortObjective: 'Collect 2 gems, then finish.',
    celebration: 'Every step happened in exactly the order you chose.',
    mode: 'construct',
    theme: 'treasure',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 4 },
        goal: { x: 4, y: 2 },
        walls: [
          { x: 1, y: 3 },
          { x: 2, y: 3 },
        ],
        gems: [
          { x: 2, y: 4 },
          { x: 4, y: 3 },
        ],
      },
      allowedCommands: [...allDirections],
      maxCommands: 8,
    },
    skills: ['sequence'],
    optimalProgramLength: 6,
    evidence: [
      { skillId: 'sequence', dimension: 'apply', context: 'grid-ordered-collection' },
    ],
    hints: [
      'Plan a route that visits the gems before the portal.',
      'The clear path starts along the bottom row.',
      'Move Right four times, then Up twice.',
    ],
  },
  {
    id: 'predict-byte',
    number: 3,
    title: 'Predict Byte',
    eyebrow: 'Think before Run',
    objective: 'Read the instructions and predict where Byte will finish.',
    shortObjective: 'Where will Byte finish?',
    celebration: 'You ran the instructions inside your head first.',
    mode: 'predict',
    theme: 'traffic',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 1, y: 3 },
        goal: { x: 3, y: 2 },
        walls: [],
        gems: [],
      },
      allowedCommands: [...allDirections],
      initialProgram: ['right', 'right', 'up'],
    },
    skills: ['prediction', 'sequence'],
    optimalProgramLength: 3,
    evidence: [
      { skillId: 'prediction', dimension: 'predict', context: 'grid-fixed-program' },
      { skillId: 'sequence', dimension: 'predict', context: 'grid-fixed-program' },
    ],
    predictionOptions: [
      { id: 'a', label: 'Purple A', point: { x: 3, y: 2 } },
      { id: 'b', label: 'Blue B', point: { x: 2, y: 2 } },
      { id: 'c', label: 'Orange C', point: { x: 3, y: 3 } },
    ],
    hints: [
      'Trace one arrow at a time without pressing Run.',
      'The two Right arrows change the column twice.',
      'Byte finishes two spaces right and one space up.',
    ],
  },
  {
    id: 'broken-bridge',
    number: 4,
    title: 'Broken Bridge',
    eyebrow: 'Fix the route',
    objective: 'The route has a bug. Change the instructions so Byte avoids the block.',
    shortObjective: 'Fix the broken route.',
    celebration: 'You found and fixed a bug instead of starting over.',
    mode: 'debug',
    theme: 'factory',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 3 },
        goal: { x: 3, y: 2 },
        walls: [{ x: 2, y: 3 }],
        gems: [],
      },
      allowedCommands: [...allDirections],
      initialProgram: ['right', 'right', 'up', 'right'],
      maxCommands: 6,
    },
    skills: ['debugging', 'sequence'],
    optimalProgramLength: 4,
    evidence: [
      { skillId: 'debugging', dimension: 'debug', context: 'grid-obstacle-repair' },
      { skillId: 'sequence', dimension: 'apply', context: 'grid-obstacle-repair' },
      // Repairing a route that stalls is debugging a sequence. The mission
      // already demands it; it simply was not written down.
      { skillId: 'sequence', dimension: 'debug', context: 'grid-obstacle-repair' },
      // Fixing a bug and being able to say what the bug was are different
      // abilities. A child can arrive at a working route by trying arrows until
      // one sticks; naming the cause is what separates that from debugging.
      { skillId: 'debugging', dimension: 'explain', context: 'grid-obstacle-repair' },
    ],
    explanationPrompt: 'What went wrong with the first route?',
    explanationOptions: [
      {
        id: 'blocked-square',
        label: 'Byte was told to move onto the blocked square, so it could not go any further.',
        correct: true,
      },
      { id: 'too-few', label: 'The route did not have enough instructions in it.' },
      { id: 'wrong-start', label: 'Byte started the route from the wrong square.' },
    ],
    hints: [
      'Run it once and notice the exact step where Byte stops.',
      'Byte must move Up before crossing the blocked square.',
      'Try Right, Up, Right, Right.',
    ],
  },
  {
    id: 'many-ways',
    number: 5,
    title: 'Many Ways',
    eyebrow: 'Your solution',
    objective: 'Reach the portal. There is more than one correct route.',
    shortObjective: 'Find any safe route.',
    celebration: 'Your solution is different and still correct.',
    mode: 'construct',
    theme: 'maze',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 4 },
        goal: { x: 4, y: 0 },
        walls: [
          { x: 1, y: 3 },
          { x: 2, y: 2 },
          { x: 3, y: 1 },
        ],
        gems: [],
      },
      allowedCommands: [...allDirections],
      maxCommands: 10,
    },
    skills: ['sequence', 'creative_application'],
    optimalProgramLength: 8,
    evidence: [
      { skillId: 'sequence', dimension: 'apply', context: 'grid-multiple-solutions' },
      { skillId: 'creative_application', dimension: 'apply', context: 'grid-multiple-solutions' },
    ],
    hints: [
      'Look for a clear path around the outside edge.',
      'You can travel along the bottom and then up the right side.',
      'Four Right tiles and four Up tiles will work.',
    ],
  },
  {
    id: 'shortest-route',
    number: 6,
    title: 'Shortest Route',
    eyebrow: 'Remove waste',
    objective: 'Reach the portal using no more than six instructions.',
    shortObjective: 'Use 6 steps or fewer.',
    celebration: 'You removed extra movement without changing the result.',
    mode: 'construct',
    theme: 'treasure',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 2 },
        goal: { x: 4, y: 2 },
        walls: [{ x: 1, y: 2 }],
        gems: [],
      },
      allowedCommands: [...allDirections],
      maxCommands: 6,
    },
    skills: ['efficiency', 'sequence'],
    optimalProgramLength: 6,
    evidence: [
      { skillId: 'efficiency', dimension: 'apply', context: 'grid-command-limit' },
      { skillId: 'sequence', dimension: 'apply', context: 'grid-command-limit' },
      // Meeting a command limit can be trial and error. Explaining why the
      // limit cannot be beaten is the part that shows the child understands
      // what a wasted step is.
      { skillId: 'efficiency', dimension: 'explain', context: 'grid-command-limit' },
    ],
    explanationPrompt: 'Why can Byte not do this in fewer than six instructions?',
    explanationOptions: [
      {
        id: 'detour-costs',
        label: 'Going around the block costs two extra moves, and there is no way past it.',
        correct: true,
      },
      { id: 'six-squares', label: 'The portal is exactly six squares away in a straight line.' },
      { id: 'diagonal', label: 'Byte would need to move diagonally, which takes longer.' },
    ],
    hints: [
      'The direct line is blocked, so go around it once.',
      'Move one row away, cross, then return to the middle.',
      'Try Up, Right four times, then Down.',
    ],
  },
  {
    id: 'tell-byte',
    number: 7,
    title: 'Tell Byte',
    eyebrow: 'Explain your thinking',
    objective: 'Build the route, then explain why your instructions work.',
    shortObjective: 'Build it. Then explain it.',
    celebration: 'Explaining your idea made your thinking visible.',
    mode: 'explain',
    theme: 'maze',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 4 },
        goal: { x: 3, y: 1 },
        walls: [{ x: 1, y: 3 }],
        gems: [
          { x: 1, y: 4 },
          { x: 3, y: 2 },
        ],
      },
      allowedCommands: [...allDirections],
      maxCommands: 8,
    },
    skills: ['explanation', 'sequence'],
    optimalProgramLength: 6,
    evidence: [
      { skillId: 'explanation', dimension: 'explain', context: 'grid-route-explanation' },
      { skillId: 'sequence', dimension: 'apply', context: 'grid-route-explanation' },
    ],
    explanationPrompt: 'Why does your route work?',
    explanationOptions: [
      {
        id: 'ordered',
        label: 'The steps are in the same order Byte needs to move.',
        correct: true,
      },
      { id: 'lucky', label: 'Byte guesses where the portal is.' },
      { id: 'fast', label: 'Byte moves too fast to hit a block.' },
    ],
    hints: [
      'Build the route first. You will explain it after Run.',
      'Stay on the bottom until you are to the right of the block.',
      'Move Right three times, then Up three times.',
    ],
  },
  {
    id: 'secret-bug',
    number: 8,
    title: 'Secret Bug',
    eyebrow: 'Byte changed one tile',
    objective: 'Byte broke the route by changing one instruction. Find it and fix it.',
    shortObjective: 'Find the changed tile.',
    celebration: 'Bug Hunter unlocked: you checked the result, found the cause, and fixed it.',
    mode: 'debug',
    theme: 'factory',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 2 },
        goal: { x: 4, y: 0 },
        walls: [],
        gems: [],
      },
      allowedCommands: [...allDirections],
      initialProgram: ['right', 'right', 'up', 'down', 'right', 'right'],
      maxCommands: 6,
    },
    skills: ['debugging', 'prediction'],
    optimalProgramLength: 6,
    evidence: [
      { skillId: 'debugging', dimension: 'debug', context: 'grid-changed-instruction' },
      { skillId: 'prediction', dimension: 'recognise', context: 'grid-changed-instruction' },
      // The second context debugging.explain needs, and a genuinely different
      // question from Broken Bridge: there the obstacle is visible on the
      // board, here the fault is only visible in the program.
      { skillId: 'debugging', dimension: 'explain', context: 'grid-changed-instruction' },
    ],
    explanationPrompt: 'Why did Byte end up below the portal?',
    explanationOptions: [
      {
        id: 'undone-climb',
        label: 'One instruction sent Byte back down, undoing a climb it had already made.',
        correct: true,
      },
      { id: 'ran-out', label: 'Byte needed more than six instructions to reach the portal.' },
      { id: 'wall', label: 'Byte was stopped by a wall on the way up.' },
    ],
    hints: [
      'Run it slowly and watch where Byte changes direction.',
      'One arrow points Down when Byte needs to keep climbing.',
      'Change the fourth tile from Down to Up.',
    ],
  },
  {
    id: 'build-your-maze',
    number: 9,
    title: 'Build Your Maze',
    eyebrow: 'Creator mission',
    objective: 'Invent your own safe route. We will save the instructions as your first build.',
    shortObjective: 'Create and save your route.',
    celebration: 'Your first original build is saved on this device.',
    mode: 'create',
    theme: 'maze',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 4 },
        goal: { x: 4, y: 0 },
        walls: [
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 2, y: 3 },
        ],
        gems: [],
      },
      allowedCommands: [...allDirections],
    },
    skills: ['creative_application', 'sequence'],
    optimalProgramLength: 8,
    evidence: [
      { skillId: 'creative_application', dimension: 'apply', context: 'grid-open-route' },
      { skillId: 'sequence', dimension: 'apply', context: 'grid-open-route' },
    ],
    hints: [
      'Choose whether your route goes above or below the tall wall.',
      'The outside edges are both safe.',
      'Try four Up tiles and then four Right tiles.',
    ],
  },
  {
    id: 'long-way-round',
    number: 10,
    title: 'The Long Way Round',
    eyebrow: 'Two ways work. One is shorter.',
    objective:
      'Byte can go over the wall or under it. Both reach the portal. Only one fits in six instructions.',
    shortObjective: 'Find the shorter way round.',
    celebration: 'You picked the cheaper route and can say why it was cheaper.',
    mode: 'construct',
    theme: 'treasure',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 3 },
        goal: { x: 4, y: 3 },
        // A wall with a gap at each end. Over the top costs ten instructions,
        // under the bottom costs six, so the budget is the whole lesson: both
        // routes work, and the child has to notice that working is not enough.
        walls: [
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 2, y: 3 },
        ],
        gems: [],
      },
      allowedCommands: [...allDirections],
      maxCommands: 6,
    },
    skills: ['efficiency', 'sequence'],
    optimalProgramLength: 6,
    evidence: [
      { skillId: 'efficiency', dimension: 'apply', context: 'grid-detour-cost' },
      { skillId: 'sequence', dimension: 'apply', context: 'grid-detour-cost' },
      // Choosing the shorter route can be luck. Saying why it is shorter
      // cannot, which is the only reason this mission carries an explain step.
      { skillId: 'efficiency', dimension: 'explain', context: 'grid-detour-cost' },
    ],
    explanationPrompt: 'Why is going under the wall shorter than going over it?',
    explanationOptions: [
      {
        id: 'closer-gap',
        label: 'The gap under the wall is closer to Byte, so fewer steps are spent reaching it.',
        correct: true,
      },
      { id: 'downhill', label: 'Byte moves faster going downwards.' },
      { id: 'top-blocked', label: 'The gap at the top of the wall is too small for Byte to fit through.' },
    ],
    hints: [
      'Both ends of the wall are open. Count the steps to each one before you build.',
      'Byte starts near the bottom, so the bottom gap is only one step away.',
      'Try Down, Right, Right, Right, Up, Right.',
    ],
  },
  {
    id: 'out-of-order',
    number: 11,
    title: 'Out of Order',
    eyebrow: 'Right steps, wrong order',
    objective:
      'Every step for this pizza is already here. They are in the wrong order. Fix it.',
    shortObjective: 'Same five steps. Better order.',
    celebration: 'You fixed the order without changing a single step.',
    mode: 'debug',
    theme: 'kitchen',
    // The one mission in World 1 that is not a board. Its lesson - the right
    // instructions in an order that cannot work - needs no space to move
    // through, and stating it without a grid is the point: a child who has
    // memorised routes has nothing to fall back on here.
    task: {
      kind: 'order-steps',
      steps: [
        { id: 'roll-dough', label: 'Roll out the dough' },
        { id: 'add-sauce', label: 'Spread the sauce' },
        { id: 'add-cheese', label: 'Scatter the cheese' },
        { id: 'bake', label: 'Bake it in the oven' },
        { id: 'slice', label: 'Slice it up' },
      ],
      solution: ['roll-dough', 'add-sauce', 'add-cheese', 'bake', 'slice'],
      // Baking before the toppings go on. Nothing here is a wrong step.
      initialOrder: ['roll-dough', 'bake', 'add-sauce', 'add-cheese', 'slice'],
    },
    skills: ['sequence', 'debugging', 'explanation'],
    optimalProgramLength: 5,
    evidence: [
      { skillId: 'debugging', dimension: 'debug', context: 'kitchen-step-order' },
      // The fault is the ordering itself, so this is sequence debugging in the
      // purest form World 1 can offer: nothing else about the plan is wrong.
      { skillId: 'sequence', dimension: 'debug', context: 'kitchen-step-order' },
      // Tell Byte asks why a route the child built works. This asks the same of
      // a plan they repaired, in a world with no board at all.
      { skillId: 'explanation', dimension: 'explain', context: 'kitchen-step-order' },
    ],
    explanationPrompt: 'The steps never changed. Why does the new order work?',
    explanationOptions: [
      {
        id: 'toppings-first',
        label: 'The toppings have to be on before it bakes, or they never cook.',
        correct: true,
      },
      { id: 'more-steps', label: 'The new order gives you more steps to use.' },
      { id: 'no-difference', label: 'Order never matters as long as the steps are right.' },
    ],
    hints: [
      'Check it and watch which step it stops on.',
      'Something is going into the oven before it is ready.',
      'The baking step belongs just before slicing.',
    ],
  },
  {
    id: 'castle-boss',
    number: 12,
    title: 'Castle Boss',
    eyebrow: 'No tutorial',
    objective: 'Collect all three keys and open the castle portal. Byte is watching, but this plan is yours.',
    shortObjective: 'Collect 3 keys. Open the gate.',
    celebration: "You've been programming. You are a Command Master!",
    mode: 'boss',
    theme: 'castle',
    task: {
      kind: 'run-program',
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 4 },
        goal: { x: 4, y: 0 },
        walls: [
          { x: 1, y: 2 },
          { x: 2, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 3 },
        ],
        gems: [
          { x: 1, y: 4 },
          { x: 4, y: 2 },
          { x: 4, y: 1 },
        ],
      },
      allowedCommands: [...allDirections],
      maxCommands: 10,
    },
    skills: ['sequence', 'prediction', 'debugging', 'creative_application'],
    optimalProgramLength: 8,
    evidence: [
      { skillId: 'sequence', dimension: 'transfer', context: 'grid-integrated-boss' },
      { skillId: 'creative_application', dimension: 'transfer', context: 'grid-integrated-boss' },
    ],
    hints: [],
  },
];

export const worldOneSkillOutcomes: Record<SkillId, WorldSkillOutcome> = {
  sequence: {
    skillId: 'sequence',
    target: 'mastery',
    criteria: {
      minimumScore: 70,
      minimumDistinctMissions: 4,
      minimumIndependentMissions: 4,
      requiredMissionIds: ['castle-boss'],
    },
  },
  prediction: {
    skillId: 'prediction',
    target: 'mastery',
    criteria: {
      minimumScore: 54,
      minimumDistinctMissions: 3,
      minimumIndependentMissions: 3,
      requiredMissionIds: ['castle-boss'],
    },
  },
  debugging: {
    skillId: 'debugging',
    target: 'mastery',
    criteria: {
      minimumScore: 54,
      minimumDistinctMissions: 3,
      minimumIndependentMissions: 3,
      requiredMissionIds: ['castle-boss'],
    },
  },
  creative_application: {
    skillId: 'creative_application',
    target: 'mastery',
    criteria: {
      minimumScore: 54,
      minimumDistinctMissions: 3,
      minimumIndependentMissions: 3,
      requiredMissionIds: ['castle-boss'],
    },
  },
  efficiency: {
    skillId: 'efficiency',
    target: 'introduced',
  },
  explanation: {
    skillId: 'explanation',
    target: 'introduced',
  },
};

export const getMissionById = (id: string) =>
  worldOneMissions.find((mission) => mission.id === id);

/**
 * Castle Boss variants.
 *
 * One fixed, visible board is weak transfer evidence: a child who has seen it
 * once is recalling a route, not applying a skill. Three boards with different
 * route logic mean passing the boss says something about the skill rather than
 * about the board.
 *
 * The optimal lengths below are not authored by hand. Every variant is proved
 * solvable within its own command budget by a breadth-first search over
 * (position, gems-collected) in the test suite, and `optimalProgramLength` is
 * asserted to equal the true optimum. Two earlier hand-designed candidates were
 * impossible and a third needed twelve moves against a ten-move budget - which
 * is exactly what would have shipped without that check.
 *
 * The shipped board is kept first so existing progress stays valid.
 */
const shippedBoss = worldOneMissions[worldOneMissions.length - 1];
const shippedBossTask = shippedBoss.task as RunProgramTask;

export const castleBossVariants: MissionDefinition[] = [
  {
    ...shippedBoss,
    id: 'castle-boss',
    theme: 'castle',
    task: {
      ...shippedBossTask,
      maxCommands: 10,
    },
    variantId: 'ascent',
    // Straight run then a straight climb: two turns.
    optimalProgramLength: 8,
    evidence: [
      { skillId: 'sequence', dimension: 'transfer', context: 'grid-boss-ascent' },
      { skillId: 'creative_application', dimension: 'transfer', context: 'grid-boss-ascent' },
      // The boss carries no hints, so the child must trace before running and
      // repair when it stalls. The skills array already claimed both.
      { skillId: 'sequence', dimension: 'predict', context: 'grid-boss-ascent' },
      { skillId: 'prediction', dimension: 'predict', context: 'grid-boss-ascent' },
      { skillId: 'debugging', dimension: 'debug', context: 'grid-boss-ascent' },
    ],
  },
  {
    ...shippedBoss,
    id: 'castle-boss',
    theme: 'castle',
    task: {
      ...shippedBossTask,
      board: {
        columns: 5,
        rows: 5,
        start: { x: 4, y: 4 },
        goal: { x: 0, y: 0 },
        walls: [
          { x: 3, y: 2 },
          { x: 2, y: 2 },
          { x: 2, y: 1 },
          { x: 1, y: 1 },
        ],
        gems: [
          { x: 3, y: 4 },
          { x: 0, y: 2 },
          { x: 0, y: 1 },
        ],
      },
      maxCommands: 10,
    },
    variantId: 'vault',
    title: 'Castle Boss — The Vault',
    objective:
      'Byte starts at the far tower. Collect all three keys and reach the vault door in the corner.',
    shortObjective: 'Collect 3 keys. Reach the vault.',
    // A staircase: the wall spine forces alternating moves, five turns.
    optimalProgramLength: 8,
    evidence: [
      { skillId: 'sequence', dimension: 'transfer', context: 'grid-boss-vault' },
      { skillId: 'creative_application', dimension: 'transfer', context: 'grid-boss-vault' },
      // The boss carries no hints, so the child must trace before running and
      // repair when it stalls. The skills array already claimed both.
      { skillId: 'sequence', dimension: 'predict', context: 'grid-boss-vault' },
      { skillId: 'prediction', dimension: 'predict', context: 'grid-boss-vault' },
      { skillId: 'debugging', dimension: 'debug', context: 'grid-boss-vault' },
    ],
  },
  {
    ...shippedBoss,
    id: 'castle-boss',
    theme: 'castle',
    task: {
      ...shippedBossTask,
      board: {
        columns: 5,
        rows: 5,
        start: { x: 0, y: 3 },
        goal: { x: 4, y: 0 },
        walls: [
          { x: 1, y: 2 },
          { x: 4, y: 4 },
        ],
        gems: [
          { x: 3, y: 3 },
          { x: 4, y: 2 },
          { x: 2, y: 2 },
        ],
      },
      maxCommands: 11,
    },
    variantId: 'ramparts',
    title: 'Castle Boss — The Ramparts',
    objective:
      'The keys are spread along the ramparts. Collect all three, then reach the high gate.',
    shortObjective: 'Collect 3 keys. Reach the high gate.',
    // Requires stepping back down after climbing: six turns, no straight run.
    optimalProgramLength: 9,
    evidence: [
      { skillId: 'sequence', dimension: 'transfer', context: 'grid-boss-ramparts' },
      { skillId: 'creative_application', dimension: 'transfer', context: 'grid-boss-ramparts' },
      // The boss carries no hints, so the child must trace before running and
      // repair when it stalls. The skills array already claimed both.
      { skillId: 'sequence', dimension: 'predict', context: 'grid-boss-ramparts' },
      { skillId: 'prediction', dimension: 'predict', context: 'grid-boss-ramparts' },
      { skillId: 'debugging', dimension: 'debug', context: 'grid-boss-ramparts' },
    ],
  },
];

/**
 * Pick a boss variant for a learner, deterministically.
 *
 * Deterministic rather than random so a child who fails and retries meets the
 * same castle - retrying a board you have just failed is practice; being handed
 * a different one is a new problem. It also means a child cannot reroll until
 * an easier board appears.
 */
export const selectCastleBossVariant = (seed: string): MissionDefinition => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return castleBossVariants[hash % castleBossVariants.length];
};
