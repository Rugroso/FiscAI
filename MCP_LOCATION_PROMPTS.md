# Configuración del MCP para Detección Automática de Ubicaciones

## 🎯 Objetivo

Que el chatbot detecte automáticamente cuando el usuario pregunta sobre ubicaciones de bancos o oficinas del SAT, y automáticamente llame a la herramienta `open_map_location` para generar un deep link al mapa.

## 📝 Prompts del Sistema para el MCP

El servidor MCP debe incluir estos prompts en la configuración de Gemini para que detecte las intenciones del usuario:

### System Prompt Principal (gemini.py)

```python
SYSTEM_PROMPT = """
Eres Juan Pablo, un asistente fiscal experto en México especializado en ayudar a micro y pequeños negocios.

**CAPACIDADES ESPECIALES:**

1. **Ubicaciones de Bancos y SAT:**
   - Cuando el usuario pregunte sobre dónde encontrar un banco Banorte o una oficina del SAT
   - USA la herramienta 'open_map_location' para abrir el mapa
   - Ejemplos de preguntas que deben activar el mapa:
     * "¿Dónde hay un Banorte?"
     * "¿Dónde está el SAT más cercano?"
     * "Necesito ir a un banco"
     * "Muéstrame oficinas del SAT"
     * "Busca un Banorte en Reforma"
     * "¿Hay alguna oficina del SAT cerca?"
   
2. **Asesoría Fiscal:**
   - Proporciona información sobre régimen fiscal, obligaciones, trámites
   - USA la herramienta 'get_fiscal_advice' para consultas de formalización
   
3. **Análisis de Riesgo:**
   - Evalúa la situación fiscal del usuario
   - USA la herramienta 'analyze_fiscal_risk' cuando pregunten sobre su nivel de cumplimiento

**FORMATO DE RESPUESTA PARA UBICACIONES:**
Cuando uses 'open_map_location', tu respuesta debe ser breve y clara:
- "¡Claro! Te abro el mapa con los Banorte más cercanos."
- "Perfecto, te muestro las oficinas del SAT en tu zona."
- "Busco Banorte en Reforma para ti."

**NO incluyas las coordenadas o detalles técnicos en tu respuesta, eso lo maneja el mapa automáticamente.**

**Tono:** Cercano, profesional pero amigable, como un asesor de confianza.
"""
```

### Detección de Intenciones (gemini.py)

```python
def detect_user_intent(message: str) -> Dict[str, Any]:
    """
    Detecta la intención del usuario antes de llamar a Gemini
    para optimizar el uso de herramientas
    """
    message_lower = message.lower()
    
    # Palabras clave para búsqueda de ubicaciones
    location_keywords = {
        'bank': ['banorte', 'banco', 'sucursal bancaria', 'ir al banco'],
        'sat': ['sat', 'oficina del sat', 'servicio de administración tributaria', 
                'centro tributario', 'módulo de atención']
    }
    
    # Verbos que indican búsqueda de ubicación
    location_verbs = ['dónde', 'donde', 'ubica', 'encuentra', 'busca', 'hay', 
                      'mostrar', 'muestra', 'llevar', 'ir', 'cerca', 'cercano']
    
    # Detectar tipo de ubicación
    location_type = None
    if any(keyword in message_lower for keyword in location_keywords['bank']):
        location_type = 'bank'
    elif any(keyword in message_lower for keyword in location_keywords['sat']):
        location_type = 'sat'
    
    # Detectar si es una pregunta de ubicación
    is_location_query = any(verb in message_lower for verb in location_verbs)
    
    # Extraer posible query específica (nombre de lugar)
    search_query = None
    location_indicators = ['en ', 'de ', 'cerca de ', 'por ']
    for indicator in location_indicators:
        if indicator in message_lower:
            parts = message_lower.split(indicator, 1)
            if len(parts) > 1:
                # Extraer hasta el siguiente espacio o final
                search_query = parts[1].split('.')[0].split(',')[0].strip()
                break
    
    return {
        'is_location_query': is_location_query and location_type is not None,
        'location_type': location_type,
        'search_query': search_query,
        'requires_map': is_location_query and location_type is not None
    }
```

### Actualización del Handler de Chat (gemini.py)

