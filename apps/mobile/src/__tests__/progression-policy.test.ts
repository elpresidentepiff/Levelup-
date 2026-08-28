import { describe, expect, it } from 'vitest';

import {
  castleBossVariants,
  worldOneMissions,
  worldOneSkillOutcomes,
} from '../../../../packages/content/src/world-one';
import {
  applyMissionEvidence,
  createInitialProgress,
  missionProgressionForWorld,
  worldCapabilityReadiness,
} from '../../../../packages/mastery/src';

describe('progression policy', () => {
  it('keeps content moving while distinguishing supported from independent work', () => {
    const initial = createInitialProgress();
    const initialAccess = missionProgressionForWorld(initial, worldOneMissions);

    expect(initialAccess[0]).toMatchObject({ access: 'ready', playable: true });
    expect(initialAccess[1]).toMatchObject({ access: 'locked', playable: false });

    const supported = applyMissionEvidence(initial, worldOneMissions[0], {
      hintsUsed: 2,
      attempts: 3,
    });
    expect(missionProgressionForWorld(supported, worldOneMissions)[1]).toMatchObject({
      access: 'practice_recommended',
      playable: true,
      reason: 'previous_mission_completed_with_support',
    });

    const independent = applyMissionEvidence(initial, worldOneMissions[0], {
      hintsUsed: 0,
      attempts: 2,
    });
    expect(missionProgressionForWorld(independent, worldOneMissions)[1]).toMatchObject({
      access: 'ready',
      playable: true,
      reason: 'previous_mission_completed_independently',
    });
  });

  it('does not confuse board variants with separate progression steps', () => {
    const progression = missionProgressionForWorld(
      createInitialProgress(),
      [...worldOneMissions.slice(0, -1), ...castleBossVariants],
    );

    expect(progression).toHaveLength(worldOneMissions.length);
    expect(progression.filter((item) => item.missionId === 'castle-boss')).toHaveLength(1);
  });

  it('keeps capability readiness separate from mission completion', () => {
    let supported = createInitialProgress();
    for (const mission of worldOneMissions) {
      supported = applyMissionEvidence(supported, mission, {
        hintsUsed: 2,
        attempts: 3,
      });
    }

    expect(worldCapabilityReadiness(
      supported,
      worldOneMissions,
      worldOneSkillOutcomes,
    )).toMatchObject({
      status: 'practice_needed',
      contentComplete: true,
    });

    let independent = createInitialProgress();
    for (const mission of worldOneMissions) {
      independent = applyMissionEvidence(independent, mission, {
        hintsUsed: 0,
        attempts: 1,
      });
    }

    expect(worldCapabilityReadiness(
      independent,
      worldOneMissions,
      worldOneSkillOutcomes,
    )).toEqual({
      status: 'ready',
      contentComplete: true,
      unmetMasteryTargets: [],
    });
  });
});
