import { useAuth } from "@/context/AuthContext";
import {
  createNewConversation,
  ensureConversationForUser,
  listMessages,
  sendUserMessage,
  subscribeToMessages,
  toUiMessage,
} from "@/services/chat";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [dbReady, setDbReady] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const unsubRef = useRef<null | (() => void)>(null);

  // Bootstrap conversation + realtime
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const conv = await ensureConversationForUser(user.id);
        if (cancelled) return;
        setConversationId(conv.id);
        const rows = await listMessages(conv.id);
        if (cancelled) return;
        setMessages(rows.map((m) => toUiMessage(m, user.id)));

        // Subscribe to realtime changes
        unsubRef.current = subscribeToMessages(conv.id, (row, type) => {
          setMessages((prev) => {
            const ui = toUiMessage(row, user.id);
            if (type === "DELETE") {
              return prev.filter((m) => m.id !== ui.id);
            }
            // INSERT or UPDATE -> upsert by id
            const idx = prev.findIndex((m) => m.id === ui.id);
            if (idx === -1) return [...prev, ui];
            const copy = prev.slice();
            copy[idx] = ui;
            return copy;
          });
        });

        setDbReady(true);
      } catch (err) {
        console.warn("[Chat] DB not ready or tables missing:", err);
        // Seed a local welcome message when DB is unavailable
        setMessages([
          {
            id: "welcome",
            text: `Hola! Soy Juan Pablo, ¿en qué te puedo ayudar?`,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        setDbReady(false);
      }
    })();

    return () => {
      cancelled = true;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [user?.id]);

  const sendMessage = async () => {
    if (inputText.trim() === "") return;

    const content = inputText;
    setInputText("");

    if (dbReady && conversationId && user?.id) {
      try {
        await sendUserMessage(conversationId, user.id, content);
      } catch (err) {
        console.error("Error enviando mensaje a Supabase:", err);
        // Fallback local append
        const localMsg: Message = {
          id: Date.now().toString(),
          text: content,
          isUser: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, localMsg]);
      }
    } else {
      // Local-only fallback when DB not ready
      const localMsg: Message = {
        id: Date.now().toString(),
        text: content,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, localMsg]);

      // Simular respuesta del bot en modo local
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: "Gracias por tu mensaje. ¿En qué más puedo ayudarte?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }, 800);
    }
  };

  const startNewConversation = () => {
    Alert.alert(
      "Nueva conversación",
      "¿Quieres empezar una nueva conversación? El historial actual se guardará.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar nueva",
          style: "destructive",
          onPress: async () => {
            if (!user?.id) return;
            try {
              // Unsubscribe from current conversation
              if (unsubRef.current) {
                unsubRef.current();
                unsubRef.current = null;
              }

              // Create new conversation
              const newConv = await createNewConversation(user.id);
              setConversationId(newConv.id);
              setMessages([]);

              // Subscribe to new conversation
              unsubRef.current = subscribeToMessages(newConv.id, (row, type) => {
                setMessages((prev) => {
                  const ui = toUiMessage(row, user.id);
                  if (type === "DELETE") {
                    return prev.filter((m) => m.id !== ui.id);
                  }
                  const idx = prev.findIndex((m) => m.id === ui.id);
                  if (idx === -1) return [...prev, ui];
                  const copy = prev.slice();
                  copy[idx] = ui;
                  return copy;
                });
              });
            } catch (err) {
              console.error("[Chat] Error creating new conversation:", err);
              Alert.alert("Error", "No se pudo crear una nueva conversación");
            }
          },
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isUser ? styles.userText : styles.botText,
          ]}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Connection banner */}
        {!dbReady && (
          <View style={[styles.banner, { backgroundColor: "#FFF4E5", borderColor: "#FFD8A8" }]}> 
            <Text style={{ color: "#8B5E00" }}>
              Modo local: habilita las tablas 'conversations' y 'messages' en Supabase para chat en tiempo real.
            </Text>
          </View>
        )}

        {/* Bot Info */}
        <View style={styles.botInfo}>
          <View style={styles.botIconContainer}>
            <MaterialCommunityIcons name="robot" size={40} color="#FF0000" />
          </View>
          <View style={styles.botTextContainer}>
            <Text style={styles.botName}>
              {"Juan Pablo"} - <Text style={styles.botRole}>Asistente Virtual</Text>
            </Text>
          </View>
          {dbReady && messages.length > 0 && (
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={startNewConversation}
            >
              <MaterialCommunityIcons name="plus-circle" size={28} color="#FF0000" />
            </TouchableOpacity>
          )}
        </View>

        {/* Chat Started Info */}
        <View style={styles.chatStartInfo}>
          <Text style={styles.chatStartTitle}>Hoy</Text>
          <Text style={styles.chatStartTime}>
            Chat iniciado {formatTime(new Date())}
          </Text>
        </View>

        {/* Messages List */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe aquí..."
            placeholderTextColor="#999999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={inputText.trim() === ""}
          >
            <MaterialCommunityIcons
              name="send"
              size={24}
              color={inputText.trim() === "" ? "#CCCCCC" : "#FF0000"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
  },
  logoTextRed: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF0000",
  },
  botInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  botIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FF0000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  botTextContainer: {
    flex: 1,
  },
  newChatButton: {
    padding: 8,
  },
  botName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  botRole: {
    fontStyle: "italic",
    fontWeight: "400",
    color: "#666666",
  },
  chatStartInfo: {
    alignItems: "center",
    paddingVertical: 16,
  },
  chatStartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  chatStartTime: {
    fontSize: 14,
    color: "#666666",
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  botMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    position: "relative",
  },
  userBubble: {
    backgroundColor: "#E3F2FD",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#E8E8F5",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#000000",
  },
  botText: {
    color: "#000000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    fontSize: 15,
    color: "#000000",
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
