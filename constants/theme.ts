import { Platform } from 'react-native';

export const colors = {
  bg: '#F4F6F9',
  card: '#FFFFFF',
  fg: '#1A2332',
  muted: '#7A8BA3',
  border: '#E2E8F0',
  inputBg: '#F8FAFC',

  accent: '#0D9488',
  accentDark: '#0F766E',
  accentLight: '#CCFBF1',
  accentMuted: 'rgba(13,148,136,0.12)',

  error: '#DC2626',
  errorBg: '#FEF2F2',
  success: '#10B981',
  successBg: '#ECFDF5',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// Native shadows (iOS/Android) — these are the real RN shadow props
const nativeShadow = {
  sm: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accent: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
};

// Web shadows — plain CSS boxShadow string
const webShadow = {
  sm: { boxShadow: '0 1px 3px rgba(26,35,50,0.04)' },
  md: { boxShadow: '0 4px 12px rgba(26,35,50,0.06)' },
  accent: { boxShadow: '0 6px 20px rgba(13,148,136,0.25)' },
};

// Automatically pick the right one
export const shadows = Platform.OS === 'web' ? webShadow : nativeShadow;