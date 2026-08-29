import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView as RNSafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  Direction,
  EvidenceDimension,
  EvidenceEvent,
  LearnerProfile,
  MissionDefinition,
} from '../../../../packages/lesson-schema/src';
import { createMissionEvidenceEvents } from '../../../../packages/mastery/src';
import { themeSkin } from '../../../../packages/content/src/themes';
import { worldOneMissions } from '../../../../packages/content/src/world-one';
import { reviewedHintAction } from '../../../../packages/tutor-contracts/src';
import { ActionButton } from '../components/Buttons';
import { ByteAvatar } from '../components/ByteAvatar';
import { rendererFor, type TaskAttempt } from '../tasks';
import { colours, radius, shadow, spacing } from '../theme';

export type CompletionEvidence = {
  hintsUsed: number;
  attempts: number;
  program: Direction[];
};

type Props = {
  mission: MissionDefinition;
  profile: LearnerProfile;
  onBack: () => void;
  onComplete: (evidence: CompletionEvidence) => void;
  onEvidence: (events: EvidenceEvent[]) => void;
  onContinue: () => void;
};

/**
 * The learning shell. It owns everything that is true of a mission whatever
 * game it is dressed as: attempts, hints, timing, evidence, the explanation
 * step, passing and continuing.
 *
 * It does not own the interaction. Which renderer draws the task is looked up
 * from the task kind, and this file never learns whether the child just
 * steered a robot or ordered a launch checklist. Keeping that ignorance is the
 * point - it is what makes two themes of one task comparable evidence rather
 * than two different claims.
 */
