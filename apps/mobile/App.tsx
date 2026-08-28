import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type {
  EvidenceEvent,
  LearnerProfile,
  LearnerProgress,
} from '../../packages/lesson-schema/src';
import {
  selectCastleBossVariant,
  worldOneMissions,
} from '../../packages/content/src/world-one';
import {
  applyMissionEvidence,
  createInitialProgress,
  recordEvidenceEvents,
} from '../../packages/mastery/src';
import { ByteAvatar } from './src/components/ByteAvatar';
import { HomeScreen } from './src/screens/HomeScreen';
import { MissionScreen, type CompletionEvidence } from './src/screens/MissionScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ParentDashboardScreen } from './src/screens/ParentDashboardScreen';
import { ParentGateScreen } from './src/screens/ParentGateScreen';
import { WorldMapScreen } from './src/screens/WorldMapScreen';
import { loadStoredState, saveProfile, saveProgress } from './src/storage';
import { colours } from './src/theme';

type Screen = 'onboarding' | 'home' | 'world' | 'mission' | 'parentGate' | 'parent';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [profile, setProfile] = useState<LearnerProfile>();
  const [progress, setProgress] = useState<LearnerProgress>(createInitialProgress());
  const [missionId, setMissionId] = useState(worldOneMissions[0].id);
  const progressSaveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = 'only light';
      document.body.style.backgroundColor = colours.background;
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    progressSaveQueue.current = progressSaveQueue.current
      .catch(() => undefined)
      .then(() => saveProgress(progress))
      .catch(() => undefined);
  }, [loading, progress]);

  useEffect(() => {
    let active = true;
    void loadStoredState().then((stored) => {
      if (!active) return;
      setProfile(stored.profile);
      setProgress(stored.progress);
      setScreen(stored.profile ? 'home' : 'onboarding');
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // The boss ships as three boards under one mission id. Which castle a learner
  // meets is fixed by their nickname rather than drawn fresh each time: a child
  // who fails and retries should meet the same castle, because retrying a board
  // you have just failed is practice, while being handed a different one is a
  // new problem. It also means nobody can reroll until an easy board appears.
  //
  // The id never changes, so completion, mastery criteria and saved progress
  // are untouched by which board is served.
  const currentMission = useMemo(() => {
    const found =
      worldOneMissions.find((mission) => mission.id === missionId) ?? worldOneMissions[0];
    if (found.id !== 'castle-boss') return found;
    return selectCastleBossVariant(profile?.nickname ?? 'builder');
  }, [missionId, profile?.nickname]);

  const completeOnboarding = (nextProfile: LearnerProfile) => {
    setProfile(nextProfile);
    setScreen('home');
    void saveProfile(nextProfile);
  };

  const openMission = (nextMissionId: string) => {
    setMissionId(nextMissionId);
    setScreen('mission');
  };

  const completeMission = useCallback(
    (evidence: CompletionEvidence) => {
      setProgress((previous) => {
        let next = applyMissionEvidence(previous, currentMission, evidence);
        if (currentMission.mode === 'create') {
          const build = {
            id: `build-${currentMission.id}`,
            title: `${profile?.nickname ?? 'Builder'}'s Maze Route`,
            program: evidence.program,
            createdAt: new Date().toISOString(),
          };
          next = {
            ...next,
            savedBuilds: [
              ...next.savedBuilds.filter((item) => item.id !== build.id),
              build,
            ],
          };
        }
        return next;
      });
    },
    [currentMission, profile?.nickname],
  );

  const recordMissionEvidence = useCallback((events: EvidenceEvent[]) => {
    setProgress((previous) => {
      const next = recordEvidenceEvents(previous, events);
      return next;
    });
  }, []);

  const continueFromMission = () => {
    const index = worldOneMissions.findIndex((mission) => mission.id === currentMission.id);
    if (index >= 0 && index < worldOneMissions.length - 1) {
      setMissionId(worldOneMissions[index + 1].id);
      setScreen('mission');
      return;
    }
    setScreen('world');
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ByteAvatar size={96} mood="thinking" />
          <Text style={styles.loadingTitle}>LEVEL</Text>
          <Text style={styles.loadingBody}>Warming up Byte…</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === 'onboarding' || !profile ? (
        <OnboardingScreen onComplete={completeOnboarding} />
      ) : null}
      {screen === 'home' && profile ? (
        <HomeScreen
          profile={profile}
          progress={progress}
          onOpenWorld={() => setScreen('world')}
          onOpenParent={() => setScreen('parentGate')}
        />
      ) : null}
      {screen === 'world' && profile ? (
        <WorldMapScreen
          progress={progress}
          onBack={() => setScreen('home')}
          onOpenMission={openMission}
        />
      ) : null}
      {screen === 'mission' && profile ? (
        <MissionScreen
          mission={currentMission}
          profile={profile}
          onBack={() => setScreen('world')}
          onComplete={completeMission}
          onEvidence={recordMissionEvidence}
          onContinue={continueFromMission}
        />
      ) : null}
      {screen === 'parentGate' && profile ? (
        <ParentGateScreen
          onBack={() => setScreen('home')}
          onUnlock={() => setScreen('parent')}
        />
      ) : null}
      {screen === 'parent' && profile ? (
        <ParentDashboardScreen
          profile={profile}
          progress={progress}
          onBack={() => setScreen('home')}
        />
      ) : null}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.background,
  },
  loadingTitle: {
    color: colours.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 16,
  },
  loadingBody: {
    color: colours.muted,
    fontSize: 13,
    marginTop: 5,
  },
});
