import { StyleSheet, Text, View } from 'react-native';

import { colours, shadow } from '../theme';

type Props = {
  size?: number;
  mood?: 'happy' | 'thinking' | 'celebrate';
};

export function ByteAvatar({ size = 82, mood = 'happy' }: Props) {
  const eye = Math.max(5, size * 0.08);
  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityLabel={`Byte is ${mood}`}>
      <View style={[styles.antenna, { height: size * 0.19, top: 0 }]} />
      <View style={[styles.antennaTip, { width: eye * 1.5, height: eye * 1.5, borderRadius: eye, top: 0 }]} />
      <View
        style={[
          styles.head,
          {
            width: size * 0.84,
            height: size * 0.68,
            borderRadius: size * 0.24,
            bottom: 0,
          },
        ]}
      >
        <View style={styles.eyes}>
          <View style={[styles.eye, { width: eye, height: eye, borderRadius: eye }]} />
          <View style={[styles.eye, { width: eye, height: eye, borderRadius: eye }]} />
        </View>
        <View
          style={[
            styles.mouth,
            mood === 'thinking' && styles.thinkingMouth,
            mood === 'celebrate' && styles.celebrateMouth,
          ]}
        />
      </View>
      {mood === 'celebrate' ? <Text style={styles.spark}>✦</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  antenna: {
    position: 'absolute',
    width: 4,
    backgroundColor: colours.purpleDark,
    zIndex: 1,
  },
  antennaTip: {
    position: 'absolute',
    backgroundColor: colours.lime,
    borderWidth: 2,
    borderColor: colours.purpleDark,
    zIndex: 2,
  },
  head: {
    position: 'absolute',
    backgroundColor: colours.purple,
    borderWidth: 4,
    borderColor: colours.purpleDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  eyes: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 3,
  },
  eye: {
    backgroundColor: colours.lime,
    borderWidth: 2,
    borderColor: colours.ink,
  },
  mouth: {
    width: 24,
    height: 10,
    borderBottomWidth: 3,
    borderColor: colours.surface,
    borderRadius: 20,
    marginTop: 7,
  },
  thinkingMouth: {
    width: 14,
    borderBottomWidth: 0,
    borderTopWidth: 3,
    borderRadius: 0,
  },
  celebrateMouth: {
    height: 13,
    borderBottomWidth: 5,
  },
  spark: {
    position: 'absolute',
    right: -7,
    top: 4,
    color: colours.gold,
    fontSize: 22,
    fontWeight: '900',
  },
});

