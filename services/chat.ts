import { supabase } from "@/supabase";
import { url, ENDPOINTS, API_BASE_URL } from "@/config/api";

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
  try {
    console.log("[Chat] User message inserted", {
      id: data?.id,
      conversationId,
      userId,
      contentPreview: content?.slice(0, 120),
      contentLength: content?.length,
    });
  } catch {}

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
    console.log("[Chat] Preparing Lambda request", {
      API_BASE_URL,
      endpoint: ENDPOINTS.chat,
      conversationId,
      userId,
      messageId,
      userMessagePreview: userMessage?.slice(0, 120),
      userMessageLength: userMessage?.length,
    });
    
    // Formatear historial para la Lambda
    console.log("[Chat] History loaded", { count: history.length });
    const messageHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content || "",
      timestamp: msg.created_at,
    }));

    // Usar la URL configurada desde .env para el bridge MCP
    try {
      console.log("[Chat] Lambda request payload (summary)", {
        historyLen: messageHistory.length,
        firstRoles: messageHistory.slice(0, 3).map((m) => m.role),
        lastRoles: messageHistory.slice(-3).map((m) => m.role),
      });
    } catch {}
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
    try {
      console.log("[Chat] Lambda response (summary)", {
        ok: response.ok,
        status: response.status,
        keys: Object.keys(data || {}),
        hasData: !!data?.data,
        hasContent: Array.isArray(data?.data?.content),
        contentLen: Array.isArray(data?.data?.content) ? data.data.content.length : 0,
        hasStructuredContent: !!data?.data?.structuredContent,
        scKeys: data?.data?.structuredContent ? Object.keys(data.data.structuredContent) : [],
      });
    } catch {}
    // Insertar mensaje del asistente en Supabase (el bridge actual no lo hace)
    try {
      const assistantText = extractAssistantText(data);
      const deepLink = extractDeepLink(data);
    
      console.log("[Chat] Extracted values:", {
        textLength: assistantText?.length || 0,
        textPreview: assistantText ? assistantText.slice(0, 100) : null,
        textStartsWith: assistantText ? assistantText.slice(0, 10) : null,
        isJSON: assistantText ? assistantText.startsWith('{') : false,
        hasDeepLink: !!deepLink,
        deepLink: deepLink || null,
      });
      if (assistantText) {
        const { data: inserted, error: insErr } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            author_id: null,
            role: "assistant",
            content: assistantText,
            message_type: "text",
            status: "sent",
            payload: deepLink ? { deep_link: deepLink } : null, // Guardar deep link en payload
          })
          .select("*")
          .single();
        if (insErr) {
          console.warn("[Chat] Supabase insert assistant FAILED", {
            code: (insErr as any)?.code,
            details: (insErr as any)?.details,
            hint: (insErr as any)?.hint,
            message: insErr.message,
          });
        } else {
          console.log("[Chat] Assistant message inserted", {
            id: inserted?.id,
            conversationId,
            contentLen: inserted?.content?.length,
            hasDeepLink: !!deepLink,
          });
        }
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