```python
async def chat_with_assistant(
    message: str,
    user_context: Optional[Dict] = None,
    chat_history: List[Dict] = None,
    relevant_docs: List[Dict] = None
) -> str:
    """
    Procesa un mensaje del usuario y genera una respuesta
    Detecta automáticamente si debe abrir el mapa
    """
    
    # 1. Detectar intención
    intent = detect_user_intent(message)
    
    # 2. Si requiere mapa, llamar directamente a la herramienta
    if intent['requires_map']:
        print(f"[CHAT] Detección automática: requiere mapa tipo={intent['location_type']}")
        
        # Llamar a la herramienta open_map_location
        from . import open_map_location
        
        result = await open_map_location(
            location_type=intent['location_type'],
            search_query=intent['search_query']
        )
        
        # Retornar la respuesta estructurada para que el bridge la maneje
        if result['success']:
            return {
                'text': result['data']['user_message'],
                'deep_link': result['data']['deep_link'],
                'tool_used': 'open_map_location'
            }
    
    # 3. Si no requiere mapa, procesar normalmente con Gemini
    # ... resto del código de chat normal
```

## 🔧 Ejemplos de Preguntas que Activan el Mapa

### Bancos (type=bank)

```
Usuario: "¿Dónde hay un Banorte?"
Bot: "¡Claro! Te abro el mapa con los Banorte más cercanos."
[Botón: Abrir Mapa] → fiscai://map?type=bank

Usuario: "Necesito ir a un banco"
Bot: "Te muestro los bancos Banorte cercanos en el mapa."
[Botón: Abrir Mapa] → fiscai://map?type=bank

Usuario: "Busca un Banorte en Reforma"
Bot: "Busco Banorte en Reforma para ti."
[Botón: Abrir Mapa] → fiscai://map?type=bank&query=Reforma

Usuario: "¿Hay algún banco cerca de Polanco?"
Bot: "Te muestro bancos Banorte cerca de Polanco."
[Botón: Abrir Mapa] → fiscai://map?type=bank&query=Polanco
```

### Oficinas SAT (type=sat)

```
Usuario: "¿Dónde está el SAT más cercano?"
Bot: "Te muestro las oficinas del SAT en tu zona."
[Botón: Abrir Mapa] → fiscai://map?type=sat

Usuario: "Necesito ir al SAT"
Bot: "¡Claro! Te abro el mapa con las oficinas del SAT cercanas."
[Botón: Abrir Mapa] → fiscai://map?type=sat

Usuario: "Muéstrame oficinas del SAT en Centro"
Bot: "Te muestro oficinas del SAT en el Centro."
[Botón: Abrir Mapa] → fiscai://map?type=sat&query=Centro

Usuario: "¿Hay un centro tributario cerca?"
Bot: "Te muestro los centros tributarios del SAT cercanos."
[Botón: Abrir Mapa] → fiscai://map?type=sat
```

## 📦 Estructura de Respuesta del MCP

Cuando el MCP detecta una pregunta de ubicación, debe retornar:

```json
{
  "success": true,
  "data": {
    "text": "¡Claro! Te abro el mapa con los Banorte más cercanos.",
    "deep_link": "fiscai://map?type=bank",
    "location_type": "bank",
    "search_query": null,
    "tool_used": "open_map_location"
  },
  "message": "Abriendo mapa con Banorte cercanos"
}
```

### Con búsqueda específica:

```json
{
  "success": true,
  "data": {
    "text": "Busco Banorte en Reforma para ti.",
    "deep_link": "fiscai://map?type=bank&query=Reforma",
    "location_type": "bank",
    "search_query": "Reforma",
    "tool_used": "open_map_location"
  },
  "message": "Abriendo mapa buscando: Reforma"
}
```

## 🔄 Flujo Completo End-to-End

```
1. Usuario escribe: "¿Dónde hay un Banorte?"
   ↓
2. Mensaje llega al Lambda Bridge (/chat)
   ↓
3. Lambda llama al MCP Server
   ↓
4. MCP ejecuta detect_user_intent()
   → is_location_query: true
   → location_type: 'bank'
   → requires_map: true
   ↓
5. MCP llama automáticamente a open_map_location('bank')
   ↓
6. MCP retorna respuesta con deep_link
   ↓
7. Lambda Bridge retorna al app
   ↓
8. chat.ts extrae el deep_link y lo guarda en Supabase
   ↓
9. Chat component renderiza mensaje + botón "Abrir Mapa"
   ↓
10. Usuario presiona botón
   ↓
11. handleDeepLink() navega al mapa
   ↓
12. Mapa se abre y busca "Banorte" cercanos
```

