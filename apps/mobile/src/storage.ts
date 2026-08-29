import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  LearnerProfile,
  LearnerProgress,
} from '../../../packages/lesson-schema/src';
import {
  createInitialProgress,
  hydrateProgress,
} from '../../../packages/mastery/src';

const PROFILE_KEY = '@level/profile/v2';
const PROGRESS_KEY = '@level/progress/v2';

export type StoredState = {
  profile?: LearnerProfile;
  progress: LearnerProgress;
};

export const loadStoredState = async (): Promise<StoredState> => {
  try {
    const [profileJson, progressJson] = await Promise.all([
      AsyncStorage.getItem(PROFILE_KEY),
      AsyncStorage.getItem(PROGRESS_KEY),
    ]);
    return {
      profile: profileJson ? JSON.parse(profileJson) : undefined,
      progress: progressJson
        ? hydrateProgress(JSON.parse(progressJson))
        : createInitialProgress(),
    };
  } catch {
    return { progress: createInitialProgress() };
  }
};

export const saveProfile = (profile: LearnerProfile) =>
  AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

export const saveProgress = (progress: LearnerProgress) =>
  AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
