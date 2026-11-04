import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isSameDay, monthYear } from '@/src/core/date-labels';
import { colors, gradient } from '@/src/core/theme/colors';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export interface DayMarkers {
  hasEvent: boolean;
  hasDeadline: boolean;
}

export function MonthCalendar({
  month,
  selectedDay,
  markersFor,
  onDaySelected,
  onPreviousMonth,
  onNextMonth,
}: {
  month: Date;
  selectedDay: Date;
  markersFor: (day: Date) => DayMarkers;
  onDaySelected: (day: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const today = new Date();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={onPreviousMonth} style={styles.arrow}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textSoft} />
        </Pressable>
        <Text style={styles.monthText}>{monthYear(month)}</Text>
        <Pressable onPress={onNextMonth} style={styles.arrow}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSoft} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={`${day}-${index}`} style={styles.weekCell}>
            <Text style={styles.weekText}>{day}</Text>
          </View>
        ))}
      </View>

      {Array.from({ length: cells / 7 }, (_, row) => (
        <View key={row} style={styles.weekRow}>
          {Array.from({ length: 7 }, (_, column) => {
            const index = row * 7 + column;
            const dayNumber = index - firstWeekday + 1;
            if (dayNumber < 1 || dayNumber > daysInMonth) {
              return <View key={column} style={styles.dayCell} />;
            }
            const day = new Date(year, monthIndex, dayNumber);
            const selected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, today);
            const markers = markersFor(day);
            return (
              <Pressable
                key={column}
                style={styles.dayCell}
                onPress={() => onDaySelected(day)}
              >
                {selected ? (
                  <LinearGradient
                    colors={[...gradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dayCircle}
                  >
                    <Text style={[styles.dayText, { color: colors.white, fontWeight: '800' }]}>
                      {dayNumber}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && { borderWidth: 1.5, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && { color: colors.primary, fontWeight: '800' },
                      ]}
                    >
                      {dayNumber}
                    </Text>
                  </View>
                )}
                <View style={styles.markers}>
                  {markers.hasEvent ? <View style={styles.dotEvent} /> : null}
                  {markers.hasEvent && markers.hasDeadline ? (
                    <View style={{ width: 3 }} />
                  ) : null}
                  {markers.hasDeadline ? <View style={styles.dotDeadline} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <Legend color={colors.primary} label="Fecha importante" />
        <Legend color="#5C5C5C" label="Deadline de tarea" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: colors.textSoft,
  },
  weekRow: { flexDirection: 'row', marginTop: 6 },
  weekCell: { flex: 1, alignItems: 'center' },
  weekText: { fontSize: 12, fontWeight: '700', color: '#BDBDBD' },
  dayCell: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 13.5, fontWeight: '500', color: colors.textSoft },
  markers: { flexDirection: 'row', height: 5, alignItems: 'center', marginTop: 3 },
  dotEvent: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
  dotDeadline: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#5C5C5C' },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legendText: { fontSize: 11.5, color: colors.subtle },
});
