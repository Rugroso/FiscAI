import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "@/supabase";
import { useReload } from "./_layout";

// Interfaces para el roadmap fiscal
interface RoadmapStep {
  key: string;
  title: string;
  subtitle: string;
  status: 'active' | 'locked' | 'completed';
}

interface RoadmapGoal {
  title: string;
  subtitle: string;
  description: string;
}

interface RoadmapProfile {
  actividad: string;
  ingresos_anuales: number;
  tiene_rfc: boolean;
  tiene_efirma: boolean;
  emite_cfdi: boolean;
}

interface RoadmapData {
  steps: RoadmapStep[];
  currentIndex: number;
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  goal: RoadmapGoal;
  title: string;
  progressTitle: string;
  profile: RoadmapProfile;
}

interface BusinessData {
  id: string;
  user_id: string;
  actividad: string | null;
  monthly_income: number | null;
  has_rfc: boolean;
  has_efirma: boolean;
  emite_cfdi: boolean;
  declara_mensual: boolean;
}

export default function FullRoadmapScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { registerReloadHandler, unregisterReloadHandler } = useReload();
  
  const [loading, setLoading] = useState(true);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    loadRoadmap();
    
    // Registrar handler de recarga
    registerReloadHandler(handleRefresh);
    
    return () => {
      unregisterReloadHandler();
    };
  }, [user?.id]);

  // Generar hash de los datos del negocio para detectar cambios
  const generateDataHash = (businessData: BusinessData): string => {
    const relevantData = {
      actividad: businessData.actividad,
      monthly_income: businessData.monthly_income,
      has_rfc: businessData.has_rfc,
      has_efirma: businessData.has_efirma,
      emite_cfdi: businessData.emite_cfdi,
      declara_mensual: businessData.declara_mensual,
    };
    return JSON.stringify(relevantData);
  };

  // Cargar roadmap desde cache o API
  const loadRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError("Usuario no autenticado");
        return;
      }

      // Intentar cargar desde cache
      const cachedData = await AsyncStorage.getItem(`roadmap_${user.id}`);
      const cachedHash = await AsyncStorage.getItem(`roadmap_hash_${user.id}`);

      // Obtener datos actuales del negocio
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, user_id, actividad, monthly_income, has_rfc, has_efirma, emite_cfdi, declara_mensual')
        .eq('user_id', user.id)
        .single();

      if (businessError || !businessData) {
        console.error('❌ Error obteniendo datos del negocio:', businessError);
        setError("No se encontraron datos del negocio");
        Alert.alert(
          "Sin Datos",
          "Primero debes completar el cuestionario de tu negocio",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ir al Cuestionario", onPress: () => router.push('/cuestionario') }
          ]
        );
        return;
      }

      // Verificar si los datos han cambiado
      const currentHash = generateDataHash(businessData);
      
      if (cachedData && cachedHash === currentHash) {
        // Usar datos en cache
        console.log('📦 Cargando roadmap desde cache');
        const parsedData = JSON.parse(cachedData);
        setRoadmapData(parsedData);
        setIsFromCache(true);
        setLoading(false);
      } else {
        // Datos cambiaron o no hay cache, obtener nuevo roadmap
        console.log('🔄 Datos actualizados, obteniendo nuevo roadmap');
        setIsFromCache(false);
        await fetchRoadmap(businessData, currentHash);
      }
    } catch (err) {
      console.error("❌ Error en loadRoadmap:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Forzar actualización manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRoadmap();
    setIsRefreshing(false);
  };

  const fetchRoadmap = async (existingBusinessData?: BusinessData, existingHash?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError("Usuario no autenticado");
        return;
      }

      // Usar datos existentes o obtener nuevos
      let businessData: BusinessData | null = existingBusinessData || null;
      let currentHash = existingHash;

      if (!businessData) {
        const { data: fetchedData, error: businessError } = await supabase
          .from('businesses')
          .select('id, user_id, actividad, monthly_income, has_rfc, has_efirma, emite_cfdi, declara_mensual')
          .eq('user_id', user.id)
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

      // Preparar datos para el endpoint
      const ingresosAnuales = (businessData.monthly_income || 0) * 12;
      
      const requestData = {
        actividad: businessData.actividad || "Sin especificar",
        ingresos_anuales: ingresosAnuales,
        tiene_rfc: businessData.has_rfc || false,
        tiene_efirma: businessData.has_efirma || false,
        emite_cfdi: businessData.emite_cfdi || false,
      };

      console.log('🚀 Enviando petición al endpoint de roadmap:', requestData);

      const response = await fetch(
        "https://d8pgui6dhb.execute-api.us-east-2.amazonaws.com/fiscal-roadmap",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener el roadmap fiscal");
      }

      const result: RoadmapData = await response.json();

      setRoadmapData(result);
      console.log('✅ Roadmap procesado y estado actualizado');
      console.log(result);

      // Guardar en cache con el hash
      try {
        await AsyncStorage.setItem(`roadmap_${user.id}`, JSON.stringify(result));
        if (currentHash) {
          await AsyncStorage.setItem(`roadmap_hash_${user.id}`, currentHash);
        }
        console.log('💾 Roadmap guardado en cache');
        setIsFromCache(false);
      } catch (cacheError) {
        console.warn('⚠️ Error guardando en cache:', cacheError);
      }

    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      Alert.alert("Error", "No se pudo obtener el roadmap fiscal");
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para obtener el icono según el key del step
  const getStepIcon = (key: string): string => {
    const icons: { [key: string]: string } = {
      'rfc': 'card-account-details',
      'efirma': 'shield-key',
      'regimen': 'bank',
      'cfdi': 'file-document',
      'declaraciones': 'calendar-check',
    };
    return icons[key] || 'checkbox-marked-circle';
  };

  // Función para obtener el color según el status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'active':
        return '#4A90E2';
      case 'locked':
        return '#E5E7EB';
      default:
        return '#9CA3AF';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Generando tu roadmap fiscal...</Text>
      </View>
    );
  }

  if (error || !roadmapData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#FF0000" />
          <Text style={styles.errorText}>{error || "Error al cargar roadmap"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadRoadmap()}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Cache indicator */}
        {isFromCache && (
          <View style={styles.cacheIndicator}>
            <MaterialCommunityIcons name="database-clock" size={16} color="#2196F3" />
            <Text style={styles.cacheText}>Datos en cache - Presiona refrescar para actualizar</Text>
          </View>
        )}

        {/* Tarjeta de Progreso General */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>{roadmapData.progressTitle || 'Progreso'}</Text>
              <Text style={styles.progressSubtitle}>
                {roadmapData.completedSteps} de {roadmapData.totalSteps} pasos completados
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{roadmapData.progressPercent}%</Text>
            </View>
          </View>
          
          {/* Barra de progreso */}
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${roadmapData.progressPercent}%`,
                  backgroundColor: roadmapData.progressPercent === 100 ? '#10B981' : '#4A90E2'
                }
              ]} 
            />
          </View>
        </View>

        {/* Tarjeta de Meta/Goal */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>{roadmapData.goal.title}</Text>
              <Text style={styles.goalSubtitle}>{roadmapData.goal.subtitle}</Text>
            </View>
          </View>
          <Text style={styles.goalDescription}>{roadmapData.goal.description}</Text>
        </View>

        {/* Timeline de Pasos */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="timeline-text" size={24} color="#4A90E2" />
          <Text style={styles.sectionTitle}>Pasos de Formalización</Text>
        </View>
        
        <View style={styles.timelineCard}>
          {roadmapData.steps.map((step, index) => (
            <View key={step.key} style={styles.timelineItem}>
              {/* Línea vertical conectora */}
              {index < roadmapData.steps.length - 1 && (
                <View 
                  style={[
                    styles.timelineLine,
                    { backgroundColor: step.status === 'completed' ? '#10B981' : '#E5E7EB' }
                  ]} 
                />
              )}
              
              {/* Círculo indicador con ícono */}
              <View 
                style={[
                  styles.timelineCircle,
                  { backgroundColor: getStatusColor(step.status) }
                ]}
              >
                {step.status === 'completed' ? (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                ) : step.status === 'locked' ? (
                  <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                ) : (
                  <MaterialCommunityIcons 
                    name={getStepIcon(step.key) as any} 
                    size={18} 
                    color="#FFF" 
                  />
                )}
              </View>
              
              {/* Contenido del paso */}
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text 
                    style={[
                      styles.timelineTitle,
                      { opacity: step.status === 'locked' ? 0.5 : 1 }
                    ]}
                  >
                    {step.title}
                  </Text>
                  {step.status === 'active' && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Actual</Text>
                    </View>
                  )}
                </View>
                <Text 
                  style={[
                    styles.timelineSubtitle,
                    { opacity: step.status === 'locked' ? 0.5 : 1 }
                  ]}
                >
                  {step.subtitle}
                </Text>
                
                {/* Botón de acción solo para pasos activos */}
                {step.status === 'active' && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      // Navegar según el tipo de paso
                      if (step.key === 'rfc' || step.key === 'regimen') {
                        router.push('/(drawer)/(tabs)/stackhome/recomendacion');
                      } else if (step.key === 'cfdi' || step.key === 'declaraciones') {
                        router.push('/(drawer)/(tabs)/stackhome/beneficios');
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>Iniciar paso</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Información del Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <MaterialCommunityIcons name="briefcase" size={24} color="#000000" />
            <Text style={styles.profileTitle}>Tu Perfil Fiscal</Text>
          </View>
          
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Actividad</Text>
            <Text style={styles.profileValue}>{roadmapData.profile.actividad}</Text>
          </View>
          
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Ingresos Anuales</Text>
            <Text style={styles.profileValue}>
              ${roadmapData.profile.ingresos_anuales.toLocaleString('es-MX')} MXN
            </Text>
          </View>

          <View style={styles.profileStatus}>
            <Text style={styles.profileStatusTitle}>Estado de Cumplimiento</Text>
            
            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name={roadmapData.profile.tiene_rfc ? "check-circle" : "close-circle"}
                size={20}
                color={roadmapData.profile.tiene_rfc ? "#10B981" : "#EF4444"}
              />
              <Text style={styles.statusText}>RFC Registrado</Text>
            </View>

            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name={roadmapData.profile.tiene_efirma ? "check-circle" : "close-circle"}
                size={20}
                color={roadmapData.profile.tiene_efirma ? "#10B981" : "#EF4444"}
              />
              <Text style={styles.statusText}>e.firma Vigente</Text>
            </View>

            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name={roadmapData.profile.emite_cfdi ? "check-circle" : "close-circle"}
                size={20}
                color={roadmapData.profile.emite_cfdi ? "#10B981" : "#EF4444"}
              />
              <Text style={styles.statusText}>Emite CFDI</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  cacheIndicator: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  cacheText: {
    fontSize: 13,
    color: "#1976D2",
    marginLeft: 8,
    flex: 1,
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  progressSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#4A90E2",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  goalCard: {
    backgroundColor: "#000000",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  goalInfo: {
    marginLeft: 12,
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  goalSubtitle: {
    fontSize: 14,
    color: "#CCCCCC",
    marginTop: 2,
  },
  goalDescription: {
    fontSize: 14,
    color: "#E5E7EB",
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginLeft: 8,
  },
  timelineCard: {
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
  timelineItem: {
    flexDirection: "row",
    marginBottom: 24,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 15,
    top: 35,
    bottom: -24,
    width: 2,
  },
  timelineCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
  timelineSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: "#4A90E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginLeft: 8,
  },
  profileItem: {
    marginBottom: 12,
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
  profileStatus: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  profileStatusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
});
