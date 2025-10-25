# 🤖 Flujo del Chatbot - Análisis y Mejoras

## ✅ Lo que YA tenías funcionando

### 1. **Persistencia de conversaciones**
- ✅ Una conversación por usuario (`ensureConversationForUser`)
- ✅ Mensajes guardados en Supabase
- ✅ Sincronización en tiempo real vía Realtime

### 2. **Estructura básica**
- ✅ UI de chat con burbujas user/bot
- ✅ Input de texto y botón enviar
- ✅ Fallback a modo local si DB no disponible

## 🚀 Mejoras implementadas

### 1. **Historial completo a Lambda** ⭐
**Antes:**
```typescript
// Solo se enviaba el último mensaje
{
  message: "¿Cuánto debo pagar de ISR?"
}
```

**Ahora:**
```typescript
// Se envía TODO el contexto
{
  message: "¿Cuánto debo pagar de ISR?",  // Prompt actual
  history: [
    { role: "user", content: "Hola, soy emprendedor", timestamp: "..." },
    { role: "assistant", content: "¡Hola! ¿En qué te ayudo?", timestamp: "..." },
    { role: "user", content: "Tengo dudas sobre impuestos", timestamp: "..." },
    { role: "assistant", content: "Con gusto te ayudo...", timestamp: "..." },
    { role: "user", content: "¿Cuánto debo pagar de ISR?", timestamp: "..." }
  ]
}
```

**Beneficio:** Tu Lambda/Gemini puede entender el contexto completo de la conversación.

---

### 2. **Nueva conversación (Start Over)** ⭐
**Funciones agregadas:**
```typescript
createNewConversation(userId)  // Crea nueva conversación
listConversations(userId)       // Lista todas las conversaciones
updateConversationTitle(id, title)  // Actualiza título
```

**UI agregada:**
- ✅ Botón `+` en el header del bot (solo aparece si hay mensajes)
- ✅ Alert de confirmación antes de crear nueva conversación
- ✅ Limpia mensajes y re-suscribe a Realtime

**Cómo funciona:**
1. Usuario hace clic en botón `+`
2. Confirma que quiere nueva conversación
3. Se guarda conversación actual automáticamente
4. Se crea nueva conversación vacía
5. Realtime se actualiza al nuevo `conversation_id`

---

### 3. **Títulos automáticos** ⭐
**Antes:** `title: null` en todas las conversaciones

**Ahora:**
- Primera conversación → `"Nueva conversación"`
- Después del primer mensaje → Los primeros 50 caracteres del mensaje

**Ejemplo:**
```
"Hola, necesito ayuda con mi declaración anual..."
```

---

### 4. **Payload estructurado para Lambda**

La Lambda ahora recibe:
```json
{
  "conversation_id": "uuid-123",
  "user_id": "uuid-456",
  "message": "¿Cuánto debo pagar de ISR?",  // ← El prompt actual
  "message_id": "uuid-789",
  "history": [                               // ← TODO el contexto
    {
      "role": "user",
      "content": "Hola, soy emprendedor",
      "timestamp": "2025-10-25T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "¡Hola! ¿En qué te ayudo?",
      "timestamp": "2025-10-25T10:30:05Z"
    }
    // ... más mensajes
  ]
}
```

---

## 🎯 Cómo funciona el flujo completo

### **Flujo normal (con DB):**

```
┌─────────────┐
│ Usuario     │
│ escribe     │
│ mensaje     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ sendUserMessage()   │  ← Inserta mensaje en Supabase
│ role: "user"        │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────┐
│ processMessageWithLambda()   │
│ 1. Carga historial completo  │
│ 2. Formatea para Lambda      │
│ 3. POST a Lambda con history │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────┐
│ AWS Lambda           │  ← Tu código con Gemini
│ 1. Recibe history    │
│ 2. Consulta RAG      │
│ 3. Llama Gemini      │
│ 4. Inserta respuesta │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Supabase Realtime    │  ← Notifica a la app
│ INSERT en messages   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ App recibe mensaje   │
│ via subscribeToMessages()
│ Actualiza UI         │
└──────────────────────┘
```

---

### **Flujo de nueva conversación:**

```
Usuario: [Click en botón +]
         ↓
Alert: "¿Iniciar nueva conversación?"
         ↓ [Confirma]
Unsubscribe de conversación actual
         ↓
createNewConversation(userId)
         ↓
INSERT en tabla conversations
         ↓
Limpia mensajes en UI
         ↓
Subscribe a nueva conversation_id
         ↓
Usuario empieza desde cero ✅
```

---

## 📝 Para tu Lambda (Python)

Tu Lambda ahora debe procesar el payload así:

