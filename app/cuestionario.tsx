import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// import { supabase } from "../lib/supabase";

const questions = [
  { id: 1, text: "Inserta el nombre de tu negocio", key: "businessName", placeholder: "Ej. Taquería Los Primos", type: "text" },
  { id: 2, text: "¿Cuál es tu actividad o giro principal?", key: "actividad", placeholder: "Ej. Diseñador gráfico freelance", type: "text" },

  { id: 3, text: "Ingresos mensuales", key: "monthly_income", placeholder: "Ej. 14000", type: "number" },
  { id: 4, text: "Gastos mensuales", key: "monthly_expenses", placeholder: "Ej. 12000", type: "number" },
  {
    id: 5,
    text: "¿Cuánto dinero te queda libre al mes después de pagar tus gastos?",
    key: "net_profit",
    placeholder: "Ej. 10000",
    type: "number",
  },
  {
    id: 6,
    text: "¿Qué tanto ganas en comparación a lo que vendes?",
    key: "profit_margin",
    type: "options",
    options: [
      { label: "Gano muy poco", value: 0.1 },
      { label: "Gano un margen razonable", value: 0.3 },
      { label: "Tengo buenas ganancias", value: 0.5 },
      { label: "Mis ganancias son muy altas", value: 0.75 },
    ],
  },
  {
    id: 7,
    text: "¿Cómo describirías el flujo de dinero en tu negocio mes a mes?",
    key: "cash_flow",
    type: "options",
    options: [
      { label: "Casi no tengo dinero disponible", value: 0.1 },
      { label: "A veces me alcanza, a veces no", value: 0.5 },
      { label: "Casi siempre tengo dinero disponible", value: 0.75 },
      { label: "Siempre tengo dinero disponible", value: 1 },
    ],
  },
  {
    id: 8,
    text: "¿Qué tanto debe tu negocio actualmente?",
    key: "debt_ratio",
    type: "options",
    options: [
      { label: "Nada", value: 0 },
      { label: "Poca deuda", value: 0.25 },
      { label: "Deuda moderada", value: 0.5 },
      { label: "Deuda alta", value: 0.75 },
      { label: "Deuda muy alta", value: 1 },
    ],
  },
  { id: 9, text: "Antigüedad del negocio (en años)", key: "business_age_years", placeholder: "Ej. 5", type: "number" },
  { id: 10, text: "Cantidad de empleados", key: "employees", placeholder: "Ej. 3", type: "number" },
  {
    id: 11,
    text: "¿Qué tan activo es tu negocio en redes sociales o internet?",
    key: "digitalization_score",
    type: "options",
    options: [
      { label: "Nada (no tengo redes ni página)", value: 0 },
      { label: "Poco (tengo redes pero no las uso mucho)", value: 0.25 },
      { label: "Algo (a veces publico o vendo en línea)", value: 0.5 },
      { label: "Casi siempre (uso redes o apps frecuentemente)", value: 0.75 },
      { label: "Siempre (mi negocio depende mucho de internet)", value: 1 },
    ],
  },

  { id: 12, text: "¿Qué métodos de pago aceptas?", key: "metodos_pago", placeholder: "Ej. transferencia, efectivo, tarjeta", type: "text" },
  { id: 13, text: "¿Tienes RFC?", key: "has_rfc", type: "boolean" },
  { id: 14, text: "¿Tienes e.firma?", key: "has_efirma", type: "boolean" },
  { id: 15, text: "¿Emites CFDI?", key: "emite_cfdi", type: "boolean" },
  { id: 16, text: "¿Declaras impuestos de forma mensual?", key: "declara_mensual", type: "boolean" },
  { id: 17, text: "¿Tienes acceso a crédito?", key: "access_to_credit", type: "boolean" },
  { id: 18, text: "¿Tu negocio es formal?", key: "formal", type: "boolean" },
];

export default function Cuestionario() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = async (valueOverride?: any) => {
    const { key, type } = questions[current];
    let value: any = valueOverride ?? input.trim();

    if (type === "number" && value !== "") {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        Alert.alert("Error", "Por favor, introduce un número válido.");
        return;
      }
      value = parsed;
    }

    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    setInput("");

    if (current < questions.length - 1) {
      setCurrent(current + 1);
      return;
    }

    try {
      setLoading(true);
      console.log("Subiendo respuestas:", updated);

      // const { error } = await supabase.from("businesses").insert([
      //   { ...updated, created_at: new Date().toISOString() },
      // ]);
      // if (error) throw error;

      // Alert.alert("Éxito", "¡Tus respuestas fueron guardadas con éxito!");
      router.replace("/(drawer)/(tabs)/stackhome");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron guardar tus respuestas.");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[current];
  const total = questions.length;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>
          Fisc<Text style={styles.logoAccent}>AI</Text>
        </Text>

        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>{currentQuestion.text}</Text>

        {/* Boolean questions */}
        {currentQuestion.type === "boolean" ? (
          <View style={styles.booleanContainer}>
            <TouchableOpacity
              style={[styles.booleanButton, { backgroundColor: "#C8102E" }]}
              onPress={() => handleNext(true)}
              disabled={loading}
            >
              <Text style={styles.booleanText}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.booleanButton, { backgroundColor: "#333" }]}
              onPress={() => handleNext(false)}
              disabled={loading}
            >
              <Text style={styles.booleanText}>No</Text>
            </TouchableOpacity>
          </View>

        // Option-based questions
        ) : currentQuestion.type === "options" ? (
          <View style={{ marginTop: 20 }}>
            {currentQuestion.options?.map((opt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleNext(opt.value)}
                disabled={loading}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

        // Text/Number questions
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder={currentQuestion.placeholder}
              value={input}
              onChangeText={setInput}
              keyboardType={currentQuestion.type === "number" ? "numeric" : "default"}
            />

            <View style={styles.lowerContainer}>
              <Text style={styles.progressText}>
                Pregunta {current + 1} de {total}
              </Text>

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.5 }]}
                onPress={() => handleNext()}
                disabled={loading || !input.trim()}
              >
                <Text style={styles.buttonText}>
                  {current === questions.length - 1 ? "Terminar" : "Siguiente"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lowerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 25,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
  },
  logoAccent: {
    color: "#C8102E",
  },
  progressText: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
    marginBottom: 16,
    textAlign: "right",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "#333",
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 20,
  },
  button: {
    borderWidth: 1,
    borderColor: "#C8102E",
    borderRadius: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  buttonText: {
    color: "#C8102E",
  },
  booleanContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  booleanButton: {
    flex: 0.48,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  booleanText: {
    color: "#fff",
    fontWeight: "bold",
  },
  optionButton: {
    backgroundColor: "#f3f3f3",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  optionText: {
    color: "#333",
    fontSize: 16,
  },
});
