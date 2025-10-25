import { supabase } from "@/config/supabase";
import { url, ENDPOINTS } from "@/config/api";

export type Role = "user" | "assistant" | "system" | "tool";

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  author_id: string | null;
  role: Role;
  content: string | null;
  message_type: string | null;
  payload: any | null;
  status: string | null;
  created_at: string;
}

export async function ensureConversationForUser(userId: string): Promise<Conversation> {
  // Try to find latest conversation for the user
  const { data: existing, error: qErr } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (qErr && qErr.code !== "PGRST116") throw qErr; // ignore not found

  if (existing) return existing as Conversation;

  // Create new conversation
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title: "Nueva conversación" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Conversation;
}

// Create a new conversation (for "start over" button)
export async function createNewConversation(userId: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title: "Nueva conversación" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Conversation;
}

// List all conversations for a user
export async function listConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

// Update conversation title (auto-generate from first message)
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function listMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function sendUserMessage(
  conversationId: string,
  userId: string,
  content: string
): Promise<MessageRow> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      author_id: userId,
      role: "user",
      content,
      message_type: "text",
      status: "sent",
    })
    .select("*")
    .single();
  if (error) throw error;

  // Llamar a tu Lambda para generar respuesta del asistente
  // (sin await para no bloquear, la respuesta llegará por Realtime)
  processMessageWithLambda(conversationId, userId, content, data.id).catch((err) =>
    console.warn("[Chat] Error calling Lambda:", err)
  );

  return data as MessageRow;
}

