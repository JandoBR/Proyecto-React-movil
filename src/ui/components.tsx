import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';

import { cardShadow, colors, gradient } from '@/src/core/theme/colors';
import {
  APPLICATION_STATUS_LABEL,
  ApplicationStatus,
  CREATED_PROJECT_STATUS_LABEL,
  CreatedProjectStatus,
} from '@/src/features/project/domain/models';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function BrandLogo({
  avatarUrl,
  onAvatarTap,
}: {
  avatarUrl?: string;
  onAvatarTap?: () => void;
}) {
  return (
    <View style={styles.brandRow}>
      <Text style={styles.brandText}>Nexus</Text>
      <Pressable onPress={onAvatarTap} hitSlop={8}>
        <Avatar uri={avatarUrl} size={44} />
      </Pressable>
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function GradientButton({
  label,
  icon,
  onPress,
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        style,
        { opacity: disabled || loading ? 0.65 : pressed ? 0.9 : 1 },
      ]}
    >
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientButton}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <View style={styles.buttonRow}>
            <Text style={styles.gradientButtonText}>{label}</Text>
            {icon ? (
              <MaterialCommunityIcons
                name={icon}
                size={18}
                color={colors.white}
                style={{ marginLeft: 8 }}
              />
            ) : null}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({
  label,
  icon,
  onPress,
  color = colors.primaryDark,
  disabled = false,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.outlineButton,
        { borderColor: color },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={styles.buttonRow}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={17}
            color={color}
            style={{ marginRight: 6 }}
          />
        ) : null}
        <Text style={[styles.outlineButtonText, { color }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function Avatar({ uri, size = 44 }: { uri?: string | null; size?: number }) {
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.avatarBg }}
      />
    );
  }
  return (
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <MaterialCommunityIcons
        name="account-outline"
        size={size * 0.55}
        color={colors.subtle}
      />
    </View>
  );
}

export function TagChip({
  label,
  accent = false,
}: {
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.tag, accent ? styles.tagAccent : styles.tagNeutral]}>
      <Text style={[styles.tagText, accent && { color: colors.primaryDark }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({
  kind,
  status,
}: {
  kind: 'application';
  status: ApplicationStatus;
} | {
  kind: 'project';
  status: CreatedProjectStatus;
}) {
  const style =
    kind === 'application'
      ? {
          accepted: { fg: colors.green, bg: colors.greenBg },
          underReview: { fg: colors.amber, bg: colors.amberBg },
          rejected: { fg: colors.red, bg: colors.redBg },
        }[status]
      : {
          recruiting: { fg: colors.amber, bg: colors.amberBg },
          active: { fg: colors.green, bg: colors.greenBg },
          completed: { fg: colors.muted, bg: colors.chipBg },
        }[status];
  const label =
    kind === 'application'
      ? APPLICATION_STATUS_LABEL[status]
      : CREATED_PROJECT_STATUS_LABEL[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.fg }]}>{label}</Text>
    </View>
  );
}

export function MatchBadge({ percentage }: { percentage: number }) {
  const high = percentage >= 85;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: high ? colors.greenBg : colors.amberBg },
      ]}
    >
      <Text
        style={[styles.badgeText, { color: high ? colors.green : colors.amber }]}
      >
        {percentage}% Match
      </Text>
    </View>
  );
}

export function SegmentedTabs<T extends string>({
  segments,
  selected,
  onSelect,
}: {
  segments: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {segments.map((segment) => {
        const active = segment.value === selected;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onSelect(segment.value)}
            style={styles.segmentItem}
          >
            {active ? (
              <LinearGradient
                colors={[...gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.segmentActive}
              >
                <Text style={styles.segmentActiveText}>{segment.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.segmentIdle}>
                <Text style={styles.segmentIdleText}>{segment.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon = 'inbox-outline',
  title,
  message,
}: {
  icon?: IconName;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export function AppTextInput({
  label,
  icon,
  style,
  ...props
}: TextInputProps & { label: string; icon?: IconName }) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      style={[{ backgroundColor: colors.inputFill }, style]}
      outlineColor={colors.border}
      activeOutlineColor={colors.primary}
      textColor={colors.text}
      left={
        icon ? (
          <TextInput.Icon icon={() => <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />} />
        ) : undefined
      }
      {...props}
    />
  );
}

export function CircleIconButton({
  icon,
  onPress,
  color = colors.textSoft,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.circleButton} hitSlop={8}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.headerRow}>
      {onBack ? <CircleIconButton icon="arrow-left" onPress={onBack} /> : null}
      <View style={{ flex: 1, marginLeft: onBack ? 14 : 0 }}>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    ...cardShadow,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    color: colors.primaryDark,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.1,
    color: colors.subtle,
    textTransform: 'uppercase',
  },
  gradientButton: {
    height: 54,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: colors.gradientEnd,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  gradientButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  outlineButton: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  outlineButtonText: { fontSize: 14, fontWeight: '700' },
  avatarFallback: {
    backgroundColor: colors.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.2,
  },
  tagNeutral: { backgroundColor: colors.white, borderColor: colors.border },
  tagAccent: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  tagText: { fontSize: 13, fontWeight: '500', color: colors.textSoft },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 30,
    padding: 4,
    ...cardShadow,
  },
  segmentItem: { flex: 1 },
  segmentActive: {
    height: 42,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActiveText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  segmentIdle: { height: 42, alignItems: 'center', justifyContent: 'center' },
  segmentIdleText: { color: colors.textSoft, fontSize: 14, fontWeight: '500' },
  emptyState: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSoft,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.subtle,
    textAlign: 'center',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerSubtitle: { fontSize: 13, color: colors.subtle, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textSoft },
});
