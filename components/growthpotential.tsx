import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "@/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface GrowthMetrics {
  profit_margin_pct: number;
  debt_ratio_pct: number;
  digitalization_pct: number;
  monthly_savings: number;
  roi_potential: number;
}

interface InputSummary {
  monthly_income: string;
  net_profit: string;
  employees: number;
  business_age: string;
}

interface GrowthPrediction {
  predicted_growth: number;
  predicted_growth_percentage: number;
  growth_level: string;
  growth_color: string;
  interpretation: string;
  recommendations: string[];
  metrics: GrowthMetrics;
  timeframe: string;
  model_version: string;
  input_summary: InputSummary;
}

interface BusinessData {
  monthly_income: number | null;
  monthly_expenses: number | null;
  net_profit: number | null;
  profit_margin: number | null;
  cash_flow: number | null;
  debt_ratio: number | null;
  business_age_years: number | null;
  employees: number | null;
  digitalization_score: number | null;
  access_to_credit: boolean;
}

interface GrowthPotentialProps {
  userId: string;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
}

export const GrowthPotential: React.FC<GrowthPotentialProps> = ({
  userId,
  size = 200,
  strokeWidth = 12,
  showDetails = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<GrowthPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadGrowthPrediction();
  }, [userId]);

  const generateDataHash = (businessData: BusinessData): string => {
    return JSON.stringify(businessData);
  };

  const loadGrowthPrediction = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        setError("Usuario no autenticado");
        return;
      }

      const cachedData = await AsyncStorage.getItem(`growth_${userId}`);
      const cachedHash = await AsyncStorage.getItem(`growth_hash_${userId}`);

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('monthly_income, monthly_expenses, net_profit, profit_margin, cash_flow, debt_ratio, business_age_years, employees, digitalization_score, access_to_credit')
        .eq('user_id', userId)
        .single();

      if (businessError || !businessData) {
        console.error('❌ Error obteniendo datos del negocio:', businessError);
        setError("No se encontraron datos del negocio");
        return;
      }

      const currentHash = generateDataHash(businessData);

      if (cachedData && cachedHash === currentHash) {
        console.log('📦 Cargando predicción desde cache');
        const parsedData = JSON.parse(cachedData);
        setPrediction(parsedData);
        setIsFromCache(true);
      } else {
        console.log('🔄 Datos actualizados, obteniendo nueva predicción');
        setIsFromCache(false);
        await fetchGrowthPrediction(businessData, currentHash);
      }
    } catch (err) {
      console.error("❌ Error en loadGrowthPrediction:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGrowthPrediction();
    setIsRefreshing(false);
  };

  const fetchGrowthPrediction = async (existingBusinessData?: BusinessData, existingHash?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        setError("Usuario no autenticado");
        return;
      }

      let businessData: BusinessData | null = existingBusinessData || null;
      let currentHash = existingHash;

      if (!businessData) {
        const { data: fetchedData, error: businessError } = await supabase
          .from('businesses')
          .select('monthly_income, monthly_expenses, net_profit, profit_margin, cash_flow, debt_ratio, business_age_years, employees, digitalization_score, access_to_credit')
          .eq('user_id', userId)
          .single();

        if (businessError || !fetchedData) {
          console.error('❌ Error obteniendo datos del negocio:', businessError);
          setError("No se encontraron datos del negocio");
          return;
        }

        businessData = fetchedData;
        currentHash = generateDataHash(fetchedData);
      }

      if (!businessData) {
        setError("No se encontraron datos del negocio");
        return;
      }

      // Validar que tengamos datos mínimos requeridos
      if (
        businessData.monthly_income === null ||
        businessData.monthly_expenses === null ||
        businessData.net_profit === null
      ) {
        setError("Faltan datos financieros básicos del negocio");
        Alert.alert(
          "Datos Incompletos",
          "Completa la información financiera de tu negocio para ver la predicción de crecimiento",
        );
        return;
      }

      const requestData = {
        monthly_income: businessData.monthly_income,
        monthly_expenses: businessData.monthly_expenses,
        net_profit: businessData.net_profit,
        profit_margin: businessData.profit_margin || 0,
        cash_flow: businessData.cash_flow || 0,
        debt_ratio: businessData.debt_ratio || 0,
        business_age_years: businessData.business_age_years || 0,
        employees: businessData.employees || 0,
        digitalization_score: businessData.digitalization_score || 0,
        access_to_credit: businessData.access_to_credit || false,
      };

      console.log('🚀 Enviando petición al endpoint de crecimiento:', requestData);

      const response = await fetch(
        "https://d8pgui6dhb.execute-api.us-east-2.amazonaws.com/growth",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener la predicción de crecimiento");
      }

      const result: GrowthPrediction = await response.json();

      setPrediction(result);
      console.log('✅ Predicción procesada y estado actualizado');

      // Guardar en cache con el hash
      try {
        await AsyncStorage.setItem(`growth_${userId}`, JSON.stringify(result));
        if (currentHash) {
          await AsyncStorage.setItem(`growth_hash_${userId}`, currentHash);
        }
        console.log('💾 Predicción guardada en cache');
        setIsFromCache(false);
      } catch (cacheError) {
        console.warn('⚠️ Error guardando en cache:', cacheError);
      }

    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      Alert.alert("Error", "No se pudo obtener la predicción de crecimiento");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { height: size + 200 }]}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Analizando potencial de crecimiento...</Text>
      </View>
    );
  }

  if (error || !prediction) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error || "Error al cargar predicción"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadGrowthPrediction()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const multiplier = prediction.predicted_growth;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const normalizedMultiplier = Math.min(Math.max(multiplier, 1), 3);
  const progress = ((normalizedMultiplier - 1) / 2) * 100;
  const strokeDashoffset = circumference * (1 - progress / 100);

  // Determinar colores basados en el color del modelo
  const getGradientColors = () => {
    switch (prediction.growth_color) {
      case "green":
        return { start: "#10B981", middle: "#34D399", end: "#6EE7B7" };
      case "blue":
        return { start: "#3B82F6", middle: "#60A5FA", end: "#93C5FD" };
      case "yellow":
        return { start: "#F59E0B", middle: "#FBBF24", end: "#FCD34D" };
      case "red":
        return { start: "#EF4444", middle: "#F87171", end: "#FCA5A5" };
      default:
        return { start: "#06B6D4", middle: "#22D3EE", end: "#67E8F9" };
    }
  };

  const colors = getGradientColors();

  return (
    <View style={styles.container}>

      {/* Gráfico circular */}
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="growthGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={colors.start} />
              <Stop offset="50%" stopColor={colors.middle} />
              <Stop offset="100%" stopColor={colors.end} />
            </LinearGradient>
          </Defs>

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />

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

        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.centerContent}>
            <Text style={styles.multiplierText}>x{multiplier.toFixed(1)}</Text>
            <Text style={styles.labelText}>CRECIMIENTO</Text>
            <View style={styles.annualContainer}>
              <Text style={[styles.annualText, { color: colors.start }]}>
                +{prediction.predicted_growth_percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {showDetails && (
        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
          {/* Nivel de crecimiento */}
          <View style={[styles.levelCard, { borderLeftColor: colors.start }]}>
            <Text style={styles.levelTitle}>
              {prediction.predicted_growth > 1.15 ? "Excelente" : "Bueno"}
            </Text>
            <Text style={styles.levelSubtitle}>{prediction.interpretation}</Text>
            <Text style={styles.timeframeText}>Proyección: {prediction.timeframe}</Text>
          </View>

          {/* Métricas */}
          <View style={styles.metricsCard}>
            <Text style={styles.sectionTitle}>Métricas Clave</Text>
            
            <View style={styles.metricRow}>
              <MaterialCommunityIcons name="percent" size={20} color="#10B981" />
              <Text style={styles.metricLabel}>Margen de Utilidad</Text>
              <Text style={styles.metricValue}>{prediction.metrics.profit_margin_pct}%</Text>
            </View>

            <View style={styles.metricRow}>
              <MaterialCommunityIcons name="bank" size={20} color="#EF4444" />
              <Text style={styles.metricLabel}>Ratio de Deuda</Text>
              <Text style={styles.metricValue}>{prediction.metrics.debt_ratio_pct}%</Text>
            </View>

            <View style={styles.metricRow}>
              <MaterialCommunityIcons name="monitor-cellphone" size={20} color="#3B82F6" />
              <Text style={styles.metricLabel}>Digitalización</Text>
              <Text style={styles.metricValue}>{prediction.metrics.digitalization_pct}%</Text>
            </View>

            <View style={styles.metricRow}>
              <MaterialCommunityIcons name="piggy-bank" size={20} color="#F59E0B" />
              <Text style={styles.metricLabel}>Ahorro Mensual</Text>
              <Text style={styles.metricValue}>
                ${prediction.metrics.monthly_savings.toLocaleString('es-MX')}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <MaterialCommunityIcons name="trending-up" size={20} color="#8B5CF6" />
              <Text style={styles.metricLabel}>ROI Potencial</Text>
              <Text style={styles.metricValue}>{prediction.metrics.roi_potential.toFixed(1)}%</Text>
            </View>
          </View>

          {/* Recomendaciones */}
          <View style={styles.recommendationsCard}>
            <Text style={styles.sectionTitle}>Recomendaciones</Text>
            {prediction.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Resumen de entrada */}
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Datos Considerados</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ingresos mensuales:</Text>
              <Text style={styles.summaryValue}>{prediction.input_summary.monthly_income}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Utilidad neta:</Text>
              <Text style={styles.summaryValue}>{prediction.input_summary.net_profit}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Empleados:</Text>
              <Text style={styles.summaryValue}>{prediction.input_summary.employees}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Antigüedad:</Text>
              <Text style={styles.summaryValue}>{prediction.input_summary.business_age}</Text>
            </View>
          </View>

          <Text style={styles.versionText}>Modelo v{prediction.model_version}</Text>
        </ScrollView>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#000000",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cacheIndicator: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  cacheText: {
    fontSize: 12,
    color: "#1976D2",
    marginLeft: 6,
    marginRight: 8,
    fontWeight: "500",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  multiplierText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1F2937",
  },
  labelText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  annualContainer: {
    marginTop: 10,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  annualText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsContainer: {
    marginTop: 20,
  },
  levelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 6,
  },
  levelSubtitle: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 8,
  },
  timeframeText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  metricsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  metricLabel: {
    flex: 1,
    fontSize: 14,
    color: "#666666",
    marginLeft: 10,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  recommendationsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
  },
  versionText: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
});
