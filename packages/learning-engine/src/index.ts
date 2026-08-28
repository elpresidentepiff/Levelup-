import type {
  BoardDefinition,
  Direction,
  MisconceptionCode,
  MissionDefinition,
  Point,
} from '../../lesson-schema/src';

export type ExecutionEvent = {
  type: 'move' | 'collision' | 'collect';
  from: Point;
  to: Point;
  commandIndex: number;
  gemKey?: string;
};

export type ExecutionResult = {
  status: 'success' | 'collision' | 'incomplete';
  finalPosition: Point;
  trail: Point[];
  events: ExecutionEvent[];
  collectedGemKeys: string[];
  reason: string;
};

export type MissionEvaluation = {
  passed: boolean;
  execution: ExecutionResult;
  checks: {
    reachedGoal: boolean;
    collectedEverything: boolean;
    withinCommandLimit: boolean;
  };
};

export const pointKey = (point: Point) => `${point.x}:${point.y}`;

export const samePoint = (left: Point, right: Point) =>
  left.x === right.x && left.y === right.y;

export const movePoint = (point: Point, direction: Direction): Point => {
  switch (direction) {
    case 'up':
      return { x: point.x, y: point.y - 1 };
    case 'right':
      return { x: point.x + 1, y: point.y };
    case 'down':
      return { x: point.x, y: point.y + 1 };
    case 'left':
      return { x: point.x - 1, y: point.y };
  }
};

const isInsideBoard = (board: BoardDefinition, point: Point) =>
  point.x >= 0 &&
  point.y >= 0 &&
  point.x < board.columns &&
  point.y < board.rows;

export const runProgram = (
  board: BoardDefinition,
  program: Direction[],
): ExecutionResult => {
  let position = { ...board.start };
  const trail: Point[] = [{ ...position }];
  const events: ExecutionEvent[] = [];
  const collected = new Set<string>();
  const wallKeys = new Set(board.walls.map(pointKey));
  const gemKeys = new Set(board.gems.map(pointKey));

  if (gemKeys.has(pointKey(position))) {
    collected.add(pointKey(position));
  }

  for (const [commandIndex, command] of program.entries()) {
    const next = movePoint(position, command);
    if (!isInsideBoard(board, next) || wallKeys.has(pointKey(next))) {
      events.push({
        type: 'collision',
        from: { ...position },
        to: { ...next },
        commandIndex,
      });
      return {
        status: 'collision',
        finalPosition: { ...position },
        trail,
        events,
        collectedGemKeys: [...collected],
        reason: 'Byte bumped into something. The route needs one change.',
      };
    }

    const from = { ...position };
    position = next;
    trail.push({ ...position });
    events.push({ type: 'move', from, to: { ...position }, commandIndex });

    const gemKey = pointKey(position);
    if (gemKeys.has(gemKey) && !collected.has(gemKey)) {
      collected.add(gemKey);
      events.push({
        type: 'collect',
        from: { ...position },
        to: { ...position },
        commandIndex,
        gemKey,
      });
    }
  }

  const reachedGoal = samePoint(position, board.goal);
  const collectedEverything = collected.size === board.gems.length;
  const status = reachedGoal && collectedEverything ? 'success' : 'incomplete';

  return {
    status,
    finalPosition: { ...position },
    trail,
    events,
    collectedGemKeys: [...collected],
    reason:
      status === 'success'
        ? 'Every instruction ran in order and Byte reached the goal.'
        : !reachedGoal
          ? 'The instructions worked, but Byte stopped before the goal.'
          : 'Byte reached the goal, but there is still something to collect.',
  };
};

export const evaluateMission = (
  mission: MissionDefinition,
  program: Direction[],
): MissionEvaluation => {
  const execution = runProgram(mission.board, program);
  const reachedGoal = samePoint(execution.finalPosition, mission.board.goal);
  const collectedEverything =
    execution.collectedGemKeys.length === mission.board.gems.length;
  const withinCommandLimit =
    mission.maxCommands === undefined || program.length <= mission.maxCommands;

  return {
    passed:
      execution.status === 'success' &&
      reachedGoal &&
      collectedEverything &&
      withinCommandLimit,
    execution,
    checks: { reachedGoal, collectedEverything, withinCommandLimit },
  };
};

export const classifyMisconception = (
  mission: MissionDefinition,
  evaluation: MissionEvaluation,
  context: { predictionCorrect?: boolean; attemptNumber: number },
): MisconceptionCode | undefined => {
  if (context.predictionCorrect === false) return 'prediction_mismatch';
  if (evaluation.execution.status === 'collision') {
    return 'collision_not_anticipated';
  }
  if (!evaluation.checks.withinCommandLimit) return 'unnecessary_commands';
  if (
    evaluation.checks.reachedGoal &&
    !evaluation.checks.collectedEverything
  ) {
    return 'goal_only_ignores_collectibles';
  }
  if (evaluation.passed) return undefined;
  if (mission.mode === 'debug') return 'bug_not_resolved';

  const distanceFromGoal =
    Math.abs(evaluation.execution.finalPosition.x - mission.board.goal.x) +
    Math.abs(evaluation.execution.finalPosition.y - mission.board.goal.y);
  if (distanceFromGoal === 1) return 'stops_one_step_short';
  if (context.attemptNumber >= 3) return 'random_trial_and_error';
  return 'goal_not_reached';
};

export const directionLabel: Record<Direction, string> = {
  up: 'Up',
  right: 'Right',
  down: 'Down',
  left: 'Left',
};

export const directionArrow: Record<Direction, string> = {
  up: '↑',
  right: '→',
  down: '↓',
  left: '←',
};