// Llama a tu AWS Lambda para procesar el mensaje
async function processMessageWithLambda(
  conversationId: string,
  userId: string,
  userMessage: string,
  messageId: string
) {
  try {
    // Obtener TODO el historial de la conversación
    const history = await listMessages(conversationId);
    
    // Formatear historial para la Lambda
    const messageHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content || "",
      timestamp: msg.created_at,
    }));

    // Usar la URL configurada desde .env para el bridge MCP
    const response = await fetch(url(ENDPOINTS.chat), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        user_id: userId,
        message: userMessage, // El último mensaje (prompt actual)
        message_id: messageId,
        history: messageHistory, // TODO el contexto de la conversación
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No response body");
      throw new Error(
        `Lambda error: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json().catch(() => ({}));
    console.log("[Chat] Lambda response:", data);

    // Insertar mensaje del asistente en Supabase (el bridge actual no lo hace)
    try {
      const assistantText = extractAssistantText(data);
      if (assistantText) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          author_id: null,
          role: "assistant",
          content: assistantText,
          message_type: "text",
          status: "sent",
        });
      }
    } catch (insertErr) {
      console.warn("[Chat] Could not insert assistant message:", insertErr);
    }

    // Auto-generar título si es la primera interacción
    if (history.length <= 1) {
      // Solo mensaje del usuario, generar título
      const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
      updateConversationTitle(conversationId, title).catch((err) =>
        console.warn("[Chat] Failed to update title:", err)
      );
    }
  } catch (error) {
    console.error("[Chat] Lambda call failed:", error);

    // Determinar mensaje de error según el tipo
    let errorMessage =
      "Lo siento, hubo un error procesando tu mensaje. Intenta de nuevo.";
    if (error instanceof Error && error.message.includes("404")) {
      errorMessage =
        "🚧 El servicio de IA aún no está disponible. Tu mensaje se guardó correctamente.";
    } else if (error instanceof Error && error.message.includes("Network")) {
      errorMessage =
        "⚠️ No hay conexión. Verifica tu internet e intenta de nuevo.";
    }

    // Insertar mensaje de error en la base de datos
    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        author_id: null,
        role: "assistant",
        content: errorMessage,
        message_type: "text",
        status: "error",
      });
    } catch (insertError) {
      console.error("[Chat] Failed to insert error message:", insertError);
    }
  }
}

// Intenta extraer el texto útil de varias posibles formas de respuesta
function extractAssistantText(resp: any): string | null {
  if (!resp) return null;

  // En el bridge, el cuerpo esperado es { success, data, ... }
  const payload = resp?.data ?? resp;

  // 1) Si es string directo
  if (typeof payload === "string") return payload;

  // 2) Candidatos comunes directos
  const candidates: Array<any> = [
    payload?.text,
    payload?.message,
    payload?.output,
    payload?.response,
    payload?.result,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
    if (typeof c === "object" && c?.text && typeof c.text === "string") return c.text;
  }

  // 3) Formato MCP: content puede venir anidado (p.ej. [[{ type: 'text', text: '...' }]])
  const getTextFromParts = (parts: any[]): string | null => {
    for (const part of parts) {
      if (!part) continue;
      // Si es otro array, revisar recursivamente
      if (Array.isArray(part)) {
        const t = getTextFromParts(part);
        if (t) return t;
      } else if (typeof part === "object") {
        if (part.type === "text" && typeof part.text === "string" && part.text.trim()) {
          return part.text;
        }
        if (typeof part.text === "string" && part.text.trim()) return part.text;
      } else if (typeof part === "string" && part.trim()) {
        return part;
      }
    }
    return null;
  };

  if (Array.isArray(payload?.content)) {
    const textFromContent = getTextFromParts(payload.content);
    if (textFromContent) return textFromContent;
  }

  // 4) structuredContent: tratar de extraer texto de campos comunes
  const sc = payload?.structuredContent;
  if (sc) {
    // Mensaje humano-para-humano (no siempre es la respuesta principal)
    let fallbackMsg: string | null = null;
    if (typeof sc.message === "string" && sc.message.trim()) {
      // Evitar devolver solo un mensaje meta si hay data útil
      // lo usaremos solo si no hay texto mejor
      fallbackMsg = sc.message as string;
    }
    const data = sc.data;
    // Si data es string directa
    if (typeof data === "string" && data.trim()) return data;
    // Si data es objeto o array, buscar campos text/answer/content
    const deep = findFirstString(data);
    if (deep) return deep;
    if (fallbackMsg) return fallbackMsg;
  }

  // 5) buscar en profundidad por el primer string razonable
  const deepAny = findFirstString(payload);
  if (deepAny) return deepAny;

  // 6) Fallback: serializar acotado (evita payloads enormes)
  try {
    const s = JSON.stringify(payload);
    return s.length > 4000 ? s.slice(0, 4000) + "…" : s;
  } catch {
    return null;
  }
}

function findFirstString(obj: any): string | null {
  if (!obj) return null;
  if (typeof obj === "string" && obj.trim()) return obj;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const s = findFirstString(item);
      if (s) return s;
    }
    return null;
  }
  if (typeof obj === "object") {
    // Priorizar campos comunes
    const keysPriority = ["text", "answer", "content", "message", "summary", "output", "result"];
    for (const k of keysPriority) {
      if (typeof obj[k] === "string" && obj[k].trim()) return obj[k];
    }
    for (const key of Object.keys(obj)) {
      const s = findFirstString(obj[key]);
      if (s) return s;
    }
  }
  return null;
}

export type Unsubscribe = () => void;

export function subscribeToMessages(
  conversationId: string,
  onChange: (row: MessageRow, type: "INSERT" | "UPDATE" | "DELETE") => void
): Unsubscribe {
  const channel = supabase
    .channel(`realtime:messages:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        // payload.new for INSERT/UPDATE, payload.old for DELETE
        const type = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        const row = (type === "DELETE" ? (payload.old as any) : (payload.new as any)) as MessageRow;
        onChange(row, type);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Helper to map DB message to UI-friendly shape
export function toUiMessage(m: MessageRow, currentUserId: string) {
  return {
    id: m.id,
    text: m.content ?? "",
    isUser: m.role === "user" && m.author_id === currentUserId,
    timestamp: new Date(m.created_at),
  };
}

// Development helper: insert an assistant message (requires relaxed policy or service role).
export async function sendAssistantMessage(
  conversationId: string,
  content: string
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      author_id: null,
      role: "assistant",
      content,
      message_type: "text",
      status: "sent",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as MessageRow;
}

// Placeholder for future tool calls (map/calendar, etc.)
export async function sendToolCall(
  conversationId: string,
  userId: string,
  tool: "map" | "calendar" | "other",
  payload: any
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      author_id: userId,
      role: "tool",
      content: null,
      message_type: tool,
      payload,
      status: "queued",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as MessageRow;
}
