import type { GameTheme } from '../../lesson-schema/src';

/**
 * What a theme is allowed to change.
 *
 * Nouns, colour and the shape of the avatar. Nothing here is ever read by the
 * mastery model - a ThemeSkin cannot alter what a mission claims about a
 * child, only what the child sees while proving it. That constraint is the
 * whole point of the split: if a theme could change the claim, two themes of
 * one task would stop being comparable evidence.
 */
export type ThemeSkin = {
  id: GameTheme;
  /** Shown on the mission header. */
  label: string;
  /** What the moving thing is called, when the task has one. */
  actor: string;
  /** What the destination is called. */
  goal: string;
  /** What collectables are called. */
  token: string;
  /** What one instruction is called, in this world's language. */
  instruction: string;
  /** What the assembled list of instructions is called. */
  program: string;
  /** Verb on the button that executes it. */
  runVerb: string;
  surface: string;
  ink: string;
  accent: string;
  /** How the actor is drawn by a spatial renderer. */
  actorShape: 'robot' | 'rocket' | 'cart' | 'arm' | 'note' | 'car';
};

export const themeSkins: Record<GameTheme, ThemeSkin> = {
  maze: {
    id: 'maze',
    label: 'Portal Maze',
    actor: 'Byte',
    goal: 'portal',
    token: 'gem',
    instruction: 'arrow',
    program: 'route',
    runVerb: 'Run',
    surface: '#EAF4FF',
    ink: '#16233B',
    accent: '#6C4CF1',
    actorShape: 'robot',
  },
  treasure: {
    id: 'treasure',
    label: 'Treasure Run',
    actor: 'Byte',
    goal: 'chest',
    token: 'coin',
    instruction: 'arrow',
    program: 'route',
    runVerb: 'Go',
    surface: '#FFF6E4',
    ink: '#3B2A12',
    accent: '#D98324',
    actorShape: 'cart',
  },
  rocket: {
    id: 'rocket',
    label: 'Launch Control',
    actor: 'the rocket',
    goal: 'launch',
    token: 'check',
    instruction: 'step',
    program: 'checklist',
    runVerb: 'Launch',
    surface: '#EDEBFF',
    ink: '#171436',
    accent: '#4C5BF1',
    actorShape: 'rocket',
  },
  factory: {
    id: 'factory',
    label: 'Robot Factory',
    actor: 'the arm',
    goal: 'finished part',
    token: 'bolt',
    instruction: 'command',
    program: 'assembly plan',
    runVerb: 'Start line',
    surface: '#ECF3F0',
    ink: '#12271F',
    accent: '#1E8F6A',
    actorShape: 'arm',
  },
  kitchen: {
    id: 'kitchen',
    label: 'Order Up',
    actor: 'the order',
    goal: 'served plate',
    token: 'topping',
    instruction: 'step',
    program: 'recipe',
    runVerb: 'Cook it',
    surface: '#FFEFEF',
    ink: '#37161A',
    accent: '#D6455D',
    actorShape: 'cart',
  },
  music: {
    id: 'music',
    label: 'Drum Pattern',
    actor: 'the beat',
    goal: 'full bar',
    token: 'note',
    instruction: 'beat',
    program: 'pattern',
    runVerb: 'Play',
    surface: '#F1ECFF',
    ink: '#221A3D',
    accent: '#7B4CE0',
    actorShape: 'note',
  },
  traffic: {
    id: 'traffic',
    label: 'Traffic Lights',
    actor: 'the car',
    goal: 'crossing',
    token: 'light',
    instruction: 'rule',
    program: 'signal plan',
    runVerb: 'Run lights',
    surface: '#EFF3E9',
    ink: '#1E2712',
    accent: '#5E8C25',
    actorShape: 'car',
  },
  castle: {
    id: 'castle',
    label: 'Castle Escape',
    actor: 'Byte',
    goal: 'gate',
    token: 'key',
    instruction: 'arrow',
    program: 'plan',
    runVerb: 'Go',
    surface: '#F0EAF7',
    ink: '#241634',
    accent: '#8B3FBF',
    actorShape: 'robot',
  },
  workshop: {
    id: 'workshop',
    label: 'Workshop',
    actor: 'the machine',
    goal: 'working machine',
    token: 'part',
    instruction: 'step',
    program: 'build plan',
    runVerb: 'Test it',
    surface: '#EFF1F5',
    ink: '#1B1F2A',
    accent: '#3C5A99',
    actorShape: 'arm',
  },
};

export const themeSkin = (theme: GameTheme): ThemeSkin => themeSkins[theme];
