import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { supabase } from "@/config/supabase"; 
import { useRouter } from "expo-router";

export default function EditBusinessPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("businesses").select("*").single();
      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cargar la información del negocio.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string | number | boolean) => {
    setBusiness((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from("businesses").update(business).eq("id", business.id);
      if (error) throw error;
      Alert.alert("Éxito", "Los datos se actualizaron correctamente.");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la información.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C8102E" />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.center}>
        <Text>No se encontró información del negocio.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar información del negocio</Text>

      {Object.entries({
        businessName: "Nombre del negocio",
        actividad: "Actividad o giro principal",
        monthly_income: "Ingresos mensuales",
        monthly_expenses: "Gastos mensuales",
        net_profit: "Utilidad neta mensual",
        profit_margin: "Margen de ganancia (0 a 1)",
        cash_flow: "Flujo de efectivo mensual",
        debt_ratio: "Nivel de deuda (0 a 1)",
        business_age_years: "Años de antigüedad del negocio",
        employees: "Cantidad de empleados",
        digitalization_score: "Nivel de digitalización (0 a 1)",
        metodos_pago: "Métodos de pago",
        has_rfc: "¿Tienes RFC?",
        has_efirma: "¿Tienes e.firma?",
        emite_cfdi: "¿Emites CFDI?",
        declara_mensual: "¿Declaras impuestos mensualmente?",
        access_to_credit: "¿Tienes acceso a crédito?",
        formal: "¿Tu negocio es formal?",
      }).map(([key, label]) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}</Text>

          {typeof business[key] === "boolean" ? (
            <View style={styles.booleanRow}>
              <TouchableOpacity
                style={[
                  styles.booleanButton,
                  business[key] === true && { backgroundColor: "#C8102E" },
                ]}
                onPress={() => handleChange(key, true)}
              >
                <Text style={[styles.booleanText, business[key] === true && { color: "#fff" }]}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.booleanButton,
                  business[key] === false && { backgroundColor: "#333" },
                ]}
                onPress={() => handleChange(key, false)}
              >
                <Text style={[styles.booleanText, business[key] === false && { color: "#fff" }]}>No</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              value={String(business[key] ?? "")}
              onChangeText={(text) => handleChange(key, text)}
              keyboardType={
                typeof business[key] === "number" ? "numeric" : "default"
              }
              placeholder={label}
            />
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Guardar cambios</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: "#333",
  },
  booleanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  booleanButton: {
    flex: 0.48,
    borderWidth: 1,
    borderColor: "#C8102E",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  booleanText: {
    color: "#C8102E",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#C8102E",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 25,
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});
