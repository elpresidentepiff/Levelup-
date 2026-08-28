export const colours = {
  ink: '#211943',
  muted: '#6F6886',
  purple: '#6B4EFF',
  purpleDark: '#4B2E9D',
  lilac: '#EEE9FF',
  lime: '#D9FF70',
  aqua: '#63E6E2',
  coral: '#FF806F',
  gold: '#FFC857',
  sky: '#DFF7FF',
  surface: '#FFFFFF',
  background: '#F7F5FF',
  border: '#DED8F2',
  danger: '#D94D62',
  success: '#218A68',
  shadow: 'rgba(39, 25, 84, 0.16)',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const shadow = {
  shadowColor: colours.ink,
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 7 },
  elevation: 5,
};

