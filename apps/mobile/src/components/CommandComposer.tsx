import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Direction } from '../../../../packages/lesson-schema/src';
import {
  directionArrow,
  directionLabel,
} from '../../../../packages/learning-engine/src';
import { colours, radius } from '../theme';

type Props = {
  program: Direction[];
  allowedCommands: Direction[];
  locked?: boolean;
  maxCommands?: number;
  onChange: (program: Direction[]) => void;
};

export function CommandComposer({
  program,
  allowedCommands,
  locked,
  maxCommands,
  onChange,
}: Props) {
  const addCommand = (direction: Direction) => {
    if (locked || program.length >= 14) return;
    void Haptics.selectionAsync();
    onChange([...program, direction]);
  };

  const removeCommand = (index: number) => {
    if (locked) return;
    void Haptics.selectionAsync();
    onChange(program.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>{locked ? 'Read these steps' : 'Your instructions'}</Text>
        <Text style={styles.count}>
          {program.length}{maxCommands ? ` / ${maxCommands}` : ''}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.program}
        accessibilityLabel={`${program.length} instruction tiles`}
      >
        {program.length === 0 ? (
          <View style={styles.emptyProgram}>
            <Text style={styles.emptyText}>Tap arrows to build a route</Text>
          </View>
        ) : (
          program.map((direction, index) => (
            <Pressable
              key={`${direction}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`${directionLabel[direction]} instruction ${index + 1}${locked ? '' : ', tap to remove'}`}
              onPress={() => removeCommand(index)}
              style={({ pressed }) => [
                styles.commandTile,
                pressed && !locked && styles.pressed,
              ]}
            >
              <Text style={styles.order}>{index + 1}</Text>
              <Text style={styles.arrow}>{directionArrow[direction]}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      {!locked ? (
        <View style={styles.palette}>
          {allowedCommands.map((direction) => (
            <Pressable
              key={direction}
              accessibilityRole="button"
              accessibilityLabel={`Add ${directionLabel[direction]}`}
              onPress={() => addCommand(direction)}
              style={({ pressed }) => [styles.paletteTile, pressed && styles.pressed]}
            >
              <Text style={styles.paletteArrow}>{directionArrow[direction]}</Text>
              <Text style={styles.paletteLabel}>{directionLabel[direction]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    color: colours.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  count: {
    color: colours.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  program: {
    minHeight: 68,
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  emptyProgram: {
    minWidth: 220,
    height: 62,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colours.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9FF',
  },
  emptyText: {
    color: colours.muted,
    fontWeight: '700',
  },
  commandTile: {
    width: 58,
    height: 62,
    borderRadius: radius.sm,
    backgroundColor: colours.surface,
    borderWidth: 2,
    borderColor: colours.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  order: {
    position: 'absolute',
    left: 6,
    top: 4,
    color: colours.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  arrow: {
    color: colours.purpleDark,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  palette: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  paletteTile: {
    minWidth: 68,
    flex: 1,
    minHeight: 66,
    borderRadius: radius.md,
    backgroundColor: colours.lilac,
    borderBottomWidth: 3,
    borderColor: '#C3B7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteArrow: {
    color: colours.purpleDark,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '900',
  },
  paletteLabel: {
    color: colours.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});

