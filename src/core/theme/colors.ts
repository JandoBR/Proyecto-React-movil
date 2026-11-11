export const colors = {
  // Fondo de las pantallas: blanco con un toque frío para separar las tarjetas.
  cream: '#F5F8FC',
  primary: '#2675C8',
  primaryDark: '#1B5EA8',
  // Fondo y borde suaves para lo seleccionado o destacado en azul.
  primarySoft: '#E8F1FB',
  primaryBorder: '#B7D3F1',
  gradientStart: '#3381D1',
  gradientEnd: '#1B5EA8',
  text: '#1B2430',
  textSoft: '#243042',
  body: '#4A5565',
  muted: '#5F6B7C',
  subtle: '#7F8A9A',
  disabled: '#C2C9D3',
  border: '#E1E7EF',
  divider: '#EDF1F6',
  white: '#FFFFFF',
  inputFill: '#F8FAFC',
  green: '#2E9E5B',
  greenBg: '#E3F5EA',
  amber: '#C98A2B',
  amberBg: '#FDF1DC',
  red: '#D45A5A',
  redBg: '#FBE4E4',
  danger: '#D32F2F',
  chipBg: '#EEF2F7',
  avatarBg: '#DCE7F5',
};

export const gradient = [colors.gradientStart, colors.gradientEnd] as const;

export const cardShadow = {
  shadowColor: '#0F2A4A',
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};
