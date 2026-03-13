import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '../utils/ThemeContext';
import { COLORS, globalStyles } from '../utils/theme';
import { sesionService } from '../services/sesionService';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48 - 6 * 6) / 7);

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export const CalendarioScreen = () => {
  const { colors } = useColors();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const dias = await sesionService.getCalendario(year, month);
      if (!cancelled) {
        setWorkoutDays(dias);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);

  const isToday = (day: number): boolean =>
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear();

  const isWorkoutDay = (day: number): boolean => workoutDays.includes(day);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goToPrevMonth} activeOpacity={0.85} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {MONTH_NAMES[month - 1]} {year}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} activeOpacity={0.85} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.dayHeaderRow}>
          {DAY_HEADERS.map(label => (
            <View key={label} style={styles.dayHeaderCell}>
              <Text style={[styles.dayHeaderText, { color: colors.textMuted }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.weekRow}>
              {row.map((day, colIdx) => {
                if (day === null) {
                  return <View key={`empty-${colIdx}`} style={styles.dayCell} />;
                }
                const workout = isWorkoutDay(day);
                const todayFlag = isToday(day);
                return (
                  <View
                    key={day}
                    style={[
                      styles.dayCell,
                      workout && { backgroundColor: colors.accent, borderRadius: CELL_SIZE / 2 },
                      todayFlag && !workout && {
                        borderWidth: 3,
                        borderColor: colors.accent,
                        borderRadius: CELL_SIZE / 2,
                      },
                      todayFlag && workout && {
                        borderWidth: 3,
                        borderColor: colors.text,
                        borderRadius: CELL_SIZE / 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.text },
                        workout && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))
        )}

        <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Ionicons name="flame-outline" size={22} color={colors.accent} />
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {workoutDays.length} {workoutDays.length === 1 ? 'entrenamiento' : 'entrenamientos'} este mes
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Menlo',
  },
  loadingContainer: {
    height: CELL_SIZE * 6 + 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    borderRadius: 40,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Menlo',
  },
});
