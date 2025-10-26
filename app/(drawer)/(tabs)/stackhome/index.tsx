import { GrowthPotential } from "@/components/growthpotential";
import Roadmap, { RoadmapStep } from "@/components/roadmap";
import { useProgress } from "@/context/ProgressContext";
import CarouselCard from "@/components/ui/carouselCard";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {supabase} from "@/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";


import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface RoadmapData {
  progressTitle: string;
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [loading, setLoading] = useState(true);
  const { state, setActive } = useProgress();
  const growthMultiplier = 1.4; // Multiplicador de crecimiento anual (ejemplo: x1.4 = 40% de crecimiento)
  const [progress, setProgress] = useState<RoadmapData | null>(null);

useFocusEffect(
  useCallback(() => {
    async function loadRoadmapCache() {
      try {
        if (!user?.id) return;
        const cachedData = await AsyncStorage.getItem(`roadmap_${user.id}`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setProgress({
            progressTitle: parsed.progressTitle,
            completedSteps: parsed.completedSteps,
            totalSteps: parsed.totalSteps,
            progressPercent: parsed.progressPercent,
          });
        }
      } catch (err) {
        console.error("Error loading roadmap cache:", err);
      }
    }

    loadRoadmapCache();
  }, [user?.id])
);

  useEffect(() => {
    async function fetchBusinessName() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('businessName')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error obteniendo nombre del negocio:', error);
          return;
        }

        if (data?.businessName) {
          setNombreNegocio(data.businessName);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBusinessName();
  }, [user?.id]);

  const roadmapSteps: RoadmapStep[] = [
    { key: 'perfil', title: 'Perfil fiscal', subtitle: 'Cuéntanos de tu empresa', status: state.perfil },
    { key: 'regimen', title: 'Régimen óptimo', subtitle: 'Recomendación', status: state.regimen },
    { key: 'obligaciones', title: 'Obligaciones', subtitle: 'Configura y cumple', status: state.obligaciones },
    { key: 'calendario', title: 'Calendario SAT', subtitle: 'Fechas clave', status: state.calendario },
    { key: 'riesgos', title: 'Riesgo fiscal', subtitle: 'Mitiga y mejora', status: state.riesgos },
  ];


  const onRoadmapPress = (key: string) => {
    setActive(key as any);
    switch (key) {
      case 'perfil':
      case 'regimen':
        router.push('/(drawer)/(tabs)/stackhome/recomendacion');
        break;
      case 'obligaciones':
        break;
      case 'calendario':
      default:
        // Por ahora mantenemos en Home; el calendario se muestra abajo.
        break;
    }
  };

const cardData = [
  { id: '1', title1: 'Haz crecer tu negocio', title2: 'Formalízate hoy' },
  { id: '2', title1: 'Accede a créditos', title2: 'con tasas preferenciales' },
  { id: '3', title1: 'Evita multas', title2: 'con asesoría automática' },
  { id: '4', title1: 'Apóyate en IA', title2: 'para tomar mejores decisiones' },
  { id: '5', title1: 'Mejora tu salud financiera', title2: 'en minutos' },
  { id: '6', title1: 'Formalízate con FinForm', title2: 'y accede a beneficios reales' },
];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Bienvenida */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>
            Bienvenido, <Text style={styles.userName}>{user?.name || "Usuario"}</Text>
          </Text>
          
          {nombreNegocio ? (
            <>
              <Text style={styles.businessLabel}>Tu negocio:</Text>
              <Text style={styles.businessStatus}>
                <Text style={styles.businessNameHighlight}>{nombreNegocio}</Text>
              </Text>
            </>
          ) : (
            <Text style={styles.noBusinessText}>
              Completa el cuestionario para registrar tu negocio
            </Text>
          )}
          
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>
              Descubre cómo formalizar{"\n"}tu negocio paso a paso
            </Text>
            <TouchableOpacity 
              style={styles.cardButton} 
              onPress={() => router.push(nombreNegocio ? '/(drawer)/(tabs)/stackhome/recomendacion' : '/cuestionario')}
            >
              <Feather name="arrow-right-circle" size={24} color="#000000ff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tarjeta de Roadmap (resumen) */}
        <View style={styles.card}>
          <Roadmap
            steps={roadmapSteps}
            currentIndex={state.currentIndex}
            variant="summary"
            title="Tu progreso"
          />

        <Pressable
        onPress={() => router.push("/(drawer)/(tabs)/stackhome/roadmap")}

        >
    <View style={styles.progressCard}>
      {progress ? (
        <>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>
                {progress.progressTitle || "Progreso"}
              </Text>
              <Text style={styles.progressSubtitle}>
                {progress.completedSteps} de {progress.totalSteps} pasos completados
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>
                {progress.progressPercent}%
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress.progressPercent}%`,
                  backgroundColor:
                    progress.progressPercent === 100 ? "#10B981" : "#E80000",
                },
              ]}
            />
          </View>
        </>
      ) : (
        <Text style={styles.loadingText}>Cargando progreso...</Text>
      )}
    </View>
</Pressable>
        </View>


        
        <View style={styles.cardben}>
          <Pressable
            onPress={() => router.push("/(drawer)/(tabs)/stackhome/beneficios")}
          >
            <Text style={styles.beneficios}>Beneficios de nuestra <Text>app</Text></Text>
          <CarouselCard data={cardData} interval={2500} />
          </Pressable>
        </View>


        <View style={styles.card}>
          <Text style={styles.cardTitle}>Potencial de crecimiento</Text>
          <View style={styles.growthContainer}>
            {user?.id ? (
              <GrowthPotential 
                userId={user.id} 
                size={180} 
                showDetails={true}
              />
            ) : (
              <Text style={styles.noUserText}>Inicia sesión para ver tu potencial de crecimiento</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 0,
    margin: 5,
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
    color: "#000",
  },
  progressSubtitle: {
    fontSize: 14,
    color: "#666",
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
    borderColor: "#E80000",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "bold",
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
  loadingText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },


  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  beneficios :{
    fontSize: 16,
    fontWeight: "bold",
  },
    cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
  },
  growthContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  riskMeterContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  growthLegendContainer: {
    flex: 1,
    justifyContent: "center",
  },
  growthLegendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  growthLegendValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  growthDescription: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    lineHeight: 16,
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
  cardben: {
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
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  userName: {
    fontWeight: "bold",
    color: "#E80000",
  },
  businessLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  businessStatus: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  businessNameHighlight: {
    color: "#E80000",
  },
  noBusinessText: {
    fontSize: 15,
    color: "#F59E0B",
    fontStyle: "italic",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  informal: {
    color: "#FF0000",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cardFooterText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666666",
    flex: 1,
  },
  cardButton: {
    padding: 8,
  },
  cardButtonBottom: {
    position: "absolute",
    bottom: 16,
    right: 16,
    padding: 8,
  },
  riskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    gap: 16,
  },
  riskGauge: {
    width: 120,
    height: 120,
    marginRight: 16,
  },
  gaugeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  gaugeInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  gaugeSubtitle: {
    fontSize: 8,
    color: "#666666",
    marginTop: 2,
  },
  gaugeArc: {
    position: "absolute",
    width: 120,
    height: 60,
    borderRadius: 60,
    borderWidth: 8,
    borderBottomWidth: 0,
  },
  gaugeLow: {
    borderColor: "#4CAF50",
    transform: [{ rotate: "180deg" }],
    left: -4,
    top: 56,
  },
  gaugeMedium: {
    borderColor: "#FFD700",
    transform: [{ rotate: "240deg" }],
    left: -4,
    top: 56,
  },
  gaugeHigh: {
    borderColor: "#FF0000",
    transform: [{ rotate: "300deg" }],
    left: -4,
    top: 56,
  },
  gaugeNeedle: {
    position: "absolute",
    width: 2,
    height: 50,
    backgroundColor: "#000000",
    bottom: 60,
    transform: [{ rotate: "45deg" }],
  },
  gaugeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  gaugeLabelText: {
    fontSize: 10,
    color: "#666666",
    fontWeight: "600",
  },
  gaugeImage: {
    width: "100%",
    height: "100%",
  },
  riskInfo: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  riskValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  riskSuggestion: {
    fontSize: 14,
    fontWeight: "normal",
    fontStyle: "italic",
    color: "#666666",
  },
  eventsContainer: {
    flexDirection: "row",
    marginBottom: 40,
  },
  calendarPreview: {
    width: 100,
    height: 120,
    marginRight: 16,
  },
  calendarHeader: {
    backgroundColor: "#E0E0E0",
    padding: 4,
    alignItems: "center",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  calendarMonth: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },
  calendarGrid: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 4,
  },
  calendarWeek: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  calendarDay: {
    fontSize: 10,
    color: "#666666",
    padding: 2,
    width: 12,
    textAlign: "center",
  },
  calendarDayHighlight: {
    backgroundColor: "#FFD700",
    color: "#000000",
    fontWeight: "bold",
    borderRadius: 2,
  },
  calendarImage: {
    width: "100%",
    height: "100%",
  },
  eventsInfo: {
    flex: 1,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  eventItem: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  eventDay: {
    fontWeight: "bold",
    color: "#000000",
  },
  noUserText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    padding: 20,
  },
});