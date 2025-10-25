
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React from "react";

import {
    SafeAreaView,
    ScrollView,
    StyleSheet
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const score = 67;

  const cardData = [
  { id: '1', title1: 'Beneficios', title2: 'Créditos' },
  { id: '2', title1: 'Requisitos', title2: 'Procedimiento' },
  { id: '3', title1: 'Contacto', title2: 'Soporte' },
  { id: '4', title1: 'Duración', title2: 'Plazos' },
];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
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

});