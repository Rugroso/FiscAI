import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Stack, useNavigation } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

export default function StackHomeLayout() {
    const navigation = useNavigation();

    const openDrawer = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.dispatch(DrawerActions.openDrawer());
    };

  return (
    <Stack>
       <Stack.Screen
              name="index"
              options={{
                headerTitle: () => (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000000" }}>Fisc</Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF0000" }}>AI</Text>
                  </View>
                ),
                  headerLeft: () => (
                    Platform.OS === "ios" ? (
                      <TouchableOpacity 
                        style={{ padding: 4, backgroundColor: "#FFFFFF", borderRadius: 50 }}
                        onPress={openDrawer}
                      >
                        <MaterialCommunityIcons name="menu" size={24} color="#000000" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={{ padding: 4, marginRight:12, backgroundColor: "#FFFFFF", borderRadius: 50 }}
                        onPress={openDrawer}
                      >
                        <MaterialCommunityIcons name="menu" size={24} color="#000000" />
                      </TouchableOpacity>
                    )
                  ),
              }}
            />
       <Stack.Screen
              name="riskExplanation"
              options={{
                headerTitle: () => (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000000" }}>Fisc</Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF0000" }}>AI</Text>
                  </View>
                ),
              }}
            />
       <Stack.Screen
              name="beneficios"
              options={{
                headerTitle: () => (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000000" }}>Fisc</Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF0000" }}>AI</Text>
                  </View>
                ),
              }}
            />
       <Stack.Screen name="doctor" options={{ headerTitle: "Detalle" }} />
    </Stack>
  );
}