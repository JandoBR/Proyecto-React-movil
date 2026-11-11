import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { dateOnly, relativeDate, shortDate } from '@/src/core/date-labels';
import { colors } from '@/src/core/theme/colors';
import { MonthCalendar } from './month-calendar';

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Campo de fecha. Abre el calendario de la app centrado en la pantalla, igual
 * en Android, iOS y web, en vez del selector del sistema (que en web no existe
 * y dentro de una hoja inferior quedaba fuera de la pantalla).
 */
export function DateField({
  label,
  value,
  onChange,
  allowClear = false,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => firstOfMonth(value ?? new Date()));

  const openPicker = () => {
    setMonth(firstOfMonth(value ?? new Date()));
    setOpen(true);
  };

  const pick = (date: Date | null) => {
    onChange(date ? dateOnly(date) : null);
    setOpen(false);
  };

  const shiftMonth = (delta: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <View>
      <Pressable onPress={openPicker} style={styles.field} testID="date-field">
        <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={value ? styles.value : styles.placeholder}>
            {value
              ? `${shortDate(value)} ${value.getFullYear()} · ${relativeDate(value)}`
              : 'Sin fecha'}
          </Text>
        </View>
        {allowClear && value ? (
          <Pressable hitSlop={8} onPress={() => onChange(null)}>
            <MaterialCommunityIcons name="close" size={18} color={colors.subtle} />
          </Pressable>
        ) : (
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.subtle} />
        )}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{label}</Text>
            <MonthCalendar
              month={month}
              selectedDay={value}
              onDaySelected={pick}
              onPreviousMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
            />
            <View style={styles.actions}>
              <Pressable onPress={() => pick(new Date())} style={styles.action}>
                <Text style={styles.actionPrimary}>Hoy</Text>
              </Pressable>
              {allowClear && value ? (
                <Pressable onPress={() => pick(null)} style={styles.action}>
                  <Text style={styles.actionMuted}>Quitar fecha</Text>
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setOpen(false)} style={styles.action}>
                <Text style={styles.actionMuted}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.inputFill,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: { fontSize: 12, color: colors.muted },
  value: { fontSize: 14, color: colors.textSoft, marginTop: 1 },
  placeholder: { fontSize: 14, color: colors.subtle, marginTop: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(15,42,74,0.4)',
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dialogTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingTop: 4,
  },
  action: { paddingHorizontal: 12, paddingVertical: 10 },
  actionPrimary: { fontSize: 14, fontWeight: '700', color: colors.primary },
  actionMuted: { fontSize: 14, fontWeight: '600', color: colors.muted },
});
