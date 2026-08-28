import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colours, radius, shadow } from '../theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function ActionButton({
  label,
  onPress,
  disabled,
  icon,
  variant = 'primary',
  style,
  accessibilityHint,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          variant !== 'primary' && styles.secondaryLabel,
          variant === 'quiet' && styles.quietLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...shadow,
  },
  primary: {
    backgroundColor: colours.purple,
    borderBottomWidth: 4,
    borderBottomColor: colours.purpleDark,
  },
  secondary: {
    backgroundColor: colours.surface,
    borderWidth: 2,
    borderColor: colours.border,
    shadowOpacity: 0.06,
  },
  quiet: {
    minHeight: 44,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    color: colours.surface,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
  secondaryLabel: {
    color: colours.ink,
  },
  quietLabel: {
    color: colours.purpleDark,
    fontSize: 15,
  },
  pressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.45,
  },
});