// Extrae el deep link de la respuesta del MCP (para abrir el mapa)
function extractDeepLink(resp: any): string | null {
  if (!resp) return null;
  
  const payload = resp?.data ?? resp;
  
  console.log('[extractDeepLink] Checking payload:', {
    hasContent: Array.isArray(payload?.content),
    contentLength: Array.isArray(payload?.content) ? payload.content.length : 0,
    firstItem: Array.isArray(payload?.content) && payload.content[0] 
      ? { type: payload.content[0].type, textPreview: payload.content[0].text?.slice(0, 100) }
      : null
  });
  
  // CASO ESPECIAL: Si content es un array con JSON string (formato MCP)
  if (Array.isArray(payload?.content)) {
    for (const item of payload.content) {
      if (item?.type === 'text' && item?.text) {
        console.log('[extractDeepLink] Attempting to parse text:', item.text.slice(0, 200));
        try {
          // PRIMER PARSEO: El wrapper del Lambda
          const parsed = JSON.parse(item.text);
          console.log('[extractDeepLink] First parse successful!', { 
            hasDeepLink: !!parsed?.deep_link,
            hasData: !!parsed?.data,
            hasResponse: !!parsed?.data?.response 
          });
          
          // Si el deep_link está directamente aquí, retornarlo
          if (parsed?.deep_link && typeof parsed.deep_link === 'string') {
            console.log('[extractDeepLink] ✅ Found deep_link at root:', parsed.deep_link);
            return parsed.deep_link;
          }
          
          // SEGUNDO PARSEO: El contenido real del MCP está en data.response como string
          if (parsed?.data?.response && typeof parsed.data.response === 'string') {
            console.log('[extractDeepLink] Found nested response, attempting second parse...');
            try {
              const innerParsed = JSON.parse(parsed.data.response);
              console.log('[extractDeepLink] Second parse successful!', { hasDeepLink: !!innerParsed?.deep_link });
              if (innerParsed?.deep_link && typeof innerParsed.deep_link === 'string') {
                console.log('[extractDeepLink] ✅ Found deep_link in nested response:', innerParsed.deep_link);
                return innerParsed.deep_link;
              }
            } catch (innerErr) {
              console.log('[extractDeepLink] ❌ Second parse failed:', (innerErr as Error).message);
            }
          }
        } catch (e) {
          console.log('[extractDeepLink] ❌ First parse failed:', (e as Error).message);
          // No es JSON, continuar
        }
      }
    }
  }
  
  // También intentar parsear desde structuredContent.data.response
  if (payload?.structuredContent?.data?.response && typeof payload.structuredContent.data.response === 'string') {
    console.log('[extractDeepLink] Found structuredContent.data.response, attempting parse...');
    try {
      const parsed = JSON.parse(payload.structuredContent.data.response);
      if (parsed?.deep_link && typeof parsed.deep_link === 'string') {
        console.log('[extractDeepLink] ✅ Found deep_link in structuredContent:', parsed.deep_link);
        return parsed.deep_link;
      }
    } catch (e) {
      console.log('[extractDeepLink] ❌ Failed to parse structuredContent.data.response');
    }
  }
  
  // Buscar deep_link en diferentes niveles
  if (payload?.deep_link && typeof payload.deep_link === 'string') {
    return payload.deep_link;
  }
  
  if (payload?.data?.deep_link && typeof payload.data.deep_link === 'string') {
    return payload.data.deep_link;
  }
  
  // Buscar en structuredContent
  if (payload?.structuredContent?.data?.deep_link) {
    return payload.structuredContent.data.deep_link;
  }
  
  return null;
}


