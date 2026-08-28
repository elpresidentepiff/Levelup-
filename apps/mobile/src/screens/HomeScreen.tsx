import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  LearnerProfile,
  LearnerProgress,
} from '../../../../packages/lesson-schema/src';
import { worldOneMissions } from '../../../../packages/content/src/world-one';
import { ActionButton } from '../components/Buttons';
import { ByteAvatar } from '../components/ByteAvatar';
import { colours, radius, shadow, spacing } from '../theme';
import { interests } from '../worlds';

type Props = {
  profile: LearnerProfile;
  progress: LearnerProgress;
  onOpenWorld: () => void;
  onOpenParent: () => void;
};

export function HomeScreen({ profile, progress, onOpenWorld, onOpenParent }: Props) {
  const completed = progress.completedMissionIds.length;
  const percent = Math.round((completed / worldOneMissions.length) * 100);
  const interest = interests.find((item) => item.id === profile.interest) ?? interests[1];

  return (
    <LinearGradient colors={['#EEE9FF', '#F9F8FF', '#E3FAFF']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.hello}>Hello, {profile.nickname}</Text>
              <Text style={styles.mode}>{profile.ageMode.toUpperCase()} MODE</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open parent area"
              onPress={onOpenParent}
              style={({ pressed }) => [styles.parentButton, pressed && styles.pressed]}
            >
              <Text style={styles.parentIcon}>🔒</Text>
              <Text style={styles.parentText}>Grown-ups</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <View style={styles.logoPill}><Text style={styles.logo}>LEVEL</Text></View>
              <Text style={styles.title}>What shall we build today?</Text>
              <Text style={styles.subtitle}>
                Start with commands. The computer science appears after you understand it.
              </Text>
            </View>
            <ByteAvatar size={104} mood="celebrate" />
          </View>

          <View style={styles.choiceCard}>
            <Text style={styles.choiceIcon}>{interest.icon}</Text>
            <View style={styles.choiceCopy}>
              <Text style={styles.choiceEyebrow}>YOUR PICK</Text>
              <Text style={styles.choiceTitle}>Build a {interest.label.toLowerCase()}</Text>
              <Text style={styles.choiceSubtitle}>Byte has a starter adventure ready.</Text>
            </View>
          </View>

          <View style={styles.worldCard}>
            <View style={styles.worldTop}>
              <View style={styles.worldNumber}><Text style={styles.worldNumberText}>1</Text></View>
              <View style={styles.worldCopy}>
                <Text style={styles.worldEyebrow}>WORLD 1</Text>
                <Text style={styles.worldTitle}>Commands</Text>
                <Text style={styles.worldSubtitle}>Make things happen, predict results and fix bugs.</Text>
              </View>
              <Text style={styles.lightning}>⚡</Text>
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>{completed} of 10 missions</Text>
              <Text style={styles.progressLabel}>{percent}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>
            <ActionButton
              label={completed === 0 ? 'Begin adventure' : completed === 10 ? 'Play again' : 'Continue building'}
              onPress={onOpenWorld}
              style={styles.cta}
            />
          </View>

          <View style={styles.promiseRow}>
            <Promise icon="🧠" title="Think" body="Predict before pressing Run" />
            <Promise icon="🔧" title="Fix" body="Bugs become detective missions" />
            <Promise icon="🏗️" title="Create" body="Builds belong to the child" />
          </View>

          <View style={styles.safeCard}>
            <Text style={styles.safeTitle}>Built for young builders</Text>
            <Text style={styles.safeBody}>
              No adverts. No public profile. No location. No unrestricted AI chat. Progress stays on this device in the MVP.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Promise({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={styles.promise}>
      <Text style={styles.promiseIcon}>{icon}</Text>
      <Text style={styles.promiseTitle}>{title}</Text>
      <Text style={styles.promiseBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  hello: { color: colours.ink, fontWeight: '900', fontSize: 17 },
  mode: { color: colours.purpleDark, fontWeight: '900', fontSize: 10, letterSpacing: 1.4, marginTop: 3 },
  parentButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.pill },
  parentIcon: { fontSize: 12 },
  parentText: { color: colours.ink, fontSize: 12, fontWeight: '800' },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, gap: 8 },
  heroCopy: { flex: 1 },
  logoPill: { alignSelf: 'flex-start', backgroundColor: colours.ink, paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill },
  logo: { color: colours.lime, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { color: colours.ink, fontSize: 34, lineHeight: 37, fontWeight: '900', maxWidth: 570, marginTop: 10 },
  subtitle: { color: colours.muted, fontSize: 15, lineHeight: 21, maxWidth: 560, marginTop: 8 },
  choiceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#262044', borderRadius: radius.lg, padding: spacing.md, gap: 14, ...shadow },
  choiceIcon: { fontSize: 40 },
  choiceCopy: { flex: 1 },
  choiceEyebrow: { color: colours.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  choiceTitle: { color: colours.surface, fontSize: 19, fontWeight: '900', marginTop: 2 },
  choiceSubtitle: { color: '#D8D1EC', fontSize: 13, marginTop: 2 },
  worldCard: { backgroundColor: colours.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: '#ECE8F8', ...shadow },
  worldTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  worldNumber: { width: 42, height: 42, borderRadius: 15, backgroundColor: colours.purple, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderColor: colours.purpleDark },
  worldNumberText: { color: colours.surface, fontSize: 20, fontWeight: '900' },
  worldCopy: { flex: 1 },
  worldEyebrow: { color: colours.purpleDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  worldTitle: { color: colours.ink, fontSize: 25, fontWeight: '900' },
  worldSubtitle: { color: colours.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  lightning: { fontSize: 34 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  progressLabel: { color: colours.muted, fontSize: 12, fontWeight: '800' },
  track: { height: 12, borderRadius: 8, backgroundColor: colours.lilac, overflow: 'hidden', marginTop: 7 },
  fill: { height: '100%', borderRadius: 8, backgroundColor: colours.aqua },
  cta: { marginTop: 16 },
  promiseRow: { flexDirection: 'row', gap: 8 },
  promise: { flex: 1, backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: radius.md, padding: 12, minHeight: 132 },
  promiseIcon: { fontSize: 23 },
  promiseTitle: { color: colours.ink, fontWeight: '900', fontSize: 15, marginTop: 7 },
  promiseBody: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  safeCard: { backgroundColor: '#EAFBF5', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: '#C8EEDD' },
  safeTitle: { color: '#175F49', fontSize: 14, fontWeight: '900' },
  safeBody: { color: '#356C5B', fontSize: 12, lineHeight: 18, marginTop: 4 },
  pressed: { opacity: 0.7 },
});

