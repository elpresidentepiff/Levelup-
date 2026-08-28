import type { MissionDefinition } from '../../lesson-schema/src';

export type TutorAction =
  | { type: 'give_hint'; hint: string; level: number }
  | { type: 'ask_prediction'; prompt: string }
  | { type: 'explain_result'; message: string }
  | { type: 'suggest_next_step'; message: string };

export const reviewedHintAction = (
  mission: MissionDefinition,
  currentLevel: number,
): TutorAction | undefined => {
  const hint = mission.hints[currentLevel];
  if (!hint) return undefined;
  return { type: 'give_hint', hint, level: currentLevel + 1 };
};

export const tutorBoundary = {
  openChat: false,
  externalLinks: false,
  canExecuteCode: false,
  storesRawConversation: false,
  permittedActions: [
    'give_hint',
    'ask_prediction',
    'explain_result',
    'suggest_next_step',
  ] as const,
};

