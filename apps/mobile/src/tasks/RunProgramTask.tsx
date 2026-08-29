import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  Direction,
  EvidenceDimension,
  Point,
  RunProgramTask as RunProgramTaskDefinition,
} from '../../../../packages/lesson-schema/src';
import {
  classifyMisconception,
  evaluateMission,
  samePoint,
} from '../../../../packages/learning-engine/src';
import { ActionButton } from '../components/Buttons';
import { CommandComposer } from '../components/CommandComposer';
import { MissionCanvas } from '../components/MissionCanvas';
import { colours, radius, spacing } from '../theme';
import type { TaskRendererProps } from './contract';

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Steering a body through space: mazes, treasure runs, the castle.
 *
 * This is the original World 1 interaction, lifted out of MissionScreen
 * unchanged in behaviour. It is now one renderer among several rather than
 * the only way a mission can be played, and it takes its nouns from the theme
 * skin so the same board can read as a maze, a vault or a factory floor.
 */
export function RunProgramTask({
  mission,
  skin,
  ageMode,
  locked,
  busy,
  onAttemptStart,
  onAttempt,
  wide,
  width,
}: TaskRendererProps) {
  const task = mission.task as RunProgramTaskDefinition;
  const board = task.board;

  const [program, setProgram] = useState<Direction[]>(task.initialProgram ?? []);
  const [position, setPosition] = useState<Point>(board.start);
  const [trail, setTrail] = useState<Point[]>([board.start]);
  const [predictionId, setPredictionId] = useState<string>();
  const [debugActions, setDebugActions] = useState(0);
  const attemptCount = useRef(0);

  useEffect(() => {
    setProgram(task.initialProgram ?? []);
    setPosition(board.start);
    setTrail([board.start]);
    setPredictionId(undefined);
    setDebugActions(0);
    attemptCount.current = 0;
  }, [mission.id, mission.variantId]);

  const canvasSize = wide
    ? Math.min(420, width * 0.46)
    : Math.min(420, width - spacing.md * 2);
  const lockedProgram = mission.mode === 'predict';

  const resetBoard = () => {
    setPosition(board.start);
    setTrail([board.start]);
  };

  const clearProgram = () => {
    if (lockedProgram) return;
    resetBoard();
    setProgram([]);
    setDebugActions((current) => current + 1);
  };

  const canRun =
    !busy && !locked && program.length > 0 &&
    (mission.mode !== 'predict' || Boolean(predictionId));

  const run = async () => {
    if (!canRun) return;
    attemptCount.current += 1;
    onAttemptStart();
    setPosition(board.start);
    setTrail([board.start]);

    const evaluation = evaluateMission(mission, program);
    const chosenPrediction = mission.predictionOptions?.find(
      (option) => option.id === predictionId,
    );
    const predictionCorrect = chosenPrediction
      ? samePoint(chosenPrediction.point, evaluation.execution.finalPosition)
      : undefined;
    const missionPassed = evaluation.passed && predictionCorrect !== false;

    const successByDimension: Partial<Record<EvidenceDimension, boolean>> = {};
    for (const definition of mission.evidence) {
      if (definition.dimension === 'explain') continue;
      successByDimension[definition.dimension] =
        definition.dimension === 'predict'
          ? predictionCorrect ?? evaluation.passed
          : evaluation.passed;
    }

    const animated: Point[] = [board.start];
    for (const next of evaluation.execution.trail.slice(1)) {
      await delay(ageMode === 'explorer' ? 380 : 270);
      animated.push(next);
      setPosition(next);
      setTrail([...animated]);
      void Haptics.selectionAsync();
    }

    let failureMessage: string | undefined;
    if (predictionCorrect === false) {
      failureMessage =
        'Good test. Trace one arrow at a time and notice where ' +
        `${skin.actor} actually stopped.`;
    } else if (!evaluation.checks.withinCommandLimit) {
      failureMessage =
        `Your ${skin.program} works, but it uses ${program.length} steps. ` +
        'Can you keep the result and remove the extra movement?';
    } else if (!missionPassed) {
      failureMessage = evaluation.execution.reason;
    }

    onAttempt({
      passed: missionPassed,
      successByDimension,
      programLength: program.length,
      debugActions,
      misconception: classifyMisconception(mission, evaluation, {
        predictionCorrect,
        attemptNumber: attemptCount.current,
      }),
      failureMessage,
      predictionCorrect,
      program,
    });
    setDebugActions(0);
  };

  return (
    <View style={[styles.workArea, wide && styles.workAreaWide]}>
      <View style={styles.canvasColumn}>
        <MissionCanvas
          board={board}
          position={position}
          trail={trail}
          predictionOptions={mission.predictionOptions}
          size={canvasSize}
          skin={skin}
        />
        <View style={styles.legend}>
          <Text style={styles.legendText}>◆ {skin.actor}</Text>
          <Text style={styles.legendText}>● {skin.goal}</Text>
          {board.gems.length > 0 ? (
            <Text style={styles.legendText}>🟡 {skin.token}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.controlsCard, wide && styles.controlsWide]}>
        {mission.mode === 'predict' ? (
          <View style={styles.predictionBlock}>
            <Text style={styles.controlTitle}>Choose before {skin.runVerb}</Text>
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
                    <Text
                      style={[
                        styles.predictionText,
                        selected && styles.predictionTextSelected,
                      ]}
                    >
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
          allowedCommands={task.allowedCommands}
          locked={lockedProgram || busy || locked}
          maxCommands={task.maxCommands}
          onChange={(next) => {
            resetBoard();
            setProgram(next);
            setDebugActions((current) => current + 1);
          }}
        />

        <View style={styles.actionRow}>
          <ActionButton
            label={busy ? 'Running…' : skin.runVerb}
            onPress={() => void run()}
            disabled={!canRun}
            style={styles.runButton}
          />
          {!lockedProgram && !locked ? (
            <ActionButton
              label="Clear"
              onPress={clearProgram}
              variant="secondary"
              style={styles.clearButton}
            />
          ) : (
            <ActionButton
              label="Reset"
              onPress={resetBoard}
              variant="secondary"
              style={styles.clearButton}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  workArea: { gap: spacing.md },
  workAreaWide: { flexDirection: 'row', alignItems: 'flex-start' },
  canvasColumn: { alignItems: 'center', gap: 10 },
  legend: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center' },
  legendText: { color: colours.muted, fontSize: 12, fontWeight: '800' },
  controlsCard: { flex: 1, gap: 12 },
  controlsWide: { paddingLeft: spacing.md },
  controlTitle: { color: colours.ink, fontSize: 15, fontWeight: '900' },
  predictionBlock: { gap: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  predictionOption: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colours.border,
    backgroundColor: colours.surface,
  },
  predictionSelected: { borderColor: colours.purple, backgroundColor: '#EFE9FF' },
  predictionText: { color: colours.ink, fontSize: 14, fontWeight: '800' },
  predictionTextSelected: { color: colours.purpleDark },
  actionRow: { flexDirection: 'row', gap: 10 },
  runButton: { flex: 1 },
  clearButton: { flex: 1 },
  pressed: { opacity: 0.85 },
});