// Intenta extraer el texto útil de varias posibles formas de respuesta
// También maneja respuestas estructuradas como deep links para abrir el mapa
function extractAssistantText(resp: any): string | null {
  if (!resp) return null;

  // En el bridge, el cuerpo esperado es { success, data, ... }
  const payload = resp?.data ?? resp;

  // Detectar si es una respuesta con deep link del mapa
  if (payload?.deep_link && payload?.user_message) {
    // Formato: { deep_link: "fiscai://map?type=bank&placeId=...", user_message: "..." }
    return payload.user_message;
  }

  // 1) Si es string directo
  if (typeof payload === "string") return payload;

  // 2) Candidatos comunes directos (NO incluir response, puede ser JSON string)
  const candidates: Array<any> = [
    payload?.text,
    payload?.message,
    payload?.output,
    payload?.result,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
    if (typeof c === "object" && c?.text && typeof c.text === "string") return c.text;
  }
  
  // 2.5) Si payload.data.response es un string (respuesta del MCP), intentar parsear
  if (payload?.data?.response && typeof payload.data.response === 'string') {
    console.log('[extractAssistantText] Found payload.data.response, attempting parse...');
    try {
      const parsed = JSON.parse(payload.data.response);
      console.log('[extractAssistantText] Parsed successfully!', { hasText: !!parsed?.text });
      if (parsed?.text && typeof parsed.text === 'string') {
        console.log('[extractAssistantText] ✅ Found text in payload.data.response:', parsed.text.slice(0, 50));
        return parsed.text;
      }
    } catch (e) {
      // No es JSON, retornar el string directo
      console.log('[extractAssistantText] payload.data.response is not JSON, using as-is');
      return payload.data.response;
    }
  }
  
  // También probar payload.response directo (por si viene sin data wrapper)
  if (payload?.response && typeof payload.response === 'string') {
    console.log('[extractAssistantText] Found payload.response, checking if JSON...');
    try {
      const parsed = JSON.parse(payload.response);
      if (parsed?.text && typeof parsed.text === 'string') {
        console.log('[extractAssistantText] ✅ Parsed payload.response, found text');
        return parsed.text;
      }
    } catch (e) {
      // No es JSON, retornar el string directo
      console.log('[extractAssistantText] payload.response is not JSON, using as-is');
      return payload.response;
    }
  }

  // 3) structuredContent: priorizar si viene texto limpio ahí (evita strings JSON en content)
  const sc = payload?.structuredContent;
  if (sc) {
    // Primero intentar parsear sc.data.response si existe (puede ser JSON del MCP)
    if (sc?.data?.response && typeof sc.data.response === 'string') {
      console.log('[extractAssistantText] Found structuredContent.data.response, attempting parse...');
      try {
        const parsed = JSON.parse(sc.data.response);
        if (parsed?.text && typeof parsed.text === 'string') {
          console.log('[extractAssistantText] ✅ Found text in structuredContent.data.response:', parsed.text.slice(0, 50));
          return parsed.text;
        }
      } catch (e) {
        console.log('[extractAssistantText] structuredContent.data.response is not JSON');
        // Si no es JSON, intentar usar el string directo
        if (sc.data.response.trim()) {
          return sc.data.response;
        }
      }
    }
    
    // Mensaje humano-para-humano (no siempre es la respuesta principal)
    let fallbackMsg: string | null = null;
    if (typeof sc.message === "string" && sc.message.trim()) {
      fallbackMsg = sc.message as string;
    }
    const data = sc.data;
    if (typeof data === "string" && data.trim()) return data;
    const deep = findFirstString(data);
    if (deep) return deep;
    if (fallbackMsg) return fallbackMsg;
  }

  // 4) Formato MCP: content puede venir anidado (p.ej. [[{ type: 'text', text: '...' }]])
  const getTextFromParts = (parts: any[]): string | null => {
    for (const part of parts) {
      if (!part) continue;
      // Si es otro array, revisar recursivamente
      if (Array.isArray(part)) {
        const t = getTextFromParts(part);
        if (t) return t;
      } else if (typeof part === "object") {
        if (part.type === "text" && typeof part.text === "string" && part.text.trim()) {
          // CASO ESPECIAL: Intentar parsear como JSON si contiene deep_link o success
          if (part.text.includes('deep_link') || part.text.includes('"success"')) {
            try {
              // PRIMER PARSEO: Wrapper del Lambda
              const parsed = JSON.parse(part.text);
              console.log('[extractAssistantText] First parse successful', {
                hasText: !!parsed?.text,
                hasData: !!parsed?.data,
                hasResponse: !!parsed?.data?.response
              });
              
              // Si el texto está directamente aquí, retornarlo
              if (parsed?.text && typeof parsed.text === 'string') {
                console.log('[extractAssistantText] ✅ Found text at root');
                return parsed.text;
              }
              
              // SEGUNDO PARSEO: El contenido real del MCP está en data.response como string
              if (parsed?.data?.response && typeof parsed.data.response === 'string') {
                console.log('[extractAssistantText] Found nested response, attempting second parse...');
                try {
                  const innerParsed = JSON.parse(parsed.data.response);
                  if (innerParsed?.text && typeof innerParsed.text === 'string') {
                    console.log('[extractAssistantText] ✅ Found text in nested response:', innerParsed.text.slice(0, 50));
                    return innerParsed.text;
                  }
                  // Si no tiene campo text, pero parseó bien, buscar en el objeto
                  console.log('[extractAssistantText] ⚠️ No text field in inner parse, keys:', Object.keys(innerParsed));
                } catch (innerErr) {
                  console.log('[extractAssistantText] ❌ Second parse failed, error:', (innerErr as Error).message);
                  // NO retornar nada aquí, seguir buscando
                }
              }
              
              // Si llegamos aquí y parsed.data existe, intentar buscar más profundo
              if (parsed?.data && !parsed?.data?.response) {
                console.log('[extractAssistantText] Checking parsed.data keys:', Object.keys(parsed.data));
              }
              
              // NO retornar el JSON crudo, seguir buscando en otros lugares
              console.log('[extractAssistantText] ⚠️ JSON detected but not parsed, continuing search...');
              continue; // Saltar al siguiente item en lugar de retornar
            } catch (e) {
              // No es JSON válido, usar texto directo
              console.log('[extractAssistantText] Not JSON, using direct text');
              return part.text;
            }
          }
          // Solo retornar part.text si NO es JSON
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
    const keysPriority = ["response", "text", "answer", "content", "message", "summary", "output", "result"];
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
  console.log("[Chat] Subscribing to messages", { conversationId });
  const channel = supabase
    .channel(`realtime:messages:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        // payload.new for INSERT/UPDATE, payload.old for DELETE
        const type = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        const row = (type === "DELETE" ? (payload.old as any) : (payload.new as any)) as MessageRow;
        try {
          console.log("[Chat] Realtime event", {
            type,
            id: row?.id,
            role: row?.role,
            author_id: row?.author_id,
            contentPreview: row?.content ? row.content.slice(0, 120) : null,
          });
        } catch {}
        onChange(row, type);
      }
    )
    .subscribe();

  return () => {
    console.log("[Chat] Unsubscribing messages", { conversationId });
    supabase.removeChannel(channel);
  };
}

// Helper to map DB message to UI-friendly shape
export function toUiMessage(m: MessageRow, currentUserId: string) {
  // Elimina los dobles asteriscos ** del texto
  const cleanText = (m.content ?? "").replace(/\*\*(.*?)\*\*/g, '$1');
  return {
    id: m.id,
    text: cleanText,
    isUser: m.role === "user" && m.author_id === currentUserId,
    timestamp: new Date(m.created_at),
    deepLink: m.payload?.deep_link ?? undefined, // Extraer deep link del payload
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
