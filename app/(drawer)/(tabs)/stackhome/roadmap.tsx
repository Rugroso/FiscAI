import Roadmap from "@/components/roadmap";
import { useProgress } from "@/context/ProgressContext";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function FullRoadmapScreen() {
  const { state } = useProgress();
  const router = useRouter();

  const steps = [
    { key: 'perfil', title: 'Perfil fiscal', subtitle: 'Cuéntanos de tu empresa', status: state.perfil },
    { key: 'regimen', title: 'Régimen óptimo', subtitle: 'Recomendación', status: state.regimen },
    { key: 'obligaciones', title: 'Obligaciones', subtitle: 'Configura y cumple', status: state.obligaciones },
    { key: 'calendario', title: 'Calendario SAT', subtitle: 'Fechas clave', status: state.calendario },
    { key: 'riesgos', title: 'Riesgo fiscal', subtitle: 'Mitiga y mejora', status: state.riesgos },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tu progreso</Text>
        <View style={styles.card}>
          <Roadmap
            steps={steps}
            currentIndex={state.currentIndex}
            title="Roadmap fiscal para tu empresa"
            goalTitle="Meta: Empresa formal y al día"
            goalSubtitle="Cumplimiento total"
            variant="full"
            orientation="vertical"
            onStepPress={(key) => {
              if (key === 'perfil' || key === 'regimen') router.push('/(drawer)/(tabs)/stackhome/informal');
              if (key === 'riesgos' || key === 'obligaciones') router.push('/(drawer)/(tabs)/stackhome/riskExplanation');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, elevation: 3 },
});
