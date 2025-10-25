import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.CLIENT_ID;
const REDIRECT_URI = "https://auth.expo.io/@ruben_yh/fiscai";
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export default function GoogleCalendar() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID!,
      redirectUri: REDIRECT_URI,
      scopes: SCOPES,
      responseType: "token",
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === "success" && response.params.access_token) {
      setToken(response.params.access_token);
    }
  }, [response]);

  const addEvent = async () => {
    if (!token) return;
    const event = {
      summary: "Test Event",
      description: "Created from the app",
      start: { dateTime: "2025-10-26T10:00:00-07:00" },
      end: { dateTime: "2025-10-26T11:00:00-07:00" },
    };

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    const data = await res.json();
    console.log("Event created:", data);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 10 }}>
        Connected user: {user?.email ?? "none"}
      </Text>
      {!token ? (
        <Button title="Connect Google Calendar" onPress={() => promptAsync()} />
      ) : (
        <Button title="Add Test Event" onPress={addEvent} />
      )}
    </View>
  );
}
