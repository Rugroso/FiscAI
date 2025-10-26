import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface GrowthPotentialProps {
  multiplier: number; // e.g., 1.0, 1.1, 1.5, 2.0
  size?: number; // default 200
  strokeWidth?: number; // default 12
  showAnnualLabel?: boolean; // default true
}

export const GrowthPotential: React.FC<GrowthPotentialProps> = ({
  multiplier,
  size = 200,
  strokeWidth = 12,
  showAnnualLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2.5;
  const circumference = 2 * Math.PI * radius;
  
  // Normalizar el multiplicador a un rango de 0-100 para el círculo
  // Asumiendo que x1 = 0%, x1.5 = 50%, x2 = 100%
  const normalizedMultiplier = Math.min(Math.max(multiplier, 1), 3); // Limitar entre 1 y 3
  const progress = ((normalizedMultiplier - 1) / 2) * 100; // Mapear de 1-3 a 0-100
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Determinar color basado en el multiplicador
  const getGradientColors = () => {
    if (multiplier >= 2.0) {
      return { start: "#10B981", middle: "#34D399", end: "#6EE7B7" }; // Verde brillante
    } else if (multiplier >= 1.5) {
      return { start: "#3B82F6", middle: "#60A5FA", end: "#93C5FD" }; // Azul
    } else if (multiplier >= 1.2) {
      return { start: "#8B5CF6", middle: "#A78BFA", end: "#C4B5FD" }; // Púrpura
    } else {
      return { start: "#06B6D4", middle: "#22D3EE", end: "#67E8F9" }; // Cyan
    }
  };

  const colors = getGradientColors();

  // Calcular el crecimiento anual en porcentaje
  const annualGrowthPercentage = ((multiplier - 1) * 100).toFixed(1);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="growthGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.start} />
            <Stop offset="50%" stopColor={colors.middle} />
            <Stop offset="100%" stopColor={colors.end} />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#growthGradient)"
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
          <Text style={styles.multiplierText}>x{multiplier.toFixed(1)}</Text>
          <Text style={styles.labelText}>CRECIMIENTO</Text>
          {showAnnualLabel && (
            <View style={styles.annualContainer}>
              <Text style={styles.annualText}>
                +{annualGrowthPercentage}% anual
              </Text>
            </View>
          )}
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
  multiplierText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#1F2937",
  },
  labelText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  annualContainer: {
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  annualText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "700",
  },
});
