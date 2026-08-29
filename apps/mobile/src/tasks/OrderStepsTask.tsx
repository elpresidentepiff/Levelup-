import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  EvidenceDimension,
  OrderStepsTask as OrderStepsTaskDefinition,
} from '../../../../packages/lesson-schema/src';
import { ActionButton } from '../components/Buttons';
import { colours, radius, spacing } from '../theme';
import type { TaskRendererProps } from './contract';

/**
 * Putting steps into a working order, with no board and no movement.
 *
 * This is the same claim about sequencing as a maze makes, asked in a world
 * where "right, right, up" is meaningless. A child who has memorised routes
 * has nothing to fall back on here, which is the point: the grid was never
 * the skill, it was one costume the skill wore.
 *
 * The child assembles the checklist, then runs it and watches it either work
 * or stop at the first step that could not happen yet - the same feedback
 * shape as watching a robot walk into a wall, without the robot.
 */
export function OrderStepsTask({
  mission,
  skin,
  locked,
  busy,
  onAttemptStart,
  onAttempt,
}: TaskRendererProps) {
  const task = mission.task as OrderStepsTaskDefinition;
  const [chosen, setChosen] = useState<string[]>([]);
  const [failedAt, setFailedAt] = useState<number>();
  const [edits, setEdits] = useState(0);

  useEffect(() => {
    setChosen([]);
    setFailedAt(undefined);
    setEdits(0);
  }, [mission.id]);

  const byId = useMemo(
    () => new Map(task.steps.map((step) => [step.id, step])),
    [task.steps],
  );
  const remaining = task.steps.filter((step) => !chosen.includes(step.id));
  const complete = chosen.length === task.steps.length;

  const add = (id: string) => {
    if (locked || busy) return;
    void Haptics.selectionAsync();
    setFailedAt(undefined);
    setEdits((value) => value + 1);
    setChosen((value) => [...value, id]);
  };

  const remove = (id: string) => {
    if (locked || busy) return;
    void Haptics.selectionAsync();
    setFailedAt(undefined);
    setEdits((value) => value + 1);
    setChosen((value) => value.filter((item) => item !== id));
  };

  const submit = () => {
    if (!complete || locked || busy) return;
    onAttemptStart();

    // The first position that differs from the solution is where the plan
    // stops making sense - the equivalent of the step a walker collides on.
    const firstWrong = chosen.findIndex((id, index) => id !== task.solution[index]);
    const passed = firstWrong === -1;
    setFailedAt(passed ? undefined : firstWrong);

    const successByDimension: Partial<Record<EvidenceDimension, boolean>> = {};
    for (const definition of mission.evidence) {
      if (definition.dimension === 'explain') continue;
      successByDimension[definition.dimension] = passed;
    }

    onAttempt({
      passed,
      successByDimension,
      programLength: chosen.length,
      debugActions: edits,
      failureMessage: passed
        ? undefined
        : `That order stops at step ${firstWrong + 1}. ` +
          `${capitalise(byId.get(chosen[firstWrong])?.label ?? 'that step')} cannot happen yet.`,
      misconception: passed ? undefined : 'order_reversal',
    });
    setEdits(0);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        <Text style={styles.heading}>Steps to choose from</Text>
        {remaining.length === 0 ? (
          <Text style={styles.empty}>Every step is in your {skin.program}.</Text>
        ) : (
          <View style={styles.chips}>
            {remaining.map((step) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${step.label}`}
                key={step.id}
                onPress={() => add(step.id)}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Text style={styles.chipText}>{step.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.heading}>
          Your {skin.program} · {chosen.length}/{task.steps.length}
        </Text>
        {chosen.length === 0 ? (
          <Text style={styles.empty}>Tap a step above to begin.</Text>
        ) : (
          <View style={styles.list}>
            {chosen.map((id, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${byId.get(id)?.label}, position ${index + 1}`}
                key={id}
                onPress={() => remove(id)}
                style={({ pressed }) => [
                  styles.row,
                  failedAt === index && styles.rowFailed,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.rowIndex}>{index + 1}</Text>
                <Text style={styles.rowText}>{byId.get(id)?.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ActionButton
        label={busy ? 'Checking…' : skin.runVerb}
        onPress={submit}
        disabled={!complete || locked || busy}
      />
    </View>
  );
}

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  panel: { gap: 10 },
  heading: { color: colours.ink, fontSize: 15, fontWeight: '900' },
  empty: { color: colours.muted, fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderRadius: radius.sm,
    borderWidth: 2,
    paddingHorizontal: 14,
  },
  chipText: { color: colours.ink, fontSize: 15, fontWeight: '800' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderRadius: radius.sm,
    borderWidth: 2,
    paddingHorizontal: 14,
  },
  rowFailed: { borderColor: colours.coral, backgroundColor: '#FFECEC' },
  rowIndex: { color: colours.muted, fontSize: 13, fontWeight: '900', minWidth: 16 },
  rowText: { color: colours.ink, fontSize: 15, fontWeight: '800', flex: 1 },
  pressed: { opacity: 0.85 },
});
