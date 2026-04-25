import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { G, Circle } from "react-native-svg";

interface ChartData {
  value: number;
  color: string;
}

interface DonutChartProps {
  data: ChartData[];
  total: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Simple Donut Chart using SVG
 * Why: To visualize item distribution (completed/pending/urgent) as seen in the design screenshots.
 */
const DonutChart = ({
  data,
  total,
  size = 120,
  strokeWidth = 12,
}: DonutChartProps) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F0F2F5"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Data segments */}
          {data.map((item, index) => {
            // Safety: ignore zero or negative values
            if (item.value <= 0 || total <= 0) {
              currentOffset += Math.max(0, item.value);
              return null;
            }

            const percentage = (item.value / total) * 100;
            const strokeDashoffset = circumference - (circumference * percentage) / 100;
            const rotation = (currentOffset / total) * 360;
            currentOffset += item.value;

            return (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                rotation={rotation}
                originX={center}
                originY={center}
              />
            );
          })}
        </G>
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={styles.totalValue}>{total || 0}</Text>
        <Text style={styles.totalLabel}>TOTAL</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0D1117",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9AA3AF",
    letterSpacing: 1,
    marginTop: -2,
  },
});

export default DonutChart;
