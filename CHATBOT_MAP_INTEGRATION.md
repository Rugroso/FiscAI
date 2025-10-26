# Integración Chatbot - Mapa

## Descripción General

Esta integración permite al chatbot de Juan Pablo abrir el mapa de la aplicación con ubicaciones específicas de bancos Banorte u oficinas del SAT, facilitando al usuario encontrar lugares para realizar trámites fiscales.

## Flujo de Funcionamiento

### 1. Usuario solicita ubicaciones en el chat

El usuario puede preguntar cosas como:
- "¿Dónde hay un Banorte cerca?"
- "Muéstrame oficinas del SAT"
- "Necesito encontrar un banco en Reforma"

### 2. El MCP Server genera un deep link

El servidor MCP (en Python) detecta la intención y llama a la herramienta `open_map_location`:

```python
@mcp.tool()
async def open_map_location(
    location_type: str,  # "bank" o "sat"
    place_id: Optional[str] = None,  # ID de Google Places (opcional)
    search_query: Optional[str] = None  # Query de búsqueda (opcional)
) -> Dict[str, Any]:
```

Esta herramienta genera un deep link con el formato:
```
fiscai://map?type=bank&placeId=ChIJ...&query=Reforma
```

### 3. El Lambda Bridge procesa la respuesta

El handler `handleMcpOpenMapLocation` en `mcp_bridge.js` llama al MCP y retorna:

```javascript
{
  success: true,
  data: {
    deep_link: "fiscai://map?type=bank&placeId=...",
    location_type: "bank",
    place_id: "ChIJ...",
    search_query: "Reforma",
    user_message: "📍 Abriendo mapa con Banorte cercanos..."
  }
}
```

### 4. El servicio de chat extrae el deep link

En `services/chat.ts`, las funciones `extractDeepLink()` y `extractAssistantText()` procesan la respuesta:

```typescript
// Extrae el deep link del payload
function extractDeepLink(resp: any): string | null {
  const payload = resp?.data ?? resp;
  return payload?.deep_link || payload?.data?.deep_link || null;
}

// Extrae el mensaje para mostrar al usuario
function extractAssistantText(resp: any): string | null {
  if (payload?.deep_link && payload?.user_message) {
    return payload.user_message; // "📍 Abriendo mapa con..."
  }
  // ... otros casos
}
```

El deep link se guarda en el campo `payload` del mensaje en Supabase:

```typescript
await supabase.from("messages").insert({
  conversation_id: conversationId,
  role: "assistant",
  content: assistantText,  // "📍 Abriendo mapa con..."
  payload: { deep_link: deepLink }  // Guarda el deep link
})
```

### 5. El componente Chat muestra el botón

En `app/(drawer)/(tabs)/stackchat/index.tsx`, la función `toUiMessage` extrae el deep link:

```typescript
export function toUiMessage(m: MessageRow, currentUserId: string) {
  return {
    id: m.id,
    text: m.content ?? "",
    isUser: m.role === "user" && m.author_id === currentUserId,
    deepLink: m.payload?.deep_link ?? undefined
  };
}
```

Y el componente renderiza un botón especial cuando hay deep link:

```tsx
{!item.isUser && item.deepLink && (
  <TouchableOpacity
    style={styles.mapButton}
    onPress={() => handleDeepLink(item.deepLink!)}
  >
    <MaterialCommunityIcons name="map-marker" size={18} color="#FFF" />
    <Text style={styles.mapButtonText}>Abrir Mapa</Text>
  </TouchableOpacity>
)}
```

### 6. El usuario presiona "Abrir Mapa"

La función `handleDeepLink()` parsea el deep link y navega al mapa:

```typescript
const handleDeepLink = (deepLink: string) => {
  const url = new URL(deepLink);
  const type = url.searchParams.get('type') as 'bank' | 'sat';
  const placeId = url.searchParams.get('placeId');
  const query = url.searchParams.get('query');

  router.push({
    pathname: '/(drawer)/(tabs)/stackmap',
    params: {
      type: type || 'bank',
      placeIdParam: placeId || 'i',
      searchQuery: query || ''
    }
  });
};
```

### 7. El mapa procesa los parámetros

En `app/(drawer)/(tabs)/stackmap/index.tsx`:

