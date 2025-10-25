import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!loading) {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [user, loading]);

  if (loading || checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(drawer)/(tabs)/stackhome" />;
}