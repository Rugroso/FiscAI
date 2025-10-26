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

interface BanorteProduct {
  name: string;
  type: string;
  description: string;
  benefits: string[];
  requirements: string[];
  recommended_for: string;
  interest_rate?: string;
  credit_limit?: string;
  url?: string;
}

interface FinancialRecommendation {
  overall_message: string;
  products: BanorteProduct[];
  additional_benefits: string[];
  next_steps: string[];
}

interface ApiResponse {
  success: boolean;
  recommendation: FinancialRecommendation;
  timestamp: string;
}

export default function FinancialRecommendationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { registerReloadHandler, unregisterReloadHandler } = useReload();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
    
    // Registrar handler de recarga
    registerReloadHandler(fetchRecommendations);
    
    return () => {
      unregisterReloadHandler();
    };
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Datos del perfil del usuario para obtener recomendaciones personalizadas
      const profileData = {
        profile: {
          business_type: "PYME",
          monthly_income: 120000,
          employees: 8,
          industry: "Comercio retail",
          has_bank_account: true,
          credit_history: "bueno",
          annual_revenue: 1440000,
        },
      };

      console.log('🚀 Enviando petición de recomendaciones financieras...');

      // TODO: Reemplazar con el endpoint real cuando esté disponible
      const response = await fetch(
        "https://d8pgui6dhb.execute-api.us-east-2.amazonaws.com/financial-recommendations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        }
      );

      console.log('📡 Status:', response.status);

      if (!response.ok) {
        // Si el endpoint no está disponible, usar datos mock
        throw new Error("Usando datos de ejemplo");
      }

      const result = await response.json();
      console.log('📦 Respuesta:', result);

      setData(result);
    } catch (err) {
      console.warn("⚠️ Usando datos de ejemplo:", err);
      
      // Datos de ejemplo mientras se implementa el endpoint
      const mockData: ApiResponse = {
        success: true,
        recommendation: {
          overall_message: "Basado en el perfil de tu negocio, hemos identificado productos y servicios de Banorte que pueden impulsar tu crecimiento y mejorar tu gestión financiera.",
          products: [
            {
              name: "Línea de Crédito PYME",
              type: "Crédito",
              description: "Línea de crédito revolvente diseñada para pequeñas y medianas empresas que necesitan capital de trabajo.",
              benefits: [
                "Tasa preferencial para PYMES",
                "Disposición inmediata hasta $2,000,000",
                "Plazo hasta 36 meses",
                "Sin comisión por apertura"
              ],
              requirements: [
                "Antigüedad mínima de 2 años",
                "Estados financieros al corriente",
                "Buen historial crediticio"
              ],
              recommended_for: "Negocios con ingresos estables que necesitan liquidez para operaciones diarias",
              interest_rate: "12.5% - 18.9% anual",
              credit_limit: "Hasta $2,000,000 MXN",
              url: "https://www.banorte.com/empresas/credito/linea-credito-pyme"
            },
            {
              name: "Terminal Punto de Venta",
              type: "Servicios",
              description: "Acepta pagos con tarjetas de crédito y débito con las mejores comisiones del mercado.",
              benefits: [
                "Comisión desde 2.5%",
                "Depósito en 24 horas",
                "Sin renta mensual",
                "Programa de puntos Banorte Rewards"
              ],
              requirements: [
                "RFC activo",
                "Cuenta de cheques Banorte",
                "Comprobante de domicilio"
              ],
              recommended_for: "Comercios que quieren aumentar sus ventas aceptando tarjetas",
              url: "https://www.banorte.com/empresas/terminales-punto-venta"
            },
            {
              name: "Cuenta Empresarial Plus",
              type: "Cuenta",
              description: "Cuenta de cheques empresarial con múltiples beneficios para la operación diaria de tu negocio.",
              benefits: [
                "Sin comisión por manejo de cuenta",
                "100 operaciones gratis al mes",
                "Banca en línea y móvil",
                "Chequera sin costo"
              ],
              requirements: [
                "Apertura desde $5,000",
                "Documentos legales de la empresa",
                "Identificación del representante legal"
              ],
              recommended_for: "Empresas que buscan una cuenta completa para gestionar su operación",
              url: "https://www.banorte.com/empresas/cuentas/cuenta-empresarial-plus"
            },
            {
              name: "Seguro Empresarial",
              type: "Seguro",
              description: "Protege tu negocio contra imprevistos con coberturas amplias y personalizables.",
              benefits: [
                "Protección contra incendio y robo",
                "Responsabilidad civil",
                "Cobertura de equipo electrónico",
                "Descuento por múltiples pólizas"
              ],
              requirements: [
                "Valuación de activos",
                "Inspección del inmueble",
                "Historial de siniestros"
              ],
              recommended_for: "Negocios con activos físicos importantes que necesitan protección",
              url: "https://www.banorte.com/seguros/empresas"
            }
          ],
          additional_benefits: [
            "Descuentos exclusivos en servicios de asesoría fiscal y contable",
            "Acceso a talleres gratuitos de educación financiera empresarial",
            "Programa de recompensas Banorte Rewards con puntos dobles para empresas",
            "Ejecutivo de cuenta dedicado para atención personalizada"
          ],
          next_steps: [
            "Agenda una cita con un ejecutivo de Banorte Empresarial",
            "Reúne la documentación necesaria (RFC, estados financieros, identificación)",
            "Visita la sucursal más cercana o solicita en línea",
            "Recibe asesoría personalizada sobre los productos que mejor se adapten a tu negocio"
          ]
        },
        timestamp: new Date().toISOString()
      };

      setData(mockData);
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

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
        {/* Welcome Message Card */}
        <View style={styles.card}>
          <View style={styles.banorteHeader}>
            <MaterialCommunityIcons name="bank" size={40} color="#FF0000" />
            <View style={styles.banorteInfo}>
              <Text style={styles.banorteTitle}>Banorte Empresarial</Text>
              <Text style={styles.banorteSubtitle}>Soluciones financieras para tu negocio</Text>
            </View>
          </View>
          <Text style={styles.overallMessage}>{data.recommendation.overall_message}</Text>
        </View>

        {/* Products Section */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="package-variant" size={24} color="#000000" />
          <Text style={styles.sectionTitle}>Productos Recomendados</Text>
        </View>

        {data.recommendation.products.map((product, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.productHeader}>
              <View style={[styles.productIconContainer, { backgroundColor: `${getProductColor(product.type)}20` }]}>
                <MaterialCommunityIcons 
                  name={getProductIcon(product.type) as any} 
                  size={28} 
                  color={getProductColor(product.type)} 
                />
              </View>
              <View style={styles.productTitleContainer}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={[styles.productTypeBadge, { backgroundColor: getProductColor(product.type) }]}>
                  <Text style={styles.productTypeText}>{product.type}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.productDescription}>{product.description}</Text>

            {/* Beneficios */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>✓ Beneficios</Text>
              {product.benefits.map((benefit, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listItemText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Requisitos */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>📋 Requisitos</Text>
              {product.requirements.map((req, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listItemText}>{req}</Text>
                </View>
              ))}
            </View>

            {/* Info adicional */}
            {(product.interest_rate || product.credit_limit) && (
              <View style={styles.productDetailsContainer}>
                {product.interest_rate && (
                  <View style={styles.productDetailItem}>
                    <Text style={styles.productDetailLabel}>Tasa de interés</Text>
                    <Text style={styles.productDetailValue}>{product.interest_rate}</Text>
                  </View>
                )}
                {product.credit_limit && (
                  <View style={styles.productDetailItem}>
                    <Text style={styles.productDetailLabel}>Límite de crédito</Text>
                    <Text style={styles.productDetailValue}>{product.credit_limit}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Recomendado para */}
            <View style={styles.recommendedForContainer}>
              <MaterialCommunityIcons name="information" size={16} color="#666666" />
              <Text style={styles.recommendedForText}>{product.recommended_for}</Text>
            </View>

            {/* Botón de acción */}
            {product.url && (
              <TouchableOpacity 
                style={styles.productButton}
                onPress={() => openUrl(product.url!)}
              >
                <Text style={styles.productButtonText}>Más información</Text>
                <MaterialIcons name="open-in-new" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Additional Benefits Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="star-circle" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>Beneficios Adicionales</Text>
          </View>
          {data.recommendation.additional_benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Next Steps Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="format-list-numbered" size={24} color="#000000" />
            <Text style={styles.cardTitle}>Próximos Pasos</Text>
          </View>
          {data.recommendation.next_steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Contact Button */}
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => openUrl("https://www.banorte.com/empresas/contacto")}
        >
          <MaterialCommunityIcons name="phone" size={24} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Contactar a Banorte</Text>
        </TouchableOpacity>

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
