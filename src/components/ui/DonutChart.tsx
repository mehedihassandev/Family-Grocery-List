import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useAppTheme } from "../../hooks/useAppTheme";

interface IChartData {
  value: number;
  color: string;
}

interface IDonutChartProps {
  data: IChartData[];
  total: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Professional Donut Chart using react-native-gifted-charts
 * Why: To provide a high-fidelity, animated, and stable charting experience.
 * Note: Replaces the previous hand-written SVG version to ensure perfect rendering.
 * @param props - Component props including chart data, total value, and size configuration
 */
const DonutChart = ({ data = [], total = 0, size = 120, strokeWidth = 14 }: IDonutChartProps) => {
  const { colors } = useAppTheme();

  // Map our internal format to gifted-charts format
  const chartData = data.map((item) => ({
    value: item.value || 0,
    color: item.color,
    focused: false,
  }));

  const radius = size / 2;
  const innerRadius = radius - strokeWidth;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <PieChart
        donut
        data={chartData}
        radius={radius}
        innerRadius={innerRadius}
        innerCircleColor={colors.bgCanvas}
        centerLabelComponent={() => {
          return (
            <View style={styles.labelContainer}>
              <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{total}</Text>
              <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL</Text>
            </View>
          );
        }}
        showGradient={false}
        focusOnPress={false}
        sectionAutoFocus={false}
        animationDuration={1000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "DMSans_700Bold",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: -2,
    fontFamily: "DMSans_700Bold",
  },
});

export default DonutChart;