```typescript
// Leer parámetros del deep link
const typeParam = (params.type as "bank" | "sat") || undefined;
const placeIdParam = (params.placeIdParam as string) || "i";
const searchQueryParam = (params.searchQuery as string) || undefined;

// Aplicar el tipo de búsqueda
useEffect(() => {
  if (typeParam && (typeParam === 'bank' || typeParam === 'sat')) {
    setSearchType(typeParam);
  }
}, [typeParam]);

// Buscar lugares con la query específica
const fetchPlaces = async () => {
  let keyword = searchType === "bank" ? "Banorte" : "centro tributario SAT";
  if (searchQueryParam && searchQueryParam.trim() !== '') {
    keyword = `${keyword} ${searchQueryParam}`;
  }
  // Buscar en Google Places...
};

// Enfocar lugar específico si viene placeId
useEffect(() => {
  if (placeIdParam !== "i" && places.length > 0) {
    const selectedP = places.find(p => p.placeId === placeIdParam);
    if (selectedP) {
      setSelectedPlace(selectedP);
      mapRef.current?.animateToRegion({
        latitude: selectedP.latitude,
        longitude: selectedP.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }
}, [placeIdParam, places]);
```

## Ejemplos de Uso

### Ejemplo 1: Buscar bancos cercanos
```
Usuario: "¿Dónde hay un Banorte?"
Bot: "📍 Abriendo mapa con Banorte cercanos. El mapa se abrirá automáticamente."
[Botón: Abrir Mapa]
```

### Ejemplo 2: Buscar banco específico
```
Usuario: "Busca un Banorte en Reforma"
Bot: "📍 Abriendo mapa buscando: Reforma. El mapa se abrirá automáticamente."
[Botón: Abrir Mapa]
```

### Ejemplo 3: Oficinas del SAT
```
Usuario: "¿Dónde está el SAT más cercano?"
Bot: "📍 Abriendo mapa con oficinas del SAT cercanas. El mapa se abrirá automáticamente."
[Botón: Abrir Mapa]
```

## Formato del Deep Link

```
fiscai://map?type={bank|sat}&placeId={google_place_id}&query={search_query}
```

### Parámetros:

- **type** (requerido): Tipo de lugar
  - `bank`: Bancos Banorte
  - `sat`: Oficinas del SAT

- **placeId** (opcional): ID de Google Places para enfocar un lugar específico
  - Ejemplo: `ChIJN1t_tDeuEmsRUsoyG83frY4`

- **query** (opcional): Texto adicional para refinar la búsqueda
  - Ejemplo: `Reforma`, `Centro`, `Polanco`

## Estructura de Datos

### Message con Deep Link en Supabase

```sql
{
  id: uuid,
  conversation_id: uuid,
  role: 'assistant',
  content: '📍 Abriendo mapa con Banorte cercanos...',
  payload: {
    deep_link: 'fiscai://map?type=bank&placeId=ChIJ...'
  },
  created_at: timestamp
}
```

### Respuesta del MCP Server

```json
{
  "success": true,
  "data": {
    "deep_link": "fiscai://map?type=bank&placeId=ChIJ...",
    "location_type": "bank",
    "place_id": "ChIJ...",
    "search_query": "Reforma",
    "user_message": "📍 Abriendo mapa con Banorte cercanos..."
  },
  "message": "Abriendo mapa enfocado en un Banorte específico"
}
```

## Extensibilidad

Para agregar más tipos de lugares:

1. **Actualizar el MCP Server** (`mcp_server/__main__.py`):
```python
@mcp.tool()
async def open_map_location(
    location_type: str,  # Agregar nuevo tipo: "notary", "accountant", etc.
    ...
):
    if location_type not in ["bank", "sat", "notary", "accountant"]:
        return error...
```

2. **Actualizar el tipo en TypeScript** (`stackmap/index.tsx`):
```typescript
type LocationType = "bank" | "sat" | "notary" | "accountant";
const typeParam = params.type as LocationType;
```

3. **Agregar lógica de búsqueda** en `fetchPlaces()`:
```typescript
let keyword = searchType === "bank" ? "Banorte" 
            : searchType === "sat" ? "centro tributario SAT"
            : searchType === "notary" ? "notaría pública"
            : "contador público";
```

## Testing

Para probar la integración:

1. Enviar mensaje al chatbot: "¿Dónde hay un Banorte?"
2. Verificar que aparece el botón "Abrir Mapa"
3. Presionar el botón
4. Verificar que el mapa se abre mostrando bancos Banorte
5. Verificar que se puede navegar en el mapa y abrir Google Maps

## Notas Técnicas

- Los deep links usan el esquema `fiscai://` que debe estar registrado en `app.json`
- El deep link se guarda en el campo `payload` (JSONB) de la tabla `messages`
- La extracción del deep link maneja múltiples formatos de respuesta del MCP
- El componente del mapa es agnóstico a si fue abierto desde el chat o manualmente
- Los parámetros del deep link son opcionales y tienen valores por defecto
