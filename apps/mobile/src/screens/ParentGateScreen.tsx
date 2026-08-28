import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/Buttons';
import { colours, radius, shadow, spacing } from '../theme';

type Props = {
  onBack: () => void;
  onUnlock: () => void;
};

export function ParentGateScreen({ onBack, onUnlock }: Props) {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const check = () => {
    if (answer.trim() === '56') {
      setError(false);
      onUnlock();
      return;
    }
    setError(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.lock}><Text style={styles.lockIcon}>🔒</Text></View>
          <Text style={styles.eyebrow}>GROWN-UP AREA</Text>
          <Text style={styles.title}>A quick adult check</Text>
          <Text style={styles.body}>Please answer this before opening detailed learning information.</Text>
          <Text style={styles.question}>What is 8 × 7?</Text>
          <TextInput
            accessibilityLabel="Answer to adult check"
            keyboardType="number-pad"
            value={answer}
            onChangeText={(value) => {
              setAnswer(value);
              setError(false);
            }}
            onSubmitEditing={check}
            maxLength={3}
            style={[styles.input, error && styles.inputError]}
          />
          {error ? <Text style={styles.error}>That answer does not match. Please try again.</Text> : null}
          <ActionButton label="Open parent summary" onPress={check} disabled={!answer} />
          <ActionButton label="Back to child mode" onPress={onBack} variant="quiet" />
          <Text style={styles.note}>This is an MVP gate. Production verification and regional consent flows require policy review.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  layout: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { width: '100%', maxWidth: 520, backgroundColor: colours.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: '#ECE8F8', ...shadow },
  lock: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colours.lilac },
  lockIcon: { fontSize: 28 },
  eyebrow: { color: colours.purpleDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 16 },
  title: { color: colours.ink, fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  body: { color: colours.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 390, marginTop: 7 },
  question: { color: colours.ink, fontSize: 22, fontWeight: '900', marginTop: 22 },
  input: { width: 120, height: 58, borderRadius: radius.md, borderWidth: 2, borderColor: colours.border, backgroundColor: '#FAF9FF', color: colours.ink, fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 10, marginBottom: 10 },
  inputError: { borderColor: colours.danger },
  error: { color: colours.danger, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  note: { color: colours.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 8 },
});

