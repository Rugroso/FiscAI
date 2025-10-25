import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import React from "react";
import { Platform, TouchableOpacity, View } from "react-native";
export default function stackmap() {
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
                headerTitle: "Inicio",
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
                headerRight: () => (
                  <View>
                  </View>
                ),
              }}
            />
       <Stack.Screen name="doctor" options={{ headerTitle: "Detalle" }} />
    </Stack>
  );
}