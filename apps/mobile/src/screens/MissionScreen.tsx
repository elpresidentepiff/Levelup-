import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
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
  Point,
} from '../../../../packages/lesson-schema/src';
import {
  classifyMisconception,
  evaluateMission,
  samePoint,
} from '../../../../packages/learning-engine/src';
import { createMissionEvidenceEvents } from '../../../../packages/mastery/src';
import { worldOneMissions } from '../../../../packages/content/src/world-one';
import { reviewedHintAction } from '../../../../packages/tutor-contracts/src';
import { ActionButton } from '../components/Buttons';
import { ByteAvatar } from '../components/ByteAvatar';
import { CommandComposer } from '../components/CommandComposer';
import { MissionCanvas } from '../components/MissionCanvas';
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

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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
  const canvasSize = wide
    ? Math.min(420, width * 0.46)
    : Math.min(420, width - spacing.md * 2);
  const [program, setProgram] = useState<Direction[]>(mission.initialProgram ?? []);
  const [position, setPosition] = useState<Point>(mission.board.start);
  const [trail, setTrail] = useState<Point[]>([mission.board.start]);
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [activeHint, setActiveHint] = useState<string>();
  const [predictionId, setPredictionId] = useState<string>();
  const [awaitingExplanation, setAwaitingExplanation] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'try'; message: string }>();
  const [passed, setPassed] = useState(false);
  const [passedMissionId, setPassedMissionId] = useState<string>();
  const [debugActions, setDebugActions] = useState(0);
  const reported = useRef(false);
  const attemptStartedAt = useRef(Date.now());
  const eventSequence = useRef(0);
  const lastRunDebugActions = useRef(0);
  const lastRunTimeToSolutionMs = useRef(0);

  useEffect(() => {
    setProgram(mission.initialProgram ?? []);
    setPosition(mission.board.start);
    setTrail([mission.board.start]);
    setRunning(false);
    setAttempts(0);
    setHintLevel(0);
    setActiveHint(undefined);
    setPredictionId(undefined);
    setAwaitingExplanation(false);
    setFeedback(undefined);
    setPassed(false);
    setPassedMissionId(undefined);
    setDebugActions(0);
    reported.current = false;
    attemptStartedAt.current = Date.now();
    eventSequence.current = 0;
    lastRunDebugActions.current = 0;
    lastRunTimeToSolutionMs.current = 0;
  }, [mission]);

  useEffect(() => {
    if (!passed || passedMissionId !== mission.id || reported.current) return;
    reported.current = true;
    onComplete({
      hintsUsed: hintLevel,
      attempts: Math.max(1, attempts),
      program,
    });
  }, [attempts, hintLevel, mission.id, onComplete, passed, passedMissionId, program]);

  const objective = profile.ageMode === 'explorer' ? mission.shortObjective : mission.objective;
  const lockedProgram = mission.mode === 'predict';
  const canRun =
    !running &&
    program.length > 0 &&
    (!lockedProgram || predictionId !== undefined) &&
    !passed;

  const resetBoard = () => {
    setPosition(mission.board.start);
    setTrail([mission.board.start]);
    setFeedback(undefined);
    setAwaitingExplanation(false);
  };

  const clearProgram = () => {
    if (lockedProgram) return;
    resetBoard();
    setProgram([]);
    setDebugActions((current) => current + 1);
  };

  const emitEvidence = (
    successByDimension: Partial<Record<EvidenceDimension, boolean>>,
    input: {
      attemptNumber: number;
      timeToSolutionMs: number;
      predictionCorrect?: boolean;
      explanationResult?: EvidenceEvent['explanationResult'];
      misconception?: EvidenceEvent['misconception'];
      debugActionCount?: number;
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
      predictionBeforeRun: predictionId,
      predictionCorrect: input.predictionCorrect,
      programLength: program.length,
      debugActions: input.debugActionCount ?? debugActions,
      explanationResult: input.explanationResult,
      misconception: input.misconception,
      timestamp,
    });
    if (events.length > 0) onEvidence(events);
  };

  const run = async () => {
    if (!canRun) return;
    const attemptNumber = attempts + 1;
    setAttempts(attemptNumber);
    setRunning(true);
    setFeedback(undefined);
    setAwaitingExplanation(false);
    setPosition(mission.board.start);
    setTrail([mission.board.start]);

    const evaluation = evaluateMission(mission, program);
    const chosenPrediction = mission.predictionOptions?.find(
      (option) => option.id === predictionId,
    );
    const predictionCorrect = mission.mode === 'predict'
      ? Boolean(
          chosenPrediction &&
          samePoint(chosenPrediction.point, evaluation.execution.finalPosition),
        )
      : undefined;
    const missionPassed = evaluation.passed && predictionCorrect !== false;
    const misconception = classifyMisconception(mission, evaluation, {
      predictionCorrect,
      attemptNumber,
    });
    const successByDimension: Partial<Record<EvidenceDimension, boolean>> = {};
    for (const definition of mission.evidence) {
      if (definition.dimension === 'explain') continue;
      successByDimension[definition.dimension] =
        definition.dimension === 'predict'
          ? predictionCorrect ?? evaluation.passed
          : evaluation.passed;
    }
    const timeToSolutionMs = Date.now() - attemptStartedAt.current;
    lastRunTimeToSolutionMs.current = timeToSolutionMs;
    lastRunDebugActions.current = debugActions;
    emitEvidence(successByDimension, {
      attemptNumber,
      timeToSolutionMs,
      predictionCorrect,
      misconception,
    });
    attemptStartedAt.current = Date.now();
    setDebugActions(0);
    const animatedTrail: Point[] = [mission.board.start];
    for (const nextPosition of evaluation.execution.trail.slice(1)) {
      await delay(profile.ageMode === 'explorer' ? 380 : 270);
      animatedTrail.push(nextPosition);
      setPosition(nextPosition);
      setTrail([...animatedTrail]);
      void Haptics.selectionAsync();
    }

    setRunning(false);
    if (mission.mode === 'predict') {
      if (!predictionCorrect) {
        setFeedback({
          type: 'try',
          message: 'Good test. Trace one arrow at a time and notice where Byte actually stopped.',
        });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
    }

    if (!evaluation.checks.withinCommandLimit) {
      setFeedback({
        type: 'try',
        message: `Your route works, but it uses ${program.length} steps. Can you keep the result and remove the extra movement?`,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!missionPassed) {
      setFeedback({ type: 'try', message: evaluation.execution.reason });
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
            : 'Your route works. One more step: explain why.',
      });
      return;
    }

    completeMission();
  };

  const completeMission = () => {
    setPassedMissionId(mission.id);
    setPassed(true);
    setFeedback({ type: 'success', message: mission.celebration });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const answerExplanation = (optionId: string) => {
    const option = mission.explanationOptions?.find((item) => item.id === optionId);
    const correct = option?.correct === true;
    emitEvidence(
      { explain: correct },
      {
        attemptNumber: Math.max(1, attempts),
        timeToSolutionMs: lastRunTimeToSolutionMs.current,
        explanationResult: correct ? 'correct' : 'incorrect',
        debugActionCount: lastRunDebugActions.current,
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
      message: 'That would not make the route reliable. Think about how Byte follows each tile.',
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
            <Text style={styles.eyebrow}>{mission.eyebrow.toUpperCase()}</Text>
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

        <View style={[styles.workArea, wide && styles.workAreaWide]}>
          <View style={styles.canvasColumn}>
            <MissionCanvas
              board={mission.board}
              position={position}
              trail={trail}
              predictionOptions={mission.predictionOptions}
              size={canvasSize}
            />
            <View style={styles.legend}>
              <Text style={styles.legendText}>🤖 Byte</Text>
              <Text style={styles.legendText}>● Portal</Text>
              {mission.board.gems.length > 0 ? <Text style={styles.legendText}>🟡 Energy</Text> : null}
            </View>
          </View>

          <View style={[styles.controlsCard, wide && styles.controlsWide]}>
            {mission.mode === 'predict' ? (
              <View style={styles.predictionBlock}>
                <Text style={styles.controlTitle}>Choose before Run</Text>
                <View style={styles.optionRow}>
                  {mission.predictionOptions?.map((option) => {
                    const selected = predictionId === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => setPredictionId(option.id)}
                        style={({ pressed }) => [
                          styles.predictionOption,
                          selected && styles.predictionSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.predictionText, selected && styles.predictionTextSelected]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <CommandComposer
              program={program}
              allowedCommands={mission.allowedCommands}
              locked={lockedProgram || running || passed}
              maxCommands={mission.maxCommands}
              onChange={(nextProgram) => {
                resetBoard();
                setProgram(nextProgram);
                setDebugActions((current) => current + 1);
              }}
            />

            <View style={styles.actionRow}>
              <ActionButton
                label={running ? 'Running…' : 'Run'}
                onPress={() => void run()}
                disabled={!canRun}
                style={styles.runButton}
              />
              {!lockedProgram && !passed ? (
                <ActionButton label="Clear" onPress={clearProgram} variant="secondary" style={styles.clearButton} />
              ) : (
                <ActionButton label="Reset" onPress={resetBoard} variant="secondary" style={styles.clearButton} />
              )}
            </View>

            {mission.hints.length > 0 && !passed ? (
              <View style={styles.hintArea}>
                <Pressable
                  accessibilityRole="button"
                  disabled={hintLevel >= mission.hints.length}
                  onPress={showNextHint}
                  style={({ pressed }) => [styles.hintButton, pressed && styles.pressed]}
                >
                  <Text style={styles.hintButtonText}>
                    {hintLevel === 0 ? '💡 I need a hint' : hintLevel < mission.hints.length ? '💡 Another hint' : 'All hints shown'}
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
                <Text style={styles.bossNoticeText}>🏆 Boss missions start without hints. Test your own plan.</Text>
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
              <View style={[styles.feedback, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackTry]}>
                <Text style={styles.feedbackIcon}>{feedback.type === 'success' ? '✓' : '↻'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedbackTitle}>{feedback.type === 'success' ? 'It works!' : 'Try one change'}</Text>
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
  workArea: { gap: 16, marginTop: 16 },
  workAreaWide: { flexDirection: 'row', alignItems: 'flex-start' },
  canvasColumn: { alignItems: 'center' },
  legend: { flexDirection: 'row', gap: 14, marginTop: 9 },
  legendText: { color: colours.muted, fontSize: 11, fontWeight: '700' },
  controlsCard: { backgroundColor: colours.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: '#ECE8F8', gap: 14, ...shadow, shadowOpacity: 0.08 },
  controlsWide: { flex: 1, minWidth: 340 },
  predictionBlock: { gap: 8 },
  controlTitle: { color: colours.ink, fontSize: 16, fontWeight: '900' },
  optionRow: { flexDirection: 'row', gap: 8 },
  predictionOption: { flex: 1, minHeight: 46, borderRadius: radius.sm, borderWidth: 2, borderColor: colours.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF9FF' },
  predictionSelected: { backgroundColor: colours.purple, borderColor: colours.purpleDark },
  predictionText: { color: colours.ink, fontSize: 12, fontWeight: '900' },
  predictionTextSelected: { color: colours.surface },
  actionRow: { flexDirection: 'row', gap: 9 },
  runButton: { flex: 1 },
  clearButton: { minWidth: 100 },
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
