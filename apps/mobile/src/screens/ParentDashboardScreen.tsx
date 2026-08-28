import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  LearnerProfile,
  LearnerProgress,
  MasteryEntry,
  SkillId,
} from '../../../../packages/lesson-schema/src';
import {
  worldOneMissions,
  worldOneSkillOutcomes,
} from '../../../../packages/content/src/world-one';
import {
  masteryBandForOutcome,
  masteryProgress,
  skillLabels,
} from '../../../../packages/mastery/src';
import { colours, radius, shadow, spacing } from '../theme';

type Props = {
  profile: LearnerProfile;
  progress: LearnerProgress;
  onBack: () => void;
};

export function ParentDashboardScreen({ profile, progress, onBack }: Props) {
  const entries = Object.entries(progress.mastery) as Array<[SkillId, MasteryEntry]>;
  const practised = entries.filter(([, entry]) => entry.evidenceCount > 0);
  const masteryTargets = practised.filter(
    ([skill]) => worldOneSkillOutcomes[skill].target === 'mastery',
  );
  const evidenceProgress = ([skill, entry]: [SkillId, MasteryEntry]) =>
    masteryProgress(entry, worldOneSkillOutcomes[skill]);
  const strongest = [...masteryTargets].sort(
    (left, right) => evidenceProgress(right) - evidenceProgress(left),
  )[0];
  const reinforcement = masteryTargets.length > 1
    ? [...masteryTargets].sort(
        (left, right) => evidenceProgress(left) - evidenceProgress(right),
      )[0]
    : undefined;
  const completed = progress.completedMissionIds.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>‹ Child mode</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PARENT SUMMARY</Text>
            <Text style={styles.title}>{profile.nickname}'s learning</Text>
          </View>
          <View style={styles.shield}><Text style={styles.shieldText}>✓</Text></View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="MISSIONS" value={`${completed}/10`} detail="World 1: Commands" colour={colours.purple} />
          <SummaryCard label="ORIGINAL BUILDS" value={`${progress.savedBuilds.length}`} detail="Private on this device" colour={colours.success} />
          <SummaryCard label="MODE" value={profile.ageMode} detail="Can grow with the same profile" colour="#2D8EC0" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>MASTERY BY CAPABILITY</Text>
          <Text style={styles.cardTitle}>What the evidence shows</Text>
          <Text style={styles.cardIntro}>Scores grow from successful prediction, construction, debugging, explanation and creation—not from time spent in the app.</Text>
          <View style={styles.masteryList}>
            {entries.map(([skill, entry]) => {
              const outcome = worldOneSkillOutcomes[skill];
              const progressPercent = masteryProgress(entry, outcome);
              return (
                <View key={skill} style={styles.masteryRow}>
                  <View style={styles.masteryTop}>
                    <Text style={styles.skill}>{skillLabels[skill]}</Text>
                    <Text style={styles.band}>{masteryBandForOutcome(entry, outcome)}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${progressPercent}%` }]} />
                  </View>
                  <Text style={styles.evidence}>{entry.evidenceCount} evidence event{entry.evidenceCount === 1 ? '' : 's'} • {entry.independentSuccesses} independent • {outcome.target === 'mastery' ? 'World 1 mastery target' : 'introduced in World 1'}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.insightRow}>
          <View style={[styles.insight, styles.strength]}>
            <Text style={styles.insightIcon}>★</Text>
            <Text style={styles.insightLabel}>STRONGEST SO FAR</Text>
            <Text style={styles.insightTitle}>{strongest ? skillLabels[strongest[0]] : 'Ready to discover'}</Text>
            <Text style={styles.insightBody}>{strongest ? 'This has the strongest demonstrated evidence in completed missions.' : 'Complete the first mission to begin the learner model.'}</Text>
          </View>
          <View style={[styles.insight, styles.reinforce]}>
            <Text style={styles.insightIcon}>↻</Text>
            <Text style={styles.insightLabel}>REINFORCE NEXT</Text>
            <Text style={styles.insightTitle}>{reinforcement ? skillLabels[reinforcement[0]] : 'No weak label yet'}</Text>
            <Text style={styles.insightBody}>{reinforcement ? 'More independent practice will raise confidence here.' : 'The app avoids assigning an ability label without evidence.'}</Text>
          </View>
        </View>

        <View style={styles.promptCard}>
          <Text style={styles.promptIcon}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.promptEyebrow}>TRY THIS TOGETHER</Text>
            <Text style={styles.promptTitle}>
              {reinforcement
                ? `Ask ${profile.nickname}: “Can you show me how ${skillLabels[reinforcement[0]].toLowerCase()} helped Byte?”`
                : `Ask ${profile.nickname}: “What do you think Byte will do when you press Run?”`}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>CREATIONS</Text>
          <Text style={styles.cardTitle}>Private project shelf</Text>
          {progress.savedBuilds.length === 0 ? (
            <Text style={styles.empty}>The first original route appears after Mission 9.</Text>
          ) : (
            progress.savedBuilds.map((build) => (
              <View key={build.id} style={styles.buildRow}>
                <Text style={styles.buildIcon}>🏗️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.buildTitle}>{build.title}</Text>
                  <Text style={styles.buildDetail}>{build.program.length} instructions • saved locally</Text>
                </View>
                <Text style={styles.privateLabel}>PRIVATE</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Privacy architecture in this MVP</Text>
          <Text style={styles.privacyBody}>✓ Nickname and broad age mode only</Text>
          <Text style={styles.privacyBody}>✓ No advertising, location, public profile or child messaging</Text>
          <Text style={styles.privacyBody}>✓ No microphone permission or retained voice recording</Text>
          <Text style={styles.privacyBody}>✓ Reviewed hints instead of unrestricted AI chat</Text>
          <Text style={styles.privacyNote}>A qualified privacy professional must review consent, backend data flows, SDKs and store declarations before release.</Text>
        </View>

        <Text style={styles.missionFootnote}>{worldOneMissions.length} deterministic missions are included in the first world.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, detail, colour }: { label: string; value: string; detail: string; colour: string }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryAccent, { backgroundColor: colour }]} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F5F8' },
  content: { width: '100%', maxWidth: 980, alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: 60, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  back: { width: 100, minHeight: 44, justifyContent: 'center' },
  backText: { color: colours.purpleDark, fontWeight: '900', fontSize: 14 },
  headerCopy: { flex: 1, alignItems: 'center' },
  eyebrow: { color: colours.purpleDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colours.ink, fontSize: 21, fontWeight: '900', textTransform: 'capitalize' },
  shield: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#DFF7EE', alignItems: 'center', justifyContent: 'center' },
  shieldText: { color: colours.success, fontSize: 19, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { flex: 1, minWidth: 150, backgroundColor: colours.surface, borderRadius: radius.md, padding: 14, overflow: 'hidden', ...shadow, shadowOpacity: 0.05 },
  summaryAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  summaryLabel: { color: colours.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  summaryValue: { color: colours.ink, fontSize: 25, fontWeight: '900', textTransform: 'capitalize', marginTop: 3 },
  summaryDetail: { color: colours.muted, fontSize: 11, lineHeight: 15, marginTop: 3 },
  card: { backgroundColor: colours.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow, shadowOpacity: 0.05 },
  cardEyebrow: { color: colours.purpleDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  cardTitle: { color: colours.ink, fontSize: 21, fontWeight: '900', marginTop: 2 },
  cardIntro: { color: colours.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  masteryList: { gap: 16, marginTop: 18 },
  masteryRow: { gap: 5 },
  masteryTop: { flexDirection: 'row', justifyContent: 'space-between' },
  skill: { color: colours.ink, fontSize: 14, fontWeight: '900' },
  band: { color: colours.purpleDark, fontSize: 11, fontWeight: '900' },
  track: { height: 10, borderRadius: 5, backgroundColor: '#ECEAF2', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5, backgroundColor: colours.aqua },
  evidence: { color: colours.muted, fontSize: 10 },
  insightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insight: { flex: 1, minWidth: 230, borderRadius: radius.md, padding: spacing.md, borderWidth: 1 },
  strength: { backgroundColor: '#ECFBF5', borderColor: '#BFE8D8' },
  reinforce: { backgroundColor: '#FFF7E4', borderColor: '#F0DBA3' },
  insightIcon: { fontSize: 21 },
  insightLabel: { color: colours.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 7 },
  insightTitle: { color: colours.ink, fontSize: 17, fontWeight: '900', marginTop: 2 },
  insightBody: { color: colours.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  promptCard: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colours.ink, borderRadius: radius.lg, padding: spacing.md },
  promptIcon: { fontSize: 28 },
  promptEyebrow: { color: colours.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  promptTitle: { color: colours.surface, fontSize: 15, lineHeight: 21, fontWeight: '800', marginTop: 3 },
  empty: { color: colours.muted, fontSize: 13, marginTop: 12 },
  buildRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#ECEAF2', paddingTop: 12, marginTop: 12 },
  buildIcon: { fontSize: 24 },
  buildTitle: { color: colours.ink, fontSize: 14, fontWeight: '900' },
  buildDetail: { color: colours.muted, fontSize: 11, marginTop: 2 },
  privateLabel: { color: colours.success, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  privacyCard: { backgroundColor: '#E8F1F7', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: '#C5DCE9' },
  privacyTitle: { color: '#214A61', fontSize: 15, fontWeight: '900', marginBottom: 8 },
  privacyBody: { color: '#315D73', fontSize: 12, lineHeight: 19 },
  privacyNote: { color: '#527589', fontSize: 10, lineHeight: 15, marginTop: 8 },
  missionFootnote: { color: colours.muted, textAlign: 'center', fontSize: 10 },
});