```python
import json
from supabase import create_client
import google.generativeai as genai

def lambda_handler(event, context):
    body = json.loads(event['body'])
    
    conversation_id = body['conversation_id']
    user_id = body['user_id']
    current_message = body['message']      # ← El último mensaje
    history = body['history']              # ← TODO el contexto
    message_id = body['message_id']
    
    # 1. Formatear historial para Gemini
    gemini_history = []
    for msg in history[:-1]:  # Excluye el último (ya está en current_message)
        gemini_history.append({
            "role": "user" if msg['role'] == 'user' else "model",
            "parts": [msg['content']]
        })
    
    # 2. Consultar RAG (fiscai_documents)
    supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    embedding = generar_embedding(current_message)
    docs = supabase.rpc('match_documents', {
        'query_embedding': embedding,
        'match_threshold': 0.7,
        'match_count': 5
    }).execute()
    
    context = "\n\n".join([doc['content'] for doc in docs.data])
    
    # 3. Llamar a Gemini con historial + RAG
    model = genai.GenerativeModel('gemini-1.5-flash')
    chat = model.start_chat(history=gemini_history)
    
    prompt = f"""Contexto de documentos fiscales:
{context}

Pregunta del usuario: {current_message}

Responde como Juan Pablo, experto fiscal mexicano."""
    
    response = chat.send_message(prompt)
    
    # 4. Insertar respuesta en Supabase
    supabase.table('messages').insert({
        'conversation_id': conversation_id,
        'author_id': None,
        'role': 'assistant',
        'content': response.text,
        'message_type': 'text',
        'status': 'sent'
    }).execute()
    
    return {
        'statusCode': 200,
        'body': json.dumps({'success': True})
    }
```

---

## 🔧 Archivos modificados

### 1. **services/chat.ts**
- ✅ Agregado `createNewConversation()`
- ✅ Agregado `listConversations()`
- ✅ Agregado `updateConversationTitle()`
- ✅ Modificado `processMessageWithLambda()` para enviar historial completo
- ✅ Auto-genera título de conversación

### 2. **app/(drawer)/(tabs)/stackchat/index.tsx**
- ✅ Agregado botón `+` en header del bot
- ✅ Agregada función `startNewConversation()`
- ✅ Alert de confirmación
- ✅ Re-suscripción a Realtime en nueva conversación

---

## 🎨 UX mejorada

### **Antes:**
```
┌──────────────────────┐
│  🤖 Juan Pablo       │
│  Asistente Virtual   │
└──────────────────────┘
│ Hola, ¿en qué ayudo? │
│ Tengo dudas...       │
│ Claro, dime          │
│ ... (conversación infinita, sin reset)
```

### **Ahora:**
```
┌──────────────────────┐
│  🤖 Juan Pablo    [+]│  ← Botón para nueva conversación
│  Asistente Virtual   │
└──────────────────────┘
│ Hola, ¿en qué ayudo? │
│ Tengo dudas...       │
│ Claro, dime          │
│ (usuario hace clic en +)
│ → "¿Iniciar nueva conversación?"
│ → Historial anterior guardado ✅
│ → Conversación limpia, empezar desde 0
```

---

## 🚀 Lo que sigue (futuro)

### **Próximas features:**
1. **Lista de conversaciones pasadas** - Ver historial de chats anteriores
2. **Tool calls (MCP)** - Llamadas a funciones de mapa/calendar desde el chat
3. **Búsqueda en conversaciones** - Buscar mensajes en todo el historial
4. **Exportar conversación** - Descargar PDF del chat

---

## 📊 Comparación

| Feature | Antes | Ahora |
|---------|-------|-------|
| Historial a Lambda | ❌ Solo último mensaje | ✅ Contexto completo |
| Nueva conversación | ❌ No disponible | ✅ Botón + con confirmación |
| Título automático | ❌ Siempre null | ✅ Auto-generado |
| Estructura para chatbot | ❌ Chat simple | ✅ Sistema completo |
| Contexto de conversación | ❌ Sin memoria | ✅ Memoria completa |

---

## ✅ Checklist de implementación

- [x] Enviar historial completo a Lambda
- [x] Botón de nueva conversación
- [x] Alert de confirmación
- [x] Títulos automáticos
- [x] Re-suscripción a Realtime
- [x] Limpieza de estado en nueva conversación
- [ ] Tu Lambda procesando el historial (pendiente tu implementación)
- [ ] Lista de conversaciones en drawer (futuro)

---

## 🎯 Resultado final

**Ahora tienes un chatbot completo con:**
- ✅ Memoria de conversación (contexto completo)
- ✅ Capacidad de empezar de nuevo
- ✅ Títulos automáticos para organización
- ✅ Realtime sync
- ✅ Fallback a modo local
- ✅ Manejo de errores robusto

**Tu Lambda recibe:**
```json
{
  "message": "Pregunta actual",
  "history": [/* array con toda la conversación */]
}
```

¡Todo listo para que Gemini tenga contexto completo! 🚀
