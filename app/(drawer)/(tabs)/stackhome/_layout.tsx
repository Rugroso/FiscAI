import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Stack, useNavigation, usePathname } from "expo-router";
import React, { createContext, useContext, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

// Contexto para manejar la recarga
interface ReloadContextType {
  triggerReload: () => void;
  registerReloadHandler: (handler: () => void) => void;
  unregisterReloadHandler: () => void;
}

const ReloadContext = createContext<ReloadContextType>({
  triggerReload: () => {},
  registerReloadHandler: () => {},
  unregisterReloadHandler: () => {},
});

export const useReload = () => useContext(ReloadContext);

export default function StackHomeLayout() {
    const navigation = useNavigation();
    const [reloadHandler, setReloadHandler] = useState<(() => void) | null>(null);
    const [isReloading, setIsReloading] = useState(false);
    const pathname = usePathname();

    const openDrawer = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.dispatch(DrawerActions.openDrawer());
    };

    const triggerReload = async () => {
      if (reloadHandler && !isReloading) {
        setIsReloading(true);
        await reloadHandler();
        setTimeout(() => setIsReloading(false), 1000);
      }
    };

    const registerReloadHandler = (handler: () => void) => {
      setReloadHandler(() => handler);
    };

    const unregisterReloadHandler = () => {
      setReloadHandler(null);
    };

    // Determinar si mostrar el botón de recarga
    const shouldShowReload = pathname.includes('recomendacion') || 
                            pathname.includes('roadmap') || 
                            pathname.includes('financialRecommendations');

  return (
    <ReloadContext.Provider value={{ triggerReload, registerReloadHandler, unregisterReloadHandler }}>
      <Stack>
       <Stack.Screen
              name="index"
              options={{
                headerTitle: () => (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000000" }}>Fisc</Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#E80000" }}>AI</Text>
                  </View>
                ),
                headerLeft: () => (
                  Platform.OS === "ios" ? (
                    <TouchableOpacity 
                      style={{ padding: 2, backgroundColor: "#FFFFFF", borderRadius: 50 }}
                      onPress={openDrawer}
                    >
                      <MaterialCommunityIcons name="menu" size={24} color="#000000" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={{ padding: 2, marginRight:12, backgroundColor: "#FFFFFF", borderRadius: 50 }}
                      onPress={openDrawer}
                    >
                      <MaterialCommunityIcons name="menu" size={24} color="#000000" />
                    </TouchableOpacity>
                  )
                ),
                headerRight: () => (
                  <TouchableOpacity 
                    onPress={triggerReload}
                    disabled={isReloading}
                    style={{ marginRight: 10 }}
                  >
                    <MaterialCommunityIcons 
                      name="refresh" 
                      size={24} 
                      color={isReloading ? "#CCCCCC" : "#000000"} 
                    />
                  </TouchableOpacity>
                ),
              }}
            />
       <Stack.Screen
              name="recomendacion"
              options={{
                headerShown: false,
              }}
            />
       <Stack.Screen
              name="roadmap"
              options={{
                headerTitle: () => (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000000" }}>Fisc</Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF0000" }}>AI</Text>
                  </View>
                ),
                headerRight: () => shouldShowReload && (
                  <TouchableOpacity 
                    onPress={triggerReload}
                    disabled={isReloading}
                    style={{ marginRight: 10 }}
                  >
                    <MaterialCommunityIcons 
                      name="refresh" 
                      size={24} 
                      color={isReloading ? "#CCCCCC" : "#000000"} 
                    />
                  </TouchableOpacity>
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
       <Stack.Screen
              name="financialRecommendations"
              options={{
                headerTitle: () => (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000000" }}>Fisc</Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF0000" }}>AI</Text>
                  </View>
                ),
                headerTitleAlign: 'center',
                headerRight: () => shouldShowReload && (
                  <TouchableOpacity 
                    onPress={triggerReload}
                    disabled={isReloading}
                    style={{ marginRight: 10 }}
                  >
                    <MaterialCommunityIcons 
                      name="refresh" 
                      size={24} 
                      color={isReloading ? "#CCCCCC" : "#000000"} 
                    />
                  </TouchableOpacity>
                ),
              }}
            />
       <Stack.Screen name="doctor" options={{ headerTitle: "Detalle" }} />
    </Stack>
    </ReloadContext.Provider>
  );
}