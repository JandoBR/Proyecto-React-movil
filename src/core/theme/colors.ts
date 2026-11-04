export const colors = {
  cream: '#F8F2EC',
  primary: '#FF7043',
  primaryDark: '#F0552F',
  gradientStart: '#FFA741',
  gradientEnd: '#FF5252',
  text: '#1E1E1E',
  textSoft: '#2B2B2B',
  body: '#4A4A4A',
  muted: '#757575',
  subtle: '#9E9E9E',
  border: '#E0D8CF',
  white: '#FFFFFF',
  inputFill: '#FAFAFA',
  green: '#2E9E5B',
  greenBg: '#E3F5EA',
  amber: '#C98A2B',
  amberBg: '#FDF1DC',
  red: '#D45A5A',
  redBg: '#FBE4E4',
  danger: '#D32F2F',
  chipBg: '#F4EFEA',
  avatarBg: '#EADFD6',
};

export const gradient = [colors.gradientStart, colors.gradientEnd] as const;

export const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};
