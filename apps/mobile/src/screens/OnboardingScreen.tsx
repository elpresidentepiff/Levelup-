import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  AgeMode,
  LearnerProfile,
} from '../../../../packages/lesson-schema/src';
import { ActionButton } from '../components/Buttons';
import { ByteAvatar } from '../components/ByteAvatar';
import { interests } from '../worlds';
import { colours, radius, shadow, spacing } from '../theme';

type Props = {
  onComplete: (profile: LearnerProfile) => void;
};

const ageModes: Array<{
  id: AgeMode;
  label: string;
  ages: string;
  description: string;
}> = [
  { id: 'explorer', label: 'Explorer', ages: '6–8', description: 'Big icons and short instructions' },
  { id: 'builder', label: 'Builder', ages: '9–10', description: 'Puzzles, projects and explanations' },
  { id: 'creator', label: 'Creator', ages: '11–12', description: 'Richer logic and deeper challenges' },
];

export function OnboardingScreen({ onComplete }: Props) {
  const [nickname, setNickname] = useState('');
  const [ageMode, setAgeMode] = useState<AgeMode>('builder');
  const [interest, setInterest] = useState<LearnerProfile['interest']>('robot');

  const submit = () => {
    onComplete({
      nickname: nickname.trim() || 'Builder',
      ageMode,
      interest,
    });
  };

  return (
    <LinearGradient colors={['#E8E1FF', '#F9F8FF', '#E7FCFF']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <ByteAvatar size={94} mood="celebrate" />
              <View style={styles.logoPill}>
                <Text style={styles.logo}>LEVEL</Text>
              </View>
              <Text style={styles.title}>Meet Byte, your build buddy.</Text>
              <Text style={styles.subtitle}>
                You do the thinking. Byte helps you test, fix and create.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Choose a builder name</Text>
              <Text style={styles.helper}>Use a nickname, not your real name.</Text>
              <TextInput
                accessibilityLabel="Builder nickname"
                value={nickname}
                onChangeText={setNickname}
                placeholder="e.g. Star Builder"
                placeholderTextColor="#958EAA"
                maxLength={16}
                autoCorrect={false}
                style={styles.input}
              />

              <Text style={[styles.sectionTitle, styles.sectionGap]}>Pick your mode</Text>
              <View style={styles.modeList}>
                {ageModes.map((mode) => {
                  const selected = ageMode === mode.id;
                  return (
                    <Pressable
                      key={mode.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setAgeMode(mode.id)}
                      style={({ pressed }) => [
                        styles.mode,
                        selected && styles.modeSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.modeTop}>
                        <Text style={[styles.modeName, selected && styles.modeNameSelected]}>
                          {mode.label}
                        </Text>
                        <Text style={[styles.age, selected && styles.ageSelected]}>{mode.ages}</Text>
                      </View>
                      <Text style={[styles.modeDescription, selected && styles.modeDescriptionSelected]}>
                        {mode.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, styles.sectionGap]}>What sounds fun?</Text>
              <View style={styles.interests}>
                {interests.map((item) => {
                  const selected = interest === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setInterest(item.id)}
                      style={({ pressed }) => [
                        styles.interest,
                        selected && styles.interestSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.interestIcon}>{item.icon}</Text>
                      <Text style={styles.interestText}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ActionButton label="Start building" onPress={submit} />
            <Text style={styles.privacy}>
              Private by default. No ads, public profile, location or open chat.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  logoPill: {
    marginTop: 8,
    backgroundColor: colours.ink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  logo: {
    color: colours.lime,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  title: {
    color: colours.ink,
    fontSize: 31,
    lineHeight: 35,
    textAlign: 'center',
    fontWeight: '900',
    marginTop: 12,
  },
  subtitle: {
    color: colours.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 470,
  },
  card: {
    backgroundColor: colours.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#ECE8F8',
    ...shadow,
  },
  sectionTitle: {
    color: colours.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  helper: {
    color: colours.muted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colours.border,
    backgroundColor: '#FBFAFF',
    color: colours.ink,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  sectionGap: { marginTop: 22, marginBottom: 10 },
  modeList: { gap: 8 },
  mode: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colours.border,
    backgroundColor: '#FBFAFF',
    padding: 13,
  },
  modeSelected: { backgroundColor: colours.purple, borderColor: colours.purpleDark },
  modeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeName: { color: colours.ink, fontSize: 16, fontWeight: '900' },
  modeNameSelected: { color: colours.surface },
  age: { color: colours.purpleDark, fontWeight: '900' },
  ageSelected: { color: colours.lime },
  modeDescription: { color: colours.muted, fontSize: 13, marginTop: 3 },
  modeDescriptionSelected: { color: '#EEE9FF' },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interest: {
    width: '31%',
    minWidth: 92,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colours.border,
    backgroundColor: '#FBFAFF',
    alignItems: 'center',
    paddingVertical: 12,
  },
  interestSelected: { borderColor: colours.purple, backgroundColor: colours.lilac },
  interestIcon: { fontSize: 25 },
  interestText: { color: colours.ink, fontWeight: '800', fontSize: 12, marginTop: 3 },
  privacy: { color: colours.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});

