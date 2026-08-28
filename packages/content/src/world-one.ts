import type {
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
    board: {
      columns: 5,
      rows: 5,
      start: { x: 0, y: 3 },
      goal: { x: 2, y: 2 },
      walls: [],
      gems: [],
    },
    skills: ['sequence'],
    allowedCommands: [...allDirections],
    maxCommands: 5,
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
    skills: ['sequence'],
    allowedCommands: [...allDirections],
    maxCommands: 8,
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
    board: {
      columns: 5,
      rows: 5,
      start: { x: 1, y: 3 },
      goal: { x: 3, y: 2 },
      walls: [],
      gems: [],
    },
    skills: ['prediction', 'sequence'],
    allowedCommands: [...allDirections],
    initialProgram: ['right', 'right', 'up'],
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
    board: {
      columns: 5,
      rows: 5,
      start: { x: 0, y: 3 },
      goal: { x: 3, y: 2 },
      walls: [{ x: 2, y: 3 }],
      gems: [],
    },
    skills: ['debugging', 'sequence'],
    allowedCommands: [...allDirections],
    initialProgram: ['right', 'right', 'up', 'right'],
    maxCommands: 6,
    optimalProgramLength: 4,
    evidence: [
      { skillId: 'debugging', dimension: 'debug', context: 'grid-obstacle-repair' },
      { skillId: 'sequence', dimension: 'apply', context: 'grid-obstacle-repair' },
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
    skills: ['sequence', 'creative_application'],
    allowedCommands: [...allDirections],
    maxCommands: 10,
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
    board: {
      columns: 5,
      rows: 5,
      start: { x: 0, y: 2 },
      goal: { x: 4, y: 2 },
      walls: [{ x: 1, y: 2 }],
      gems: [],
    },
    skills: ['efficiency', 'sequence'],
    allowedCommands: [...allDirections],
    maxCommands: 6,
    optimalProgramLength: 6,
    evidence: [
      { skillId: 'efficiency', dimension: 'apply', context: 'grid-command-limit' },
      { skillId: 'sequence', dimension: 'apply', context: 'grid-command-limit' },
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
    skills: ['explanation', 'sequence'],
    allowedCommands: [...allDirections],
    maxCommands: 8,
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
    board: {
      columns: 5,
      rows: 5,
      start: { x: 0, y: 2 },
      goal: { x: 4, y: 0 },
      walls: [],
      gems: [],
    },
    skills: ['debugging', 'prediction'],
    allowedCommands: [...allDirections],
    initialProgram: ['right', 'right', 'up', 'down', 'right', 'right'],
    maxCommands: 6,
    optimalProgramLength: 6,
    evidence: [
      { skillId: 'debugging', dimension: 'debug', context: 'grid-changed-instruction' },
      { skillId: 'prediction', dimension: 'recognise', context: 'grid-changed-instruction' },
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
    skills: ['creative_application', 'sequence'],
    allowedCommands: [...allDirections],
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
    id: 'castle-boss',
    number: 10,
    title: 'Castle Boss',
    eyebrow: 'No tutorial',
    objective: 'Collect all three keys and open the castle portal. Byte is watching, but this plan is yours.',
    shortObjective: 'Collect 3 keys. Open the gate.',
    celebration: "You've been programming. You are a Command Master!",
    mode: 'boss',
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
    skills: ['sequence', 'prediction', 'debugging', 'creative_application'],
    allowedCommands: [...allDirections],
    maxCommands: 10,
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
export const castleBossVariants: MissionDefinition[] = [
  {
    ...worldOneMissions[worldOneMissions.length - 1],
    id: 'castle-boss',
    variantId: 'ascent',
    // Straight run then a straight climb: two turns.
    optimalProgramLength: 8,
    maxCommands: 10,
    evidence: [
      { skillId: 'sequence', dimension: 'transfer', context: 'grid-boss-ascent' },
      { skillId: 'creative_application', dimension: 'transfer', context: 'grid-boss-ascent' },
    ],
  },
  {
    ...worldOneMissions[worldOneMissions.length - 1],
    id: 'castle-boss',
    variantId: 'vault',
    title: 'Castle Boss — The Vault',
    objective:
      'Byte starts at the far tower. Collect all three keys and reach the vault door in the corner.',
    shortObjective: 'Collect 3 keys. Reach the vault.',
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
    // A staircase: the wall spine forces alternating moves, five turns.
    optimalProgramLength: 8,
    maxCommands: 10,
    evidence: [
      { skillId: 'sequence', dimension: 'transfer', context: 'grid-boss-vault' },
      { skillId: 'creative_application', dimension: 'transfer', context: 'grid-boss-vault' },
    ],
  },
  {
    ...worldOneMissions[worldOneMissions.length - 1],
    id: 'castle-boss',
    variantId: 'ramparts',
    title: 'Castle Boss — The Ramparts',
    objective:
      'The keys are spread along the ramparts. Collect all three, then reach the high gate.',
    shortObjective: 'Collect 3 keys. Reach the high gate.',
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
    // Requires stepping back down after climbing: six turns, no straight run.
    optimalProgramLength: 9,
    maxCommands: 11,
    evidence: [
      { skillId: 'sequence', dimension: 'transfer', context: 'grid-boss-ramparts' },
      { skillId: 'creative_application', dimension: 'transfer', context: 'grid-boss-ramparts' },
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
