import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import * as Haptics from 'expo-haptics';
import { useNavigation, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useState } from "react";
import { Dimensions, Platform, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "../../context/AuthContext";

const CustomDrawerButton = () => {
  const navigation = useNavigation();

  const openDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  if (Platform.OS === "ios") {
    return (
      <TouchableOpacity 
        style={{ padding: 4, backgroundColor: "#FFFFFF", borderRadius: 50 }}
        onPress={openDrawer}
      >
        <MaterialCommunityIcons name="menu" size={24} color="#000000" />
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableOpacity 
        style={{ padding: 4, marginRight:12, backgroundColor: "#FFFFFF", borderRadius: 50 }}
        onPress={openDrawer}
      >
        <MaterialCommunityIcons name="menu" size={24} color="#000000" />
      </TouchableOpacity>
    );
  }

}
const width = Dimensions.get("window").width;

const customTitles: Record<string, string> = {
  contact: "Contacto",
  faq: width <= 410 ? "FAQ" : "Preguntas Frecuentes",
  about: "Sobre Nosotros",
  "settings/index": "Configuración",
};

export default function Layout() {
  const router = useRouter();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={({ route }: { route: { name: string } }) => ({
          headerShown: Object.keys(customTitles).includes(route.name) || route.name === "actualizarDatos",
          title: customTitles[route.name] || (route.name === "actualizarDatos" ? "Actualizar Datos" : route.name),
          headerLeft: () => {
            if (route.name === "actualizarDatos") {
              return (
                <TouchableOpacity 
                  style={{ marginLeft: 10 }}
                  onPress={() => router.back()}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
                </TouchableOpacity>
              );
            }
            return (
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                <CustomDrawerButton />
              </View>
            );
          },
        })}
        drawerContent={() => <CustomDrawerContent />}
      />
    </GestureHandlerRootView>
  );
}

function CustomDrawerContent() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await logout();
      router.replace("/login" as any);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const toggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDarkMode(previousState => !previousState);
  };

  const menuItems: { title: string; path: string }[] = [
    { title: "Inicio", path: '/(tabs)/stackhome' },
    { title: "Recomendación Fiscal", path: '/(tabs)/stackhome/recomendacion' },
    { title: "Actualización Datos", path: '/(drawer)/actualizarDatos' },
  ];

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.titleContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.titleText}>Menú</Text>
        </View>

        <View>
          <View style={styles.divider} />
          {menuItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity 
                style={styles.menuItemContainer}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.navigate(item.path as any);
                }}
              >
                <Text style={styles.drawerItem}>{item.title}</Text>
              </TouchableOpacity>
              <View style={styles.dividerItems} />
            </View>
          ))}
        </View>
      </View>
      
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : {}]}
      >
        <MaterialCommunityIcons name='logout' size={20} color="white" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "white",
  },
  titleContainer: {
    marginTop: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginLeft: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#CCCCCC",
    marginVertical: 15,
  },
  dividerItems: {
    height: 1,
    backgroundColor: "#CCCCCC",
    marginVertical: 15,
  },
  themeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  themeTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginLeft: 15,
  },
  menuItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  drawerItem: {
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#000000", 
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E80000",
    justifyContent: "center",
  },
  logoutButtonPressed: {
    backgroundColor: "#8d0000ff",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});