import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  melodyAsGiven,
  recipeAsGiven,
  transferTrials,
  type TransferTrial,
} from '../../../../packages/content/src/transfer-trials';
import type { EvidenceEvent } from '../../../../packages/lesson-schema/src';
import { ActionButton } from '../components/Buttons';
import { colours } from '../theme';

type Props = {
  onBack: () => void;
  onEvidence: (events: EvidenceEvent[]) => void;
};

const label = (token: string) =>
  token.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

/**
 * The three non-grid trials.
 *
 * Castle Boss shows a child can sequence, predict and debug on a board. These
 * ask the same thinking with no board, no Byte and no movement, so passing them
 * says something about the idea rather than about the grid.
 *
 * Evidence is written only on a correct first answer with no reveal used. A
 * child may retry as often as they like — retrying is how you learn — but a
 * second attempt is practice, and practice is not transfer evidence.
 */
export function TransferTrialScreen({ onBack, onEvidence }: Props) {
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [choice, setChoice] = useState<string>();
  const [result, setResult] = useState<'right' | 'wrong'>();
  const [attempts, setAttempts] = useState(1);
  const [startedAt] = useState(() => Date.now());
  const [recorded, setRecorded] = useState<string[]>([]);

  const trial: TransferTrial = transferTrials[index];
  const shownSteps = useMemo(
    () => (trial.interaction === 'order' ? [...trial.answerVocabulary].reverse() : []),
    [trial],
  );
  // Each trial carries its own stimulus, so the screen never has to know which
  // trial it is rendering.
  const stimulus = useMemo(() => {
    if (trial.given) return trial.given;
    if (trial.id === 'melody-next') return melodyAsGiven;
    if (trial.id === 'recipe-repair') return recipeAsGiven;
    return [];
  }, [trial]);

  const reset = (nextIndex: number) => {
    setIndex(nextIndex);
    setOrder([]);
    setChoice(undefined);
    setResult(undefined);
    setAttempts(1);
  };

  const check = () => {
    const answer = trial.interaction === 'order' ? order : choice;
    const correct =
      trial.interaction === 'order'
        ? JSON.stringify(answer) === JSON.stringify(trial.solution)
        : answer === trial.solution;

    setResult(correct ? 'right' : 'wrong');
    if (!correct) {
      setAttempts((value) => value + 1);
      return;
    }

    // Only a first-attempt success is transfer evidence. Getting there after
    // being told is learning, and worth doing, but it is not proof.
    if (attempts === 1 && !recorded.includes(trial.id)) {
      setRecorded((value) => [...value, trial.id]);
      onEvidence([
        {
          id: `transfer-${trial.id}-${Date.now()}`,
          schemaVersion: 1,
          missionId: trial.id,
          skillId: trial.skillId,
          evidenceType: 'transfer',
          context: trial.context,
          success: true,
          independent: true,
          attemptNumber: 1,
          hintsUsed: 0,
          timeToSolutionMs: Date.now() - startedAt,
          programLength: 0,
          optimalProgramLength: 0,
          debugActions: 0,
          explanationResult: 'not_required',
          transferContext: trial.context,
          retrieval: false,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const canCheck =
    trial.interaction === 'order'
      ? order.length === trial.answerVocabulary.length
      : Boolean(choice);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>{trial.eyebrow}</Text>
      <Text style={styles.title}>{trial.title}</Text>
      <Text style={styles.prompt}>{trial.prompt}</Text>

      {trial.interaction === 'order' ? (
        <View>
          <Text style={styles.hintLabel}>Tap the steps in order</Text>
          <View style={styles.chips}>
            {shownSteps
              .filter((step) => !order.includes(step))
              .map((step) => (
                <Pressable
                  accessibilityRole="button"
                  key={step}
                  onPress={() => setOrder((value) => [...value, step])}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{label(step)}</Text>
                </Pressable>
              ))}
          </View>
          <Text style={styles.hintLabel}>Your order</Text>
          <View style={styles.chips}>
            {order.map((step, position) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${label(step)}, position ${position + 1}`}
                key={step}
                onPress={() => setOrder((value) => value.filter((item) => item !== step))}
                style={[styles.chip, styles.chipChosen]}
              >
                <Text style={styles.chipText}>
                  {position + 1}. {label(step)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View>
          {stimulus.length ? (
            trial.interaction === 'choose-next' ? (
              <Text style={styles.sequence}>{stimulus.map(label).join('  ·  ')}  ·  ?</Text>
            ) : (
              <View style={styles.chips}>
                {stimulus.map((step, position) => (
                  <View key={step} style={styles.step}>
                    <Text style={styles.chipText}>
                      {trial.interaction === 'choose-shorter'
                        ? step
                        : `${position + 1}. ${label(step)}`}
                    </Text>
                  </View>
                ))}
              </View>
            )
          ) : null}
          <Text style={styles.hintLabel}>Your answer</Text>
          <View style={styles.chips}>
            {trial.answerVocabulary.map((token) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: choice === token }}
                key={token}
                onPress={() => setChoice(token)}
                style={[styles.chip, choice === token && styles.chipChosen]}
              >
                <Text style={styles.chipText}>{label(token)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {result ? (
        <View style={[styles.feedback, result === 'right' ? styles.right : styles.wrong]}>
          <Text style={styles.feedbackTitle}>
            {result === 'right' ? 'That works.' : 'Not yet — try again.'}
          </Text>
          {result === 'right' ? <Text style={styles.because}>{trial.because}</Text> : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {result === 'right' ? (
          index < transferTrials.length - 1 ? (
            <ActionButton label="Next trial" onPress={() => reset(index + 1)} />
          ) : (
            <ActionButton label="Finish" onPress={onBack} />
          )
        ) : (
          <ActionButton label="Check my answer" onPress={check} disabled={!canCheck} />
        )}
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 22, paddingBottom: 48, gap: 12 },
  eyebrow: {
    color: colours.purple,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: { color: colours.ink, fontSize: 28, fontWeight: '900' },
  prompt: { color: colours.ink, fontSize: 16, lineHeight: 23, marginBottom: 8 },
  hintLabel: {
    color: colours.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  chipChosen: { borderColor: colours.purple },
  chipText: { color: colours.ink, fontSize: 15, fontWeight: '800' },
  step: {
    backgroundColor: colours.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sequence: { color: colours.ink, fontSize: 18, fontWeight: '800', marginTop: 10 },
  feedback: { borderRadius: 16, marginTop: 18, padding: 16 },
  right: { backgroundColor: colours.lime },
  wrong: { backgroundColor: colours.surface },
  feedbackTitle: { color: colours.ink, fontSize: 17, fontWeight: '900' },
  because: { color: colours.ink, fontSize: 15, lineHeight: 22, marginTop: 8 },
  actions: { gap: 14, marginTop: 24 },
  back: { color: colours.muted, fontSize: 15, fontWeight: '800', textAlign: 'center' },
});
