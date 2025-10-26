import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface RiskMeterProps {
  score: number; // 0–100
  size?: number; // default 200
  strokeWidth?: number; // default 15
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  size = 200,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 3;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size - 50, height: size - 50, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="green" />
            <Stop offset="50%" stopColor="yellow" />
            <Stop offset="100%" stopColor="red" />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#222"
          strokeWidth={strokeWidth}
          opacity={0.3}
          fill="none"
        />

        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
          fill="none"
        />
      </Svg>

      {/* Center text */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.centerContent}>
          <Text style={styles.scoreText}>{Math.round(score)}</Text>
          <Text style={styles.labelText}>RIESGO</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000000ff",
  },
  labelText: {
    fontSize: 12,
    color: "#aaa",
    marginTop: -4,
    letterSpacing: 1,
  },
});
