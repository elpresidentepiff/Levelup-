import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { LearnerProgress } from '../../../../packages/lesson-schema/src';
import { worldOneMissions } from '../../../../packages/content/src/world-one';
import { colours, radius, shadow, spacing } from '../theme';
import { worlds } from '../worlds';

type Props = {
  progress: LearnerProgress;
  onBack: () => void;
  onOpenMission: (missionId: string) => void;
};

export function WorldMapScreen({ progress, onBack, onOpenMission }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>‹ Home</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>WORLD MAP</Text>
            <Text style={styles.title}>Choose a mission</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>⚡</Text></View>
        </View>

        <View style={styles.worldHeader}>
          <View style={styles.worldIcon}><Text style={styles.worldIconText}>1</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.worldEyebrow}>WORLD 1</Text>
            <Text style={styles.worldTitle}>Commands</Text>
            <Text style={styles.worldDescription}>Make things happen • predict • debug • create</Text>
          </View>
        </View>

        <View style={styles.missionGrid}>
          {worldOneMissions.map((mission, index) => {
            const complete = progress.completedMissionIds.includes(mission.id);
            const unlocked = index === 0 || progress.completedMissionIds.includes(worldOneMissions[index - 1].id);
            const stars = progress.starsByMission[mission.id] ?? 0;
            return (
              <Pressable
                key={mission.id}
                accessibilityRole="button"
                accessibilityState={{ disabled: !unlocked }}
                accessibilityLabel={`Mission ${mission.number}, ${mission.title}, ${complete ? `${stars} stars` : unlocked ? 'ready' : 'locked'}`}
                disabled={!unlocked}
                onPress={() => onOpenMission(mission.id)}
                style={({ pressed }) => [
                  styles.mission,
                  complete && styles.missionComplete,
                  !unlocked && styles.missionLocked,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.missionNumber, complete && styles.missionNumberComplete]}>
                  <Text style={[styles.missionNumberText, complete && styles.missionNumberTextComplete]}>
                    {complete ? '✓' : mission.number}
                  </Text>
                </View>
                <Text style={styles.missionEyebrow}>{mission.eyebrow.toUpperCase()}</Text>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionObjective} numberOfLines={2}>{mission.shortObjective}</Text>
                <Text style={styles.stars}>{complete ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : unlocked ? 'READY →' : '🔒 LOCKED'}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.nextTitle}>Next worlds</Text>
        <View style={styles.nextList}>
          {worlds.slice(1).map((world) => (
            <View key={world.number} style={styles.nextWorld}>
              <Text style={styles.nextIcon}>{world.icon}</Text>
              <View style={styles.nextCopy}>
                <Text style={styles.nextWorldTitle}>{world.number}. {world.title}</Text>
                <Text style={styles.nextWorldSubtitle}>{world.subtitle}</Text>
              </View>
              <Text style={styles.lock}>🔒</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  content: { width: '100%', maxWidth: 920, alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  back: { minWidth: 76, minHeight: 44, justifyContent: 'center' },
  backText: { color: colours.purpleDark, fontWeight: '900', fontSize: 15 },
  headerCopy: { flex: 1, alignItems: 'center' },
  eyebrow: { color: colours.purpleDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colours.ink, fontSize: 22, fontWeight: '900' },
  badge: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colours.lime },
  badgeText: { fontSize: 21 },
  worldHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colours.ink, borderRadius: radius.lg, padding: 18, ...shadow },
  worldIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: colours.purple, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderColor: '#312064' },
  worldIconText: { color: colours.surface, fontSize: 24, fontWeight: '900' },
  worldEyebrow: { color: colours.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  worldTitle: { color: colours.surface, fontSize: 25, fontWeight: '900', marginTop: 1 },
  worldDescription: { color: '#DCD5EF', fontSize: 12, marginTop: 3 },
  missionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  mission: { width: '48%', flexGrow: 1, minWidth: 155, minHeight: 182, backgroundColor: colours.surface, borderRadius: radius.md, borderWidth: 2, borderColor: colours.border, padding: 14, ...shadow, shadowOpacity: 0.06 },
  missionComplete: { borderColor: '#8CD8C1', backgroundColor: '#F4FFFB' },
  missionLocked: { opacity: 0.52, backgroundColor: '#F1EFF7' },
  missionNumber: { width: 34, height: 34, borderRadius: 12, backgroundColor: colours.lilac, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  missionNumberComplete: { backgroundColor: '#CCF4E6' },
  missionNumberText: { color: colours.purpleDark, fontWeight: '900' },
  missionNumberTextComplete: { color: colours.success },
  missionEyebrow: { color: colours.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  missionTitle: { color: colours.ink, fontSize: 18, fontWeight: '900', marginTop: 3 },
  missionObjective: { color: colours.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  stars: { color: colours.purpleDark, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 'auto', paddingTop: 10 },
  nextTitle: { color: colours.ink, fontSize: 20, fontWeight: '900', marginTop: 28, marginBottom: 10 },
  nextList: { gap: 8 },
  nextWorld: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0EDF7', borderRadius: radius.md, padding: 14, opacity: 0.75 },
  nextIcon: { fontSize: 23, width: 38 },
  nextCopy: { flex: 1 },
  nextWorldTitle: { color: colours.ink, fontWeight: '900', fontSize: 14 },
  nextWorldSubtitle: { color: colours.muted, fontSize: 12, marginTop: 2 },
  lock: { fontSize: 13 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});

