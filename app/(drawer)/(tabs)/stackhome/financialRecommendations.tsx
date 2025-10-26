import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useReload } from "./_layout";
import { url, ENDPOINTS } from "@/api";


type CreditOption = {
  title: string;
  description: string;
  source: string;
  relevance: number;
};

type TaxDeduction = {
  title: string;
  description: string;
  source: string;
  relevance: number;
};

type Recommendation = {
  type: string;
  priority: string;
  title: string;
  description: string;
  action: string;
};

type FinancialHealth = {
  score: number;
  level: string;
  monthly_profit: number;
  profit_margin: number;
  annual_income: number;
};

type Profile = {
  actividad: string;
  monthly_income: number;
  monthly_expenses: number;
  has_rfc: boolean;
  regime: string;
  employees: number;
};

type ApiResponse = {
  financial_health: FinancialHealth;
  credit_options: CreditOption[];
  tax_deductions: TaxDeduction[];
  recommendations: Recommendation[];
  profile: Profile;
};

export default function FinancialRecommendationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { registerReloadHandler, unregisterReloadHandler } = useReload();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecommendations() {
    try {
      setLoading(true);
      setError(null);
      const profileData = {
        actividad: "Restaurante",
        monthly_income: 80000,
        monthly_expenses: 50000,
        has_rfc: true,
        regime: "RESICO",
        employees: 5,
      };
        const response = await fetch(url(ENDPOINTS.financial), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify({
            actividad: "Restaurante",
            ingresos_mensuales: 80000,
            gastos_mensuales: 50000,
            tiene_rfc: true,
            regimen_fiscal: "RESICO",
            num_empleados: 5,
          }),
      });
      if (!response.ok) {
        throw new Error("No se pudo obtener la recomendación financiera");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecommendations();
    registerReloadHandler(fetchRecommendations);
    return () => {
      unregisterReloadHandler();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProductIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "crédito":
      case "credito":
        return "cash-multiple";
      case "servicios":
        return "credit-card-outline";
      case "cuenta":
        return "bank";
      case "seguro":
        return "shield-check";
      default:
        return "briefcase";
    }
  };

  const getProductColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "crédito":
      case "credito":
        return "#4CAF50";
      case "servicios":
        return "#2196F3";
      case "cuenta":
        return "#FF9800";
      case "seguro":
        return "#9C27B0";
      default:
        return "#000000";
    }
  };

  const openUrl = async (url: string) => {
    if (!url) {
      Alert.alert("Información", "Contacta a un ejecutivo de Banorte para más información");
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No se puede abrir este enlace");
      }
    } catch (error) {
      console.error("Error abriendo URL:", error);
      Alert.alert("Error", "No se pudo abrir el enlace");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Obteniendo recomendaciones de Banorte...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#FF0000" />
          <Text style={styles.errorText}>{error || "Error al cargar datos"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendations}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bloque: Salud financiera */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="finance" size={28} color="#4CAF50" />
            <Text style={styles.cardTitle}>Salud financiera</Text>
          </View>
          <Text style={styles.overallMessage}>Nivel: <Text style={{fontWeight:'bold'}}>{data?.financial_health.level}</Text></Text>
          <Text style={styles.overallMessage}>Puntaje: <Text style={{fontWeight:'bold'}}>{data?.financial_health.score}</Text></Text>
          <Text style={styles.overallMessage}>Utilidad mensual: <Text style={{fontWeight:'bold'}}>${data?.financial_health.monthly_profit?.toLocaleString('es-MX')}</Text></Text>
          <Text style={styles.overallMessage}>Margen de ganancia: <Text style={{fontWeight:'bold'}}>{data?.financial_health.profit_margin}%</Text></Text>
          <Text style={styles.overallMessage}>Ingresos anuales: <Text style={{fontWeight:'bold'}}>${data?.financial_health.annual_income?.toLocaleString('es-MX')}</Text></Text>
        </View>

        {/* Bloque: Opciones de crédito */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="credit-card-outline" size={24} color="#2196F3" />
          <Text style={styles.sectionTitle}>Opciones de crédito</Text>
        </View>
        {data?.credit_options.map((option, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.productName}>{option.title}</Text>
            <Text style={styles.productDescription}>{option.description}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(option.source)}>
              <Text style={{color:'#2196F3',marginTop:8}}>Ver fuente</Text>
            </TouchableOpacity>
            <Text style={styles.recommendedForText}>Relevancia: {option.relevance}</Text>
          </View>
        ))}

        {/* Bloque: Deducciones fiscales */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#FF9800" />
          <Text style={styles.sectionTitle}>Deducciones fiscales</Text>
        </View>
        {data?.tax_deductions.map((ded, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.productName}>{ded.title}</Text>
            <Text style={styles.productDescription}>{ded.description}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(ded.source)}>
              <Text style={{color:'#FF9800',marginTop:8}}>Ver fuente</Text>
            </TouchableOpacity>
            <Text style={styles.recommendedForText}>Relevancia: {ded.relevance}</Text>
          </View>
        ))}

        {/* Bloque: Recomendaciones */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#FFD700" />
          <Text style={styles.sectionTitle}>Recomendaciones</Text>
        </View>
        {data?.recommendations.map((rec, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.productName}>{rec.title}</Text>
            <Text style={styles.productDescription}>{rec.description}</Text>
            <Text style={styles.recommendedForText}>Prioridad: {rec.priority}</Text>
            <Text style={styles.recommendedForText}>Acción sugerida: {rec.action}</Text>
          </View>
        ))}

        {/* Bloque: Perfil */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#000000" />
            <Text style={styles.cardTitle}>Perfil</Text>
          </View>
          <Text style={styles.overallMessage}>Actividad: <Text style={{fontWeight:'bold'}}>{data?.profile.actividad}</Text></Text>
          <Text style={styles.overallMessage}>Ingresos mensuales: <Text style={{fontWeight:'bold'}}>${data?.profile.monthly_income?.toLocaleString('es-MX')}</Text></Text>
          <Text style={styles.overallMessage}>Gastos mensuales: <Text style={{fontWeight:'bold'}}>${data?.profile.monthly_expenses?.toLocaleString('es-MX')}</Text></Text>
          <Text style={styles.overallMessage}>RFC: <Text style={{fontWeight:'bold'}}>{data?.profile.has_rfc ? 'Sí' : 'No'}</Text></Text>
          <Text style={styles.overallMessage}>Régimen: <Text style={{fontWeight:'bold'}}>{data?.profile.regime}</Text></Text>
          <Text style={styles.overallMessage}>Empleados: <Text style={{fontWeight:'bold'}}>{data?.profile.employees}</Text></Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FF0000",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  banorteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  banorteInfo: {
    marginLeft: 12,
    flex: 1,
  },
  banorteTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF0000",
  },
  banorteSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  overallMessage: {
    fontSize: 15,
    color: "#333333",
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginLeft: 8,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  productIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  productTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  productTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productTypeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  productDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 16,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingLeft: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF0000",
    marginTop: 7,
    marginRight: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  productDetailsContainer: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 16,
  },
  productDetailItem: {
    flex: 1,
  },
  productDetailLabel: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 4,
  },
  productDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  recommendedForContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendedForText: {
    flex: 1,
    fontSize: 13,
    color: "#666666",
    marginLeft: 8,
    fontStyle: "italic",
  },
  productButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0000",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  productButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    marginLeft: 10,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF0000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
    paddingTop: 4,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  timestampText: {
    fontSize: 12,
    color: "#999999",
    marginLeft: 6,
  },
});
