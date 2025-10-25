import { RiskMeter } from "@/components/riskmeter";
import Roadmap, { RoadmapStep } from "@/components/roadmap";
import GoogleCalendar from "@/components/ui/calendar";
import { useProgress } from "@/context/ProgressContext";

import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, setActive } = useProgress();
  const score = 67;
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
        router.push('/(drawer)/(tabs)/stackhome/informal');
        break;
      case 'obligaciones':
      case 'riesgos':
        router.push('/(drawer)/(tabs)/stackhome/riskExplanation');
        break;
      case 'calendario':
      default:
        // Por ahora mantenemos en Home; el calendario se muestra abajo.
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Bienvenida */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>
            Bienvenido <Text style={styles.businessName}>{user?.name || "Usuario"}</Text>
          </Text>
          <Text style={styles.businessStatus}>
            Negocio <Text style={styles.informal}>Informal</Text>
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>
              Presiona para guiarte{"\n"}en el proceso de formalizar
            </Text>
            <TouchableOpacity style={styles.cardButton} onPress={() => router.push('/(drawer)/(tabs)/stackhome/informal')}>
              
              <Feather name="external-link" size={20} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tarjeta de Roadmap (resumen) */}
        <View style={styles.card}>
          <Roadmap
            steps={roadmapSteps}
            currentIndex={state.currentIndex}
            variant="summary"
            title="Avance de formalización"
            showPercent
            onOpenFull={() => router.push('/(drawer)/(tabs)/stackhome/roadmap')}
          />
        </View>

        {/* Tarjeta de RISK */}
        <View style={styles.card}>
            <Pressable
        onPress={() => router.push("/(drawer)/(tabs)/stackhome/riskExplanation")}
      >

          <View style={styles.riskContainer}>
            <View style={styles.riskGauge}>
              <RiskMeter score={score} /> 
            </View>
            <View style={styles.riskInfo}>
              <Text style={styles.riskLabel}>Puntuaje: <Text style={styles.riskValue}>{score}</Text></Text>
              <Text style={styles.riskLabel}>Sugerencia: <Text style={styles.riskSuggestion}>Lorem ipsum dolor sit amet...</Text></Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cardButtonBottom}>
            <Feather name="external-link" size={20} color="#FF0000" />
          </TouchableOpacity>
          </Pressable>
        </View>

        {/* Tarjeta de Próximos Eventos */}
        <View style={styles.card}>
          <View style={styles.eventsContainer}>
            
              <GoogleCalendar/>
          </View>
          <TouchableOpacity style={styles.cardButtonBottom}>
            <Feather name="external-link" size={20} color="#FF0000" />
          </TouchableOpacity>
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
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  businessName: {
    fontWeight: "bold",
  },
  businessStatus: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
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
});