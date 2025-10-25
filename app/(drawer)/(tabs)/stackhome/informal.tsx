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

interface ProfileData {
  actividad: string;
  ingresos_anuales: number;
  empleados: number;
  metodos_pago: string[];
  estado: string;
  has_rfc: boolean;
  has_efirma: boolean;
  emite_cfdi: boolean;
  declara_mensual: boolean;
}

interface RiskData {
  score: number;
  level: string;
  message: string;
  details: {
    has_rfc: boolean;
    has_efirma: boolean;
    emite_cfdi: boolean;
    declara_mensual: boolean;
  };
}

interface SourceData {
  title: string;
  scope: string;
  url: string;
  similarity: number;
}

interface ApiResponse {
  success: boolean;
  profile: ProfileData;
  risk: RiskData;
  recommendation: string;
  sources: SourceData[];
  matches_count: number;
  timestamp: string;
}

export default function InformalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendation();
  }, []);

  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Datos de ejemplo - En producción, estos vendrían de un formulario o del contexto del usuario
      const profileData = {
        profile: {
          actividad: "Diseñador gráfico freelance",
          ingresos_anuales: 450000,
          empleados: 0,
          metodos_pago: ["transferencia", "efectivo"],
          estado: "Ciudad de México",
          has_rfc: true,
          has_efirma: true,
          emite_cfdi: true,
          declara_mensual: true,
        },
      };

      const response = await fetch(
        "https://d8pgui6dhb.execute-api.us-east-2.amazonaws.com/recommendation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener la recomendación");
      }

      const result: ApiResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      Alert.alert("Error", "No se pudo obtener la recomendación fiscal");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "verde":
        return "#4CAF50";
      case "amarillo":
        return "#FFD700";
      case "rojo":
        return "#FF0000";
      default:
        return "#999999";
    }
  };

  const openUrl = async (url: string) => {
    if (url === "Libro" || !url || url.startsWith("file:///")) {
      Alert.alert("Información", "Esta fuente proviene de un libro de referencia fiscal");
      return;
    }

    try {
      // Limpiar la URL de caracteres extra
      const cleanUrl = url.trim().replace(/[\[\]]/g, "");
      const canOpen = await Linking.canOpenURL(cleanUrl);
      if (canOpen) {
        await Linking.openURL(cleanUrl);
      } else {
        Alert.alert("Error", "No se puede abrir este enlace");
      }
    } catch (error) {
      console.error("Error abriendo URL:", error);
      Alert.alert("Error", "No se pudo abrir el enlace");
    }
  };

  const extractRegimen = (text: string): string | null => {
    // Buscar el régimen fiscal en la recomendación
    const regimenMatch = text.match(/el régimen fiscal más adecuado[^:]*:\s*\*\*([^*]+)\*\*/i);
    if (regimenMatch) {
      return regimenMatch[1].trim();
    }
    return null;
  };

  const renderFormattedText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // Dividir el texto por líneas
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (line.trim() === '') {
        parts.push(<View key={`space-${key++}`} style={{ height: 8 }} />);
        return;
      }

      // Procesar cada línea para encontrar texto en negrita y cursiva
      const segments: React.ReactNode[] = [];
      let currentText = line;
      let segmentKey = 0;

      while (currentText.length > 0) {
        // Buscar texto en negrita (**texto**)
        const boldMatch = currentText.match(/^(.*?)\*\*([^*]+)\*\*/);
        if (boldMatch) {
          if (boldMatch[1]) {
            segments.push(
              <Text key={`seg-${segmentKey++}`} style={styles.recommendationText}>
                {boldMatch[1]}
              </Text>
            );
          }
          segments.push(
            <Text key={`seg-${segmentKey++}`} style={[styles.recommendationText, styles.boldText]}>
              {boldMatch[2]}
            </Text>
          );
          currentText = currentText.substring(boldMatch[0].length);
          continue;
        }

        // Buscar texto en cursiva (*texto*)
        const italicMatch = currentText.match(/^(.*?)\*([^*]+)\*/);
        if (italicMatch) {
          if (italicMatch[1]) {
            segments.push(
              <Text key={`seg-${segmentKey++}`} style={styles.recommendationText}>
                {italicMatch[1]}
              </Text>
            );
          }
          segments.push(
            <Text key={`seg-${segmentKey++}`} style={[styles.recommendationText, styles.italicText]}>
              {italicMatch[2]}
            </Text>
          );
          currentText = currentText.substring(italicMatch[0].length);
          continue;
        }

        // Si no hay más formato, agregar el resto del texto
        segments.push(
          <Text key={`seg-${segmentKey++}`} style={styles.recommendationText}>
            {currentText}
          </Text>
        );
        break;
      }

      parts.push(
        <Text key={`line-${key++}`} style={{ marginBottom: 4 }}>
          {segments}
        </Text>
      );
    });

    return <View>{parts}</View>;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Analizando tu perfil fiscal...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recomendación Fiscal</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#FF0000" />
          <Text style={styles.errorText}>{error || "Error al cargar datos"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendation}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recomendación Fiscal</Text>
        <TouchableOpacity onPress={fetchRecommendation}>
          <MaterialCommunityIcons name="refresh" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Risk Score Card */}
        <View style={styles.card}>
          <View style={styles.riskHeader}>
            <MaterialCommunityIcons name="shield-check" size={32} color={getRiskColor(data.risk.level)} />
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>Nivel de Riesgo</Text>
              <View style={styles.riskBadge}>
                <View style={[styles.riskDot, { backgroundColor: getRiskColor(data.risk.level) }]} />
                <Text style={[styles.riskLevel, { color: getRiskColor(data.risk.level) }]}>{data.risk.level}</Text>
              </View>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreNumber}>{data.risk.score}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>
          <Text style={styles.riskMessage}>{data.risk.message}</Text>

          {/* Risk Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Estado de Cumplimiento:</Text>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={data.risk.details.has_rfc ? "check-circle" : "close-circle"}
                size={20}
                color={data.risk.details.has_rfc ? "#4CAF50" : "#FF0000"}
              />
              <Text style={styles.detailText}>RFC Registrado</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={data.risk.details.has_efirma ? "check-circle" : "close-circle"}
                size={20}
                color={data.risk.details.has_efirma ? "#4CAF50" : "#FF0000"}
              />
              <Text style={styles.detailText}>e.firma Vigente</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={data.risk.details.emite_cfdi ? "check-circle" : "close-circle"}
                size={20}
                color={data.risk.details.emite_cfdi ? "#4CAF50" : "#FF0000"}
              />
              <Text style={styles.detailText}>Emite CFDI</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={data.risk.details.declara_mensual ? "check-circle" : "close-circle"}
                size={20}
                color={data.risk.details.declara_mensual ? "#4CAF50" : "#FF0000"}
              />
              <Text style={styles.detailText}>Declaración Mensual</Text>
            </View>
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-details" size={24} color="#000000" />
            <Text style={styles.cardTitle}>Tu Perfil Fiscal</Text>
          </View>
          <View style={styles.profileGrid}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Actividad</Text>
              <Text style={styles.profileValue}>{data.profile.actividad}</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Ingresos Anuales</Text>
              <Text style={styles.profileValue}>
                ${data.profile.ingresos_anuales.toLocaleString("es-MX")}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Empleados</Text>
              <Text style={styles.profileValue}>{data.profile.empleados}</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Estado</Text>
              <Text style={styles.profileValue}>{data.profile.estado}</Text>
            </View>
            <View style={styles.profileItemFull}>
              <Text style={styles.profileLabel}>Métodos de Pago</Text>
              <View style={styles.tagsContainer}>
                {data.profile.metodos_pago.map((metodo, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{metodo}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Recommendation Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightbulb" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>Recomendación Personalizada</Text>
          </View>
          
          {/* Régimen Fiscal Destacado */}
          {extractRegimen(data.recommendation) && (
            <View style={styles.regimenContainer}>
              <Text style={styles.regimenLabel}>Régimen Fiscal Recomendado</Text>
              <Text style={styles.regimenValue}>{extractRegimen(data.recommendation)}</Text>
            </View>
          )}
          
          {renderFormattedText(data.recommendation)}
        </View>

        {/* Sources Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color="#000000" />
            <Text style={styles.cardTitle}>Fuentes Consultadas ({data.matches_count})</Text>
          </View>
          {data.sources.map((source, index) => {
            const isValidUrl = source.url !== "Libro" && 
                              !source.url.startsWith("file:///") && 
                              (source.url.startsWith("http://") || source.url.startsWith("https://"));
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.sourceItem}
                onPress={() => openUrl(source.url)}
                disabled={!isValidUrl}
              >
                <View style={styles.sourceIcon}>
                  <MaterialCommunityIcons
                    name={isValidUrl ? "web" : "book"}
                    size={20}
                    color="#000000"
                  />
                </View>
                <View style={styles.sourceContent}>
                  <Text style={styles.sourceTitle} numberOfLines={2}>
                    {source.title}
                  </Text>
                  <Text style={styles.sourceScope}>{source.scope}</Text>
                  <View style={styles.sourceFooter}>
                    <View style={styles.similarityBadge}>
                      <Text style={styles.similarityText}>
                        {(source.similarity * 100).toFixed(0)}% relevancia
                      </Text>
                    </View>
                    {isValidUrl && (
                      <MaterialIcons name="open-in-new" size={16} color="#999999" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Timestamp */}
        <View style={styles.timestampContainer}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#999999" />
          <Text style={styles.timestampText}>
            Actualizado: {new Date(data.timestamp).toLocaleString("es-MX")}
          </Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
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
    backgroundColor: "#000000",
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
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  riskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riskTitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#666666",
  },
  riskMessage: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 16,
    fontWeight: "500",
  },
  detailsContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
  profileGrid: {
    gap: 12,
  },
  profileItem: {
    marginBottom: 8,
  },
  profileItemFull: {
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  recommendationText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "bold",
    color: "#000000",
  },
  italicText: {
    fontStyle: "italic",
    color: "#666666",
  },
  regimenContainer: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  regimenLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  regimenValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  sourceItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    marginBottom: 8,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sourceContent: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  sourceScope: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  sourceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  similarityBadge: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  similarityText: {
    fontSize: 11,
    color: "#666666",
    fontWeight: "500",
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
