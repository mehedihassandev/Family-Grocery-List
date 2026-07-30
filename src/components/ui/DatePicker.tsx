import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from "react-native";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useAppTheme } from "../../hooks";
import { formatDateToYYYYMMDD, formatDisplayDate } from "../../utils/date";

export { formatDateToYYYYMMDD, formatDisplayDate };

export interface IDatePickerProps {
  label?: string;
  value?: string | Date | null;
  onChange: (dateString: string) => void;
  placeholder?: string;
  error?: string;
  containerClassName?: string;
  allowClear?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DatePicker: React.FC<IDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  error,
  containerClassName,
  allowClear = true,
}) => {
  const { colors } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Format incoming value as standard string YYYY-MM-DD
  const valueString = useMemo(() => {
    if (!value) return "";
    if (value instanceof Date) return formatDateToYYYYMMDD(value);
    if (typeof value === "string") return value.trim();
    return "";
  }, [value]);

  // Selected date state for the modal
  const selectedDate = useMemo(() => {
    if (!valueString) return null;
    const parts = valueString.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const parsed = new Date(y, m, d);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }, [valueString]);

  // Current viewing year & month for modal grid
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());

  const handleOpenModal = () => {
    setViewDate(selectedDate || new Date());
    setModalVisible(true);
  };

  const handleSelectDay = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const newDate = new Date(year, month, day);
    const dateStr = formatDateToYYYYMMDD(newDate);
    onChange(dateStr);
    setModalVisible(false);
  };

  const handlePreset = (preset: "today" | "tomorrow" | "nextWeek") => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (preset === "tomorrow") {
      target.setDate(target.getDate() + 1);
    } else if (preset === "nextWeek") {
      target.setDate(target.getDate() + 7);
    }
    onChange(formatDateToYYYYMMDD(target));
    setModalVisible(false);
  };

  const handleClear = () => {
    onChange("");
    setModalVisible(false);
  };

  // Month navigation
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Generate days matrix for viewDate
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: ({ day: number; isCurrentMonth: boolean } | null)[] = [];

    // Empty slots before 1st of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true });
    }

    return days;
  }, [viewDate]);

  const todayStr = useMemo(() => formatDateToYYYYMMDD(new Date()), []);

  const monthYearLabel = useMemo(() => {
    return viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [viewDate]);

  const displayString = formatDisplayDate(valueString) || valueString;

  return (
    <View className={`w-full ${containerClassName ?? ""}`}>
      {label ? (
        <Text
          className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ color: colors.textMuted }}
        >
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleOpenModal}
        className="flex-row items-center rounded-xl border px-4"
        style={{
          height: 52,
          backgroundColor: error ? colors.dangerLight : colors.bgInput,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: 16,
        }}
      >
        <Calendar size={18} color={colors.icon} />

        <Text
          className="flex-1 ml-2.5 text-[15px] font-medium"
          style={{
            color: displayString ? colors.textPrimary : colors.iconMuted,
          }}
          numberOfLines={1}
        >
          {displayString || placeholder}
        </Text>

        {allowClear && !!valueString && (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleClear}
            className="p-1"
          >
            <X size={16} color={colors.iconMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error ? (
        <Text className="mt-1.5 ml-1 text-[12px] font-bold" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}

      {/* Date Picker Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlayBg }]}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View className="flex-row items-center gap-2">
                <Calendar size={20} color={colors.accent} />
                <Text className="text-[17px] font-bold" style={{ color: colors.textPrimary }}>
                  {label ? `Select ${label}` : "Select Date"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="p-1 rounded-full"
                style={{ backgroundColor: colors.bgInput }}
              >
                <X size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View className="flex-row gap-2 mb-4 px-1">
              <TouchableOpacity
                onPress={() => handlePreset("today")}
                className="flex-1 py-2 px-3 rounded-lg items-center"
                style={{ backgroundColor: colors.bgInput }}
              >
                <Text className="text-[12px] font-bold" style={{ color: colors.accent }}>
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePreset("tomorrow")}
                className="flex-1 py-2 px-3 rounded-lg items-center"
                style={{ backgroundColor: colors.bgInput }}
              >
                <Text className="text-[12px] font-bold" style={{ color: colors.textPrimary }}>
                  Tomorrow
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePreset("nextWeek")}
                className="flex-1 py-2 px-3 rounded-lg items-center"
                style={{ backgroundColor: colors.bgInput }}
              >
                <Text className="text-[12px] font-bold" style={{ color: colors.textPrimary }}>
                  Next Week
                </Text>
              </TouchableOpacity>

              {allowClear && !!valueString && (
                <TouchableOpacity
                  onPress={handleClear}
                  className="py-2 px-3 rounded-lg items-center"
                  style={{ backgroundColor: colors.dangerLight }}
                >
                  <Text className="text-[12px] font-bold" style={{ color: colors.danger }}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Month & Year Navigation Header */}
            <View style={styles.monthHeader}>
              <TouchableOpacity
                onPress={prevMonth}
                className="p-2 rounded-lg"
                style={{ backgroundColor: colors.bgInput }}
              >
                <ChevronLeft size={20} color={colors.icon} />
              </TouchableOpacity>

              <Text className="text-[16px] font-bold" style={{ color: colors.textPrimary }}>
                {monthYearLabel}
              </Text>

              <TouchableOpacity
                onPress={nextMonth}
                className="p-2 rounded-lg"
                style={{ backgroundColor: colors.bgInput }}
              >
                <ChevronRight size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((wd) => (
                <Text key={wd} style={[styles.weekdayText, { color: colors.textMuted }]}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((item, index) => {
                if (!item) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const dayDateStr = formatDateToYYYYMMDD(
                  new Date(viewDate.getFullYear(), viewDate.getMonth(), item.day),
                );
                const isSelected = dayDateStr === valueString;
                const isToday = dayDateStr === todayStr;

                return (
                  <TouchableOpacity
                    key={`day-${item.day}`}
                    onPress={() => handleSelectDay(item.day)}
                    style={[
                      styles.dayCell,
                      isSelected && {
                        backgroundColor: colors.accent,
                        borderRadius: 12,
                      },
                      !isSelected &&
                        isToday && {
                          borderColor: colors.accent,
                          borderWidth: 1.5,
                          borderRadius: 12,
                        },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isSelected
                            ? colors.textInverse
                            : isToday
                              ? colors.accent
                              : colors.textPrimary,
                        },
                        isSelected && { fontWeight: "700" },
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Footer / Close */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mt-4 py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.bgInput }}
            >
              <Text className="text-[14px] font-bold" style={{ color: colors.textSecondary }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekdayText: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: "14.28%", // 7 columns
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DatePicker;
