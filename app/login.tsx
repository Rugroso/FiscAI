import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingVertical: 20,
          }}
        >
          <View>
            {/* <Image
              source={require("../assets/images/logo/medicalclus.png")}
              style={{
                width: 80,
                height: 80,
                alignSelf: "center",
                marginBottom: 15,
              }}
              resizeMode="contain"
            /> */}
          </View>
            <Text style={styles.title}>
            Bienvenido a Fisc<Text style={{ color: "#E80000" }}>AI</Text>
            </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#999999"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              placeholder="••••••••"
              placeholderTextColor="#999999"
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.registerText}>
            ¿No tienes cuenta?{" "}
            <Text
              style={styles.registerLink}
              onPress={() => router.replace("/register" as any)}
            >
              Regístrate
            </Text>
          </Text>

          <Text style={styles.passwordText}>
            ¿Olvidaste tu contraseña?{" "}
            <Text
              style={styles.registerLink}
              onPress={() => router.replace("/reset-password" as any)}
            >
              Recupérala
            </Text>
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#000000",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#000000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  registerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#000000",
  },
  passwordText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    color: "#000000",
  },
  registerLink: {
    color: "#E80000",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