## 🧪 Testing Manual

### 1. Verificar MCP Server
```bash
# En el servidor MCP, agregar logs:
python mcp_server/__main__.py

# Debe mostrar:
[CHAT] Detección automática: requiere mapa tipo=bank
[MCP] Llamando open_map_location con tipo=bank
[MCP] Deep link generado: fiscai://map?type=bank
```

### 2. Verificar Lambda Bridge
```bash
# En AWS CloudWatch o logs locales:
[MCP] Llamando herramienta: open_map_location
[MCP] Response body: { success: true, data: { deep_link: ... } }
```

### 3. Verificar App React Native
```bash
# En consola de Expo:
[Chat] Extracted assistant text (preview): "¡Claro! Te abro el mapa..."
[Chat] hasDeepLink: true
[Chat] Assistant message inserted with deep link
```

### 4. Verificar Navegación
```bash
# Al presionar "Abrir Mapa":
[Chat] Parsing deep link: fiscai://map?type=bank
[Map] Setting search type from chat: bank
[Map] Fetching places with keyword: Banorte
```

## 🎨 Mejoras Opcionales

### 1. Confirmación Visual
Agregar un ícono de mapa en el mensaje del bot:
```typescript
{item.deepLink && (
  <View style={styles.mapIndicator}>
    <MaterialCommunityIcons name="map-marker-radius" size={16} color="#FF0000" />
    <Text style={styles.mapIndicatorText}>Ubicación disponible</Text>
  </View>
)}
```

### 2. Auto-abrir Mapa (opcional)
Abrir el mapa automáticamente sin requerir clic:
```typescript
useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && !lastMessage.isUser && lastMessage.deepLink) {
    // Auto-abrir después de 2 segundos
    setTimeout(() => {
      handleDeepLink(lastMessage.deepLink!);
    }, 2000);
  }
}, [messages]);
```

### 3. Historial de Ubicaciones
Guardar las ubicaciones buscadas:
```typescript
interface LocationHistory {
  type: 'bank' | 'sat';
  query?: string;
  timestamp: Date;
}

const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
```

## 📋 Checklist de Implementación

- [ ] Agregar `SYSTEM_PROMPT` con instrucciones de ubicación
- [ ] Implementar `detect_user_intent()` en gemini.py
- [ ] Actualizar `chat_with_assistant()` para detección automática
- [ ] Verificar que `open_map_location` herramienta existe en MCP
- [ ] Agregar logs de debugging en cada paso
- [ ] Probar con diferentes variaciones de preguntas
- [ ] Verificar que el deep link se guarda en Supabase
- [ ] Verificar que el botón aparece en el chat
- [ ] Verificar que la navegación al mapa funciona
- [ ] Verificar que el mapa busca correctamente

## 🐛 Troubleshooting

### El bot no detecta preguntas de ubicación
- Verificar que `detect_user_intent()` está implementado
- Revisar las palabras clave en `location_keywords`
- Agregar logs para ver qué detecta: `print(f"Intent: {intent}")`

### El deep link no se guarda
- Verificar que `extractDeepLink()` funciona en chat.ts
- Revisar la estructura de respuesta del MCP
- Verificar permisos de la tabla messages en Supabase

### El botón no aparece
- Verificar que `item.deepLink` tiene valor
- Revisar que `toUiMessage()` extrae el payload
- Verificar estructura: `m.payload?.deep_link`

### El mapa no abre
- Verificar que el scheme `fiscai://` está en app.json
- Revisar logs de navegación con `console.log` en `handleDeepLink`
- Verificar que los parámetros se pasan correctamente

## 🚀 Listo para Usar

Una vez implementado todo lo anterior, simplemente:

1. Usuario pregunta: **"¿Dónde hay un Banorte?"**
2. Bot responde con botón: **"Abrir Mapa"**
3. Usuario presiona el botón
4. ✨ El mapa se abre mostrando Banorte cercanos

¡Así de simple!
