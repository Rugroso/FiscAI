"use client";

import { Feather } from "@expo/vector-icons";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [profilePicture, setProfilePicture] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("");
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const genderOptions = ["Masculino", "Femenino", "Otro", "Prefiero no decirlo"];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("El correo electrónico es obligatorio");
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Ingresa un correo electrónico válido");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/[\s\-()]/g, "");

    if (!cleanPhone) {
      setPhoneError("El número de teléfono es obligatorio");
      return false;
    } else if (!/^[0-9]{10}$/.test(cleanPhone)) {
      setPhoneError("El número debe tener 10 dígitos");
      return false;
    } else {
      setPhoneError("");
      return true;
    }
  };

  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar la foto de perfil");
    }
  };

  const handleRegister = async () => {
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(cellphone);

    if (
      !isEmailValid ||
      !isPhoneValid ||
      !name.trim() ||
      !lastName.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !gender ||
      !location.trim()
    ) {
      Alert.alert("Error", "Todos los campos son obligatorios y deben ser válidos");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = cellphone.replace(/[\s\-()]/g, "");

      await register(
        email,
        password,
        confirmPassword,
        name,
        lastName,
        birthdate.toISOString(),
        fullPhoneNumber,
        gender,
        location,
        profilePicture
      );

      router.push("/cuestionario");

    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("Error", "Hubo un problema al registrar tu cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Registro</Text>

          <View style={styles.formSection}>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo Electrónico</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  validateEmail(text);
                }}
                onBlur={() => validateEmail(email)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono Celular</Text>
              <TextInput
                style={[styles.input, phoneError ? styles.inputError : null]}
                placeholder="1234567890"
                placeholderTextColor="#999999"
                value={cellphone}
                onChangeText={(text) => {
                  let limitedText = text.slice(0, 10);
                  setCellphone(limitedText);
                  validatePhone(limitedText);
                }}
                onBlur={() => validatePhone(cellphone)}
                keyboardType="phone-pad"
              />
              <Text style={styles.charCounter}>{cellphone.length}/10</Text>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#999999"
                value={name}
                onChangeText={(text) => {
                  setName(text.slice(0, 20));
                }}
              />
              <Text style={styles.charCounter}>{name.length}/20</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellidos</Text>
              <TextInput
                style={styles.input}
                placeholder="Apellidos"
                placeholderTextColor="#999999"
                value={lastName}
                onChangeText={(text) => setLastName(text.slice(0, 40))}
              />
              <Text style={styles.charCounter}>{lastName.length}/40</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <View style={[styles.input, { justifyContent: "center" }]}>
                  <Text style={{ color: birthdate ? "#000000" : "#999999" }}>
                    {birthdate.toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {Platform.OS === "ios" ? (
              <Modal
                transparent
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalBackground}>
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>Fecha de Nacimiento</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerConfirmText}>Listo</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={birthdate}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                        if (selectedDate) {
                          setBirthdate(selectedDate);
                        }
                      }}
                      style={styles.iosDatePicker}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  value={birthdate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setBirthdate(selectedDate);
                    }
                  }}
                />
              )
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Género</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(true)}>
                <View style={[styles.input, { justifyContent: "center" }]}>
                  <Text style={{ color: gender ? "#000000" : "#999999" }}>
                    {gender || "Selecciona tu género"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Modal
              transparent
              animationType="slide"
              visible={showGenderPicker}
              onRequestClose={() => setShowGenderPicker(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerTitle}>Selecciona tu género</Text>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        setGender(option);
                        setShowGenderPicker(false);
                      }}
                      style={styles.pickerItem}
                    >
                      <Text style={styles.pickerItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowGenderPicker(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ubicación</Text>
              <TextInput
                style={styles.input}
                placeholder="Ciudad, Estado, País"
                placeholderTextColor="#999999"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirmar Contraseña"
                placeholderTextColor="#999999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Registrarse</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.loginText}>
            ¿Ya tienes cuenta?{" "}
            <Text
              style={styles.loginLink}
              onPress={() => router.replace("/login" as any)}
            >
              Inicia sesión
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 24,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  imagePickerContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#CCCCCC",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999999",
  },
  helperText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 12,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  inputError: {
    borderColor: "#FF0000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: 4,
  },
  charCounter: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  registerButton: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginText: {
    textAlign: "center",
    fontSize: 14,
    color: "#000000",
  },
  loginLink: {
    color: "#E80000",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  datePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    width: "100%",
    position: "absolute",
    bottom: 0,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  datePickerCancelText: {
    fontSize: 16,
    color: "#999999",
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  iosDatePicker: {
    backgroundColor: "#FFFFFF",
    height: 200,
  },
});