export function MissionScreen({
  mission,
  profile,
  onBack,
  onComplete,
  onEvidence,
  onContinue,
}: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 780;
  const skin = themeSkin(mission.theme);

  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [activeHint, setActiveHint] = useState<string>();
  const [awaitingExplanation, setAwaitingExplanation] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'try'; message: string }>();
  const [passed, setPassed] = useState(false);
  const [passedMissionId, setPassedMissionId] = useState<string>();
  const [lastProgram, setLastProgram] = useState<Direction[]>([]);
  const reported = useRef(false);
  const attemptStartedAt = useRef(Date.now());
  const eventSequence = useRef(0);
  const lastAttempt = useRef<TaskAttempt | undefined>(undefined);
  const lastTimeToSolutionMs = useRef(0);

  useEffect(() => {
    setAttempts(0);
    setBusy(false);
    setHintLevel(0);
    setActiveHint(undefined);
    setAwaitingExplanation(false);
    setFeedback(undefined);
    setPassed(false);
    setPassedMissionId(undefined);
    setLastProgram([]);
    reported.current = false;
    attemptStartedAt.current = Date.now();
    eventSequence.current = 0;
    lastAttempt.current = undefined;
    lastTimeToSolutionMs.current = 0;
  }, [mission]);

  useEffect(() => {
    if (!passed || passedMissionId !== mission.id || reported.current) return;
    reported.current = true;
    onComplete({
      hintsUsed: hintLevel,
      attempts: Math.max(1, attempts),
      program: lastProgram,
    });
  }, [attempts, hintLevel, lastProgram, mission.id, onComplete, passed, passedMissionId]);

  const objective = profile.ageMode === 'explorer' ? mission.shortObjective : mission.objective;

  const emitEvidence = (
    successByDimension: Partial<Record<EvidenceDimension, boolean>>,
    input: {
      attemptNumber: number;
      timeToSolutionMs: number;
      predictionCorrect?: boolean;
      explanationResult?: EvidenceEvent['explanationResult'];
      misconception?: EvidenceEvent['misconception'];
      programLength: number;
      debugActions: number;
    },
  ) => {
    const timestamp = new Date().toISOString();
    eventSequence.current += 1;
    const events = createMissionEvidenceEvents(mission, {
      eventIdPrefix: `${mission.id}:${timestamp}:${eventSequence.current}`,
      successByDimension,
      attemptNumber: input.attemptNumber,
      hintsUsed: hintLevel,
      timeToSolutionMs: input.timeToSolutionMs,
      predictionCorrect: input.predictionCorrect,
      programLength: input.programLength,
      debugActions: input.debugActions,
      explanationResult: input.explanationResult,
      misconception: input.misconception,
      timestamp,
    });
    if (events.length > 0) onEvidence(events);
  };

  const completeMission = () => {
    setPassedMissionId(mission.id);
    setPassed(true);
    setFeedback({ type: 'success', message: mission.celebration });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  /** Whatever the renderer was, the response to an attempt is the same. */
  const handleAttempt = (attempt: TaskAttempt) => {
    const attemptNumber = attempts + 1;
    setAttempts(attemptNumber);
    setBusy(false);
    lastAttempt.current = attempt;
    if (attempt.program) setLastProgram(attempt.program);

    const timeToSolutionMs = Date.now() - attemptStartedAt.current;
    lastTimeToSolutionMs.current = timeToSolutionMs;
    emitEvidence(attempt.successByDimension, {
      attemptNumber,
      timeToSolutionMs,
      predictionCorrect: attempt.predictionCorrect,
      misconception: attempt.misconception,
      programLength: attempt.programLength,
      debugActions: attempt.debugActions,
    });
    attemptStartedAt.current = Date.now();

    if (!attempt.passed) {
      setFeedback({
        type: 'try',
        message: attempt.failureMessage ?? 'Not quite yet. Try another order.',
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (mission.explanationOptions?.length) {
      setAwaitingExplanation(true);
      setFeedback({
        type: 'success',
        message:
          mission.mode === 'debug'
            ? 'You fixed it. One more step: say what was wrong.'
            : `Your ${skin.program} works. One more step: explain why.`,
      });
      return;
    }

    completeMission();
  };

  const answerExplanation = (optionId: string) => {
    const option = mission.explanationOptions?.find((item) => item.id === optionId);
    const correct = option?.correct === true;
    emitEvidence(
      { explain: correct },
      {
        attemptNumber: Math.max(1, attempts),
        timeToSolutionMs: lastTimeToSolutionMs.current,
        explanationResult: correct ? 'correct' : 'incorrect',
        programLength: lastAttempt.current?.programLength ?? 0,
        debugActions: lastAttempt.current?.debugActions ?? 0,
      },
    );
    attemptStartedAt.current = Date.now();
    if (correct) {
      setAwaitingExplanation(false);
      completeMission();
      return;
    }
    setFeedback({
      type: 'try',
      message: `That would not make the ${skin.program} reliable. Think about how each step depends on the one before.`,
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const showNextHint = () => {
    const action = reviewedHintAction(mission, hintLevel);
    if (!action || action.type !== 'give_hint') return;
    setHintLevel(action.level);
    setActiveHint(action.hint);
    void Haptics.selectionAsync();
  };

  const Renderer = rendererFor(mission.task?.kind ?? 'run-program');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>‹ Map</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>
              MISSION {mission.number} OF {worldOneMissions.length}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(mission.number / worldOneMissions.length) * 100}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{mission.mode === 'boss' ? 'BOSS' : 'W1'}</Text>
          </View>
        </View>

        <View style={styles.objectiveCard}>
          <ByteAvatar size={74} mood={passed ? 'celebrate' : activeHint ? 'thinking' : 'happy'} />
          <View style={styles.objectiveCopy}>
            <Text style={styles.eyebrow}>{skin.label.toUpperCase()} · {mission.eyebrow.toUpperCase()}</Text>
            <Text style={styles.title}>{mission.title}</Text>
            <Text style={styles.objective}>{objective}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => Speech.speak(objective, { rate: 0.88 })}
              style={styles.readButton}
            >
              <Text style={styles.readButtonText}>🔊 Read to me</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.taskSlot}>
          {Renderer ? (
            <Renderer
              mission={mission}
              skin={skin}
              ageMode={profile.ageMode}
              locked={passed}
              busy={busy}
              onAttemptStart={() => {
                setBusy(true);
                setFeedback(undefined);
                setAwaitingExplanation(false);
              }}
              onAttempt={handleAttempt}
              wide={wide}
              width={width}
            />
          ) : (
            <Text style={styles.objective}>This mission type is not playable yet.</Text>
          )}
        </View>

        <View style={styles.afterTask}>
          {mission.hints.length > 0 && !passed ? (
            <View style={styles.hintArea}>
              <Pressable
                accessibilityRole="button"
                disabled={hintLevel >= mission.hints.length}
                onPress={showNextHint}
                style={({ pressed }) => [styles.hintButton, pressed && styles.pressed]}
              >
                <Text style={styles.hintButtonText}>
                  {hintLevel === 0
                    ? '💡 I need a hint'
                    : hintLevel < mission.hints.length
                      ? '💡 Another hint'
                      : 'All hints shown'}
                </Text>
              </Pressable>
              {activeHint ? (
                <View style={styles.hintBubble}>
                  <Text style={styles.hintLevel}>BYTE HINT {hintLevel}</Text>
                  <Text style={styles.hintText}>{activeHint}</Text>
                </View>
              ) : null}
            </View>
          ) : mission.mode === 'boss' && !passed ? (
            <View style={styles.bossNotice}>
              <Text style={styles.bossNoticeText}>
                🏆 Boss missions start without hints. Test your own plan.
              </Text>
            </View>
          ) : null}

          {awaitingExplanation ? (
            <View style={styles.explanationCard}>
              <Text style={styles.controlTitle}>{mission.explanationPrompt}</Text>
              {mission.explanationOptions?.map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  onPress={() => answerExplanation(option.id)}
                  style={({ pressed }) => [styles.explanationOption, pressed && styles.pressed]}
                >
                  <Text style={styles.explanationText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {feedback ? (
            <View
              style={[
                styles.feedback,
                feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackTry,
              ]}
            >
              <Text style={styles.feedbackIcon}>{feedback.type === 'success' ? '★' : '↻'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedbackTitle}>
                  {feedback.type === 'success' ? 'Nice work' : 'Keep going'}
                </Text>
                <Text style={styles.feedbackMessage}>{feedback.message}</Text>
              </View>
            </View>
          ) : null}

          {passed ? (
            <ActionButton
              label={
                mission.number === worldOneMissions.length
                  ? 'See what you learned'
                  : 'Next mission'
              }
              onPress={onContinue}
              style={styles.continueButton}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: 56 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 58 },
  back: { width: 64, minHeight: 44, justifyContent: 'center' },
  backText: { color: colours.purpleDark, fontSize: 15, fontWeight: '900' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerEyebrow: { color: colours.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  progressTrack: { width: '72%', maxWidth: 360, height: 8, backgroundColor: colours.lilac, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colours.aqua },
  modeBadge: { width: 50, height: 36, borderRadius: 13, backgroundColor: colours.ink, alignItems: 'center', justifyContent: 'center' },
  modeBadgeText: { color: colours.lime, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  objectiveCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colours.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: '#ECE8F8', ...shadow, shadowOpacity: 0.08 },
  objectiveCopy: { flex: 1 },
  eyebrow: { color: colours.purpleDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colours.ink, fontSize: 25, fontWeight: '900', marginTop: 2 },
  objective: { color: colours.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  readButton: { alignSelf: 'flex-start', minHeight: 34, justifyContent: 'center', marginTop: 5 },
  readButtonText: { color: colours.purpleDark, fontSize: 12, fontWeight: '900' },
  taskSlot: { marginTop: 16 },
  afterTask: { gap: 14, marginTop: 16 },
  controlTitle: { color: colours.ink, fontSize: 16, fontWeight: '900' },
  hintArea: { gap: 8 },
  hintButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  hintButtonText: { color: colours.purpleDark, fontSize: 14, fontWeight: '900' },
  hintBubble: { backgroundColor: colours.lilac, borderRadius: radius.md, padding: 13, borderLeftWidth: 4, borderLeftColor: colours.purple },
  hintLevel: { color: colours.purpleDark, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  hintText: { color: colours.ink, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 3 },
  bossNotice: { backgroundColor: '#FFF7DC', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: '#F0D98E' },
  bossNoticeText: { color: '#6E5715', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  explanationCard: { gap: 8, backgroundColor: colours.sky, borderRadius: radius.md, padding: 12 },
  explanationOption: { minHeight: 48, borderRadius: radius.sm, backgroundColor: colours.surface, borderWidth: 1, borderColor: '#BCE9F3', justifyContent: 'center', paddingHorizontal: 12 },
  explanationText: { color: colours.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  feedback: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: radius.md, padding: 13, borderWidth: 1 },
  feedbackSuccess: { backgroundColor: '#EAFBF5', borderColor: '#B9E7D6' },
  feedbackTry: { backgroundColor: '#FFF3EE', borderColor: '#F5CABD' },
  feedbackIcon: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', backgroundColor: colours.surface, color: colours.purpleDark, fontWeight: '900', fontSize: 17 },
  feedbackTitle: { color: colours.ink, fontSize: 14, fontWeight: '900' },
  feedbackMessage: { color: colours.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  continueButton: { marginTop: 2, backgroundColor: colours.success, borderBottomColor: '#14634A' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
