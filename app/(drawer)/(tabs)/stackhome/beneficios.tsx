import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import {
    BarChart3,
    Briefcase,
    Clock,
    CreditCard,
    HeartHandshake,
    LineChart,
    Settings,
    ShieldCheck,
    Smartphone,
    Users
} from "lucide-react-native";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const appBenefits = [
    {
      id: 1,
      title: "Control desde tu celular",
      description: "Gestiona todo fácilmente desde nuestra app móvil.",
      icon: Smartphone,
      color: "#0288D1",
    },
    {
      id: 3,
      title: "Seguimiento inteligente",
      description: "Monitorea tu progreso y cumplimiento en tiempo real.",
      icon: BarChart3,
      color: "#7B1FA2",
    },
    {
      id: 4,
      title: "Asistencia personalizada",
      description: "Accede a soporte directo para resolver tus dudas rápidamente.",
      icon: HeartHandshake,
      color: "#E64A19",
    },
    {
      id: 5,
      title: "Configuración flexible",
      description: "Ajusta tu experiencia según tus necesidades.",
      icon: Settings,
      color: "#1976D2",
    },
  
  ];

  const formalBenefits = [
    {
      id: 1,
      title: "Accede a créditos formales",
      description: "Obtén financiamiento con tasas preferenciales al formalizar tu negocio.",
      icon: CreditCard,
      color: "#D32F2F",
    },
    {
      id: 2,
      title: "Asesoría personalizada",
      description: "Recibe guía paso a paso para cumplir con tus obligaciones fiscales.",
      icon: Users,
      color: "#0288D1",
    },
    {
      id: 3,
      title: "Protección legal y fiscal",
      description: "Evita multas y protege tu negocio con registro oficial.",
      icon: ShieldCheck,
      color: "#388E3C",
    },
    {
      id: 4,
      title: "Mejor reputación financiera",
      description: "Construye tu historial y mejora tu puntaje crediticio.",
      icon: LineChart,
      color: "#F9A825",
    },
    {
      id: 5,
      title: "Ahorro de tiempo y esfuerzo",
      description: "Simplifica trámites con automatización e inteligencia artificial.",
      icon: Clock,
      color: "#7B1FA2",
    },
    {
      id: 6,
      title: "Crecimiento sostenible",
      description: "Haz crecer tu negocio con herramientas diseñadas para ti.",
      icon: Briefcase,
      color: "#1976D2",
    },
  ];

  const renderCards = (data: any[]) => (
    <View style={styles.grid}>
      {data.map((item) => {
        const Icon = item.icon;
        return (
          <View key={item.id} style={styles.card}>
            <View style={[styles.iconWrapper, { backgroundColor: item.color + "20" }]}>
              <Icon color={item.color} size={28} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sección de la app */}
        <Text style={styles.header}>
          Beneficios de la <Text style={styles.rojo}>app</Text>
        </Text>
        {renderCards(appBenefits)}

        {/* Sección de formalización */}
        <Text style={[styles.header, { marginTop: 30 }]}>
          Beneficios de <Text style={styles.rojo}>formalizarte</Text>
        </Text>
        {renderCards(formalBenefits)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rojo: {
    color: "#E80000",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 20,
    textAlign: "left",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#6B7280",
  },
});